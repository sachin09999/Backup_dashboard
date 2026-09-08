import fs from 'fs/promises';
import path from 'path';
import { getSettings } from '@/lib/settings/settingsStore';
import { getAllBackups, getBackupDirectory } from '@/lib/backup/backupScanner';
import { addLog } from '@/lib/logs/logger';

export async function runRetentionCleanup(): Promise<{ deletedCount: number; deletedIds: string[] }> {
  const settings = await getSettings();

  if (!settings.autoCleanupEnabled || settings.retentionDays <= 0) {
    return { deletedCount: 0, deletedIds: [] };
  }

  const cutoffTime = Date.now() - settings.retentionDays * 24 * 60 * 60 * 1000;
  const backups = await getAllBackups();
  const baseDir = await getBackupDirectory();

  const deletedIds: string[] = [];

  for (const backup of backups) {
    const backupTime = new Date(backup.backupDate).getTime();
    if (backupTime < cutoffTime) {
      const folderPath = path.join(baseDir, backup.id);
      try {
        await fs.rm(folderPath, { recursive: true, force: true });
        deletedIds.push(backup.id);
        await addLog('INFO', `Retention policy automatically deleted backup "${backup.id}" (older than ${settings.retentionDays} days)`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        await addLog('ERROR', `Failed to delete old backup "${backup.id}": ${msg}`);
      }
    }
  }

  if (deletedIds.length > 0) {
    await addLog('SUCCESS', `Retention cleanup complete: ${deletedIds.length} old backups removed`);
  }

  return { deletedCount: deletedIds.length, deletedIds };
}
