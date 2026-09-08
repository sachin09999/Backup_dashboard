import fs from 'fs/promises';
import path from 'path';
import { BackupMetadata } from '@/types/backup';
import { formatBytes, formatDuration, parseTimestampFolderName } from '@/lib/utils/formatters';
import { validateBackupFolder } from '@/lib/backup/backupValidator';
import { addLog } from '@/lib/logs/logger';

export async function getBackupDirectory(): Promise<string> {
  const configuredDir = process.env.BACKUP_DIRECTORY || '/home/rmg/mongodb-backups';
  try {
    await fs.mkdir(configuredDir, { recursive: true });
    return configuredDir;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const fallbackDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(fallbackDir, { recursive: true });
    await addLog('WARNING', `Could not access configured BACKUP_DIRECTORY "${configuredDir}": ${errorMsg}. Falling back to "${fallbackDir}"`);
    return fallbackDir;
  }
}

export async function scanBackupFolder(folderName: string, baseDir: string): Promise<BackupMetadata | null> {
  const folderPath = path.join(baseDir, folderName);
  try {
    const stat = await fs.stat(folderPath);
    if (!stat.isDirectory()) return null;

    const metadataPath = path.join(folderPath, 'metadata.json');
    let metadata: Partial<BackupMetadata> | null = null;

    try {
      const metaContent = await fs.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(metaContent);
    } catch {
      // metadata.json missing or invalid -> infer from directory and files
    }

    const { date, formattedDate, formattedTime } = parseTimestampFolderName(folderName);

    // Validate files inside directory
    const validation = await validateBackupFolder(folderPath);

    const backupDateIso = metadata?.backupDate || (date ? date.toISOString() : stat.mtime.toISOString());

    const resultMetadata: BackupMetadata = {
      id: folderName,
      backupDate: backupDateIso,
      formattedDate: metadata?.formattedDate || formattedDate,
      formattedTime: metadata?.formattedTime || formattedTime,
      database: metadata?.database || process.env.MONGODB_DATABASE || 'factory',
      collections: metadata?.collections || validation.collections,
      totalDocuments: metadata?.totalDocuments ?? validation.totalDocuments,
      totalSizeBytes: metadata?.totalSizeBytes ?? validation.totalSizeBytes,
      formattedTotalSize: formatBytes(metadata?.totalSizeBytes ?? validation.totalSizeBytes),
      status: metadata?.status || (validation.isValid ? 'SUCCESS' : 'FAILED'),
      durationMs: metadata?.durationMs || 0,
      durationFormatted: formatDuration(metadata?.durationMs || 0),
      errorMessage: metadata?.errorMessage || (validation.errors.length > 0 ? validation.errors.join('; ') : undefined)
    };

    // If metadata.json was missing, save generated metadata.json for fast subsequent loads
    if (!metadata) {
      try {
        await fs.writeFile(metadataPath, JSON.stringify(resultMetadata, null, 2), 'utf-8');
      } catch {
        // non-fatal if write fails
      }
    }

    return resultMetadata;
  } catch (err) {
    console.error(`Error scanning folder ${folderName}:`, err);
    return null;
  }
}

export async function getAllBackups(): Promise<BackupMetadata[]> {
  const baseDir = await getBackupDirectory();
  try {
    const entries = await fs.readdir(baseDir);
    const backups: BackupMetadata[] = [];

    for (const entry of entries) {
      // Ignore hidden files or temp files
      if (entry.startsWith('.')) continue;
      const meta = await scanBackupFolder(entry, baseDir);
      if (meta) {
        backups.push(meta);
      }
    }

    // Sort by backupDate descending (newest first)
    backups.sort((a, b) => new Date(b.backupDate).getTime() - new Date(a.backupDate).getTime());
    return backups;
  } catch (err) {
    console.error('Error scanning backup directory:', err);
    return [];
  }
}

export async function getBackupById(id: string): Promise<BackupMetadata | null> {
  // Prevent path traversal security check
  if (id.includes('..') || id.includes('/') || id.includes('\\')) {
    throw new Error('Invalid backup ID (path traversal detected)');
  }
  const baseDir = await getBackupDirectory();
  return scanBackupFolder(id, baseDir);
}
