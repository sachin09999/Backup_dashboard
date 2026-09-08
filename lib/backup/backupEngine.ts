import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { BackupMetadata, SSEProgressEvent } from '@/types/backup';
import { formatBytes, formatDuration, generateTimestampFolderName, parseTimestampFolderName } from '@/lib/utils/formatters';
import { getBackupDirectory } from '@/lib/backup/backupScanner';
import { validateBackupFolder } from '@/lib/backup/backupValidator';
import { addLog } from '@/lib/logs/logger';
import { checkDockerContainer } from '@/lib/docker/dockerService';
import { checkMongoHealth } from '@/lib/mongodb/mongoClient';

const execAsync = promisify(exec);

import { getActiveConnection, getSettings } from '@/lib/settings/settingsStore';

export type ProgressCallback = (event: SSEProgressEvent) => void;

export async function executeBackup(onProgress?: ProgressCallback, customCollections?: string[]): Promise<BackupMetadata> {
  const startTime = Date.now();
  const profile = await getActiveConnection();
  const settings = await getSettings();

  const dbName = profile.database || 'factory';
  
  // Determine collections to export
  let collectionsToExport: string[] = [];
  if (customCollections && customCollections.length > 0) {
    collectionsToExport = customCollections;
  } else {
    // Check enabled collections in settings or health
    const enabledInSettings = Object.entries(settings.collections || {})
      .filter(([, enabled]) => enabled)
      .map(([col]) => col);
      
    if (enabledInSettings.length > 0) {
      collectionsToExport = enabledInSettings;
    } else {
      collectionsToExport = ['plants', 'cameras'];
    }
  }

  const reportProgress = (step: number, message: string, status: SSEProgressEvent['status'] = 'in_progress', data?: Partial<BackupMetadata>) => {
    if (onProgress) {
      onProgress({
        step,
        totalSteps: 7,
        status,
        message,
        data
      });
    }
  };

  await addLog('INFO', `Backup execution started for target: ${profile.name} (${profile.type})`);
  reportProgress(1, `Connecting to MongoDB (${profile.name})...`);

  // Step 1: Check Docker container (if local) & MongoDB health
  if (profile.type === 'LOCAL_DOCKER') {
    const containerName = profile.containerName || 'ast-mongodb';
    const dockerHealth = await checkDockerContainer(containerName);
    if (dockerHealth.status !== 'RUNNING') {
      const err = `Docker container "${containerName}" is not running (${dockerHealth.status})`;
      await addLog('ERROR', err);
      reportProgress(1, err, 'failed');
      throw new Error(err);
    }
  }

  const mongoHealth = await checkMongoHealth(profile);
  if (mongoHealth.status !== 'ONLINE') {
    const err = `MongoDB server "${profile.name}" is offline: ${mongoHealth.error || 'Connection failed'}`;
    await addLog('ERROR', err);
    reportProgress(1, err, 'failed');
    throw new Error(err);
  }

  await addLog('SUCCESS', `Connected to MongoDB (${profile.name}) - database "${dbName}"`);
  reportProgress(1, `Connected to MongoDB database "${dbName}" (${profile.name})`, 'completed');

  // Create unique timestamp folder
  const baseBackupDir = await getBackupDirectory();
  let timestampFolder = generateTimestampFolderName();
  let targetFolder = path.join(baseBackupDir, timestampFolder);

  // Handle timestamp folder collision
  let suffix = 1;
  while (true) {
    try {
      await fs.stat(targetFolder);
      // Folder exists -> append suffix
      timestampFolder = `${generateTimestampFolderName()}_${suffix}`;
      targetFolder = path.join(baseBackupDir, timestampFolder);
      suffix++;
    } catch {
      // Folder does not exist -> proceed
      break;
    }
  }

  await fs.mkdir(targetFolder, { recursive: true });
  await addLog('INFO', `Created backup directory: ${targetFolder}`);

  // Step 2 & 3: Export collections
  let stepNumber = 2;

  for (const col of collectionsToExport) {
    reportProgress(stepNumber, `Exporting collection "${col}"...`);
    await addLog('INFO', `Exporting collection "${col}" from database "${dbName}" (${profile.name})`);

    const hostTargetFile = path.join(targetFolder, `${col}.json`);

    try {
      if (profile.type === 'REMOTE_URI' && profile.uri) {
        const exportCmd = `mongoexport --uri="${profile.uri}" --collection=${col} --out="${hostTargetFile}" --jsonArray`;
        await execAsync(exportCmd);
      } else if (profile.type === 'REMOTE_URI' && profile.host) {
        const port = profile.port || 27017;
        const authDb = profile.authDatabase || 'admin';
        const user = profile.username ? `--username=${profile.username}` : '';
        const pass = profile.password ? `--password="${profile.password}"` : '';
        const exportCmd = `mongoexport --host=${profile.host} --port=${port} ${user} ${pass} --authenticationDatabase=${authDb} --db=${dbName} --collection=${col} --out="${hostTargetFile}" --jsonArray`;
        await execAsync(exportCmd);
      } else {
        // LOCAL_DOCKER
        const containerName = profile.containerName || 'ast-mongodb';
        const containerTmpFile = `/tmp/${col}_export.json`;
        const mongoUser = profile.username || process.env.MONGODB_USER || 'aspeed_db';
        const mongoPass = profile.password || process.env.MONGODB_PASS || 'db5274';
        const authDb = profile.authDatabase || process.env.MONGODB_AUTH_DB || 'admin';

        const exportCmd = `docker exec ${containerName} mongoexport --host=localhost --port=27017 --username=${mongoUser} --password="${mongoPass}" --authenticationDatabase=${authDb} --db=${dbName} --collection=${col} --out=${containerTmpFile} --jsonArray`;
        await execAsync(exportCmd);

        // Copy file from container to host backup directory
        const cpCmd = `docker cp ${containerName}:${containerTmpFile} "${hostTargetFile}"`;
        await execAsync(cpCmd);

        // Remove temp file inside container
        await execAsync(`docker exec ${containerName} rm -f ${containerTmpFile}`).catch(() => {});
      }

      // Post-process file to match MongoDB Compass export format exactly (2-space indents, [{...}])
      try {
        const rawContent = await fs.readFile(hostTargetFile, 'utf-8');
        const parsedContent = JSON.parse(rawContent);
        if (Array.isArray(parsedContent)) {
          const compassFormatted = formatCompassJson(parsedContent);
          await fs.writeFile(hostTargetFile, compassFormatted, 'utf-8');
        }
      } catch (reformatErr) {
        await addLog('WARNING', `Could not reformat "${col}" to Compass JSON format: ${reformatErr}`);
      }

      // Check file stats on host
      const stat = await fs.stat(hostTargetFile);
      await addLog('SUCCESS', `Exported "${col}" successfully (${formatBytes(stat.size)})`);
      reportProgress(stepNumber, `Exported ${col} (${formatBytes(stat.size)})`, 'completed');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await addLog('ERROR', `Failed to export collection "${col}": ${errorMsg}`);
      reportProgress(stepNumber, `Failed to export "${col}"`, 'failed');
      throw new Error(`Export failed for collection ${col}: ${errorMsg}`);
    }

    stepNumber++;
  }

  // Step 4: Validate JSON files
  reportProgress(4, 'Validating JSON format and verifying document integrity...');
  await addLog('INFO', 'Validating backup JSON files');

  const validation = await validateBackupFolder(targetFolder, collectionsToExport);

  if (!validation.isValid) {
    const validationError = `Backup JSON validation failed: ${validation.errors.join('; ')}`;
    await addLog('ERROR', validationError);
    reportProgress(4, validationError, 'failed');
    throw new Error(validationError);
  }

  await addLog('SUCCESS', 'JSON validation completed successfully for all collections');
  reportProgress(4, `JSON validated (${validation.totalDocuments} total documents verified)`, 'completed');

  // Step 5: Calculating file sizes & stats
  reportProgress(5, 'Calculating file sizes and metrics...');
  const durationMs = Date.now() - startTime;
  const { formattedDate, formattedTime } = parseTimestampFolderName(timestampFolder);

  // Step 6: Creating backup metadata
  reportProgress(6, 'Creating backup metadata.json...');

  const metadata: BackupMetadata = {
    id: timestampFolder,
    backupDate: new Date().toISOString(),
    formattedDate,
    formattedTime,
    database: dbName,
    collections: validation.collections,
    totalDocuments: validation.totalDocuments,
    totalSizeBytes: validation.totalSizeBytes,
    formattedTotalSize: formatBytes(validation.totalSizeBytes),
    status: 'SUCCESS',
    durationMs,
    durationFormatted: formatDuration(durationMs)
  };

  const metadataPath = path.join(targetFolder, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  await addLog('SUCCESS', `Metadata saved to ${metadataPath}`);
  reportProgress(6, 'Backup metadata created', 'completed');

  // Step 7: Backup completed
  await addLog('SUCCESS', `Backup "${timestampFolder}" completed successfully in ${formatDuration(durationMs)} (${validation.totalDocuments} documents, ${formatBytes(validation.totalSizeBytes)})`);
  reportProgress(7, `Backup ${timestampFolder} completed successfully!`, 'completed', metadata);

  return metadata;
}

/**
 * Formats an array of JSON objects to match MongoDB Compass export format exactly:
 * - 2 spaces indentation
 * - Starts with `[{` on line 1
 * - Top-level array items separated by `},\n{`
 * - Ends with `}]` on line last
 */
export function formatCompassJson(arr: unknown[]): string {
  if (!Array.isArray(arr) || arr.length === 0) return '[]';
  const formattedItems = arr.map(item => JSON.stringify(item, null, 2));
  if (formattedItems.length === 1) return '[' + formattedItems[0] + ']';

  const first = '[' + formattedItems[0] + ',';
  const last = formattedItems[formattedItems.length - 1] + ']';

  if (formattedItems.length === 2) {
    return first + '\n' + last;
  }

  const middle = formattedItems.slice(1, -1).map(item => item + ',').join('\n');
  return first + '\n' + middle + '\n' + last;
}
