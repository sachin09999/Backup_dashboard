import { NextResponse } from 'next/server';
import { checkMongoHealth } from '@/lib/mongodb/mongoClient';
import { checkDockerContainer } from '@/lib/docker/dockerService';
import { getAllBackups, getBackupDirectory } from '@/lib/backup/backupScanner';
import { SystemHealth } from '@/types/backup';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const mongoHealth = await checkMongoHealth();
    const dockerHealth = await checkDockerContainer();

    let backupHealthStatus: SystemHealth['backups'] = {
      status: 'ACCESSIBLE',
      directory: process.env.BACKUP_DIRECTORY || '/home/rmg/mongodb-backups',
      totalBackups: 0,
      totalSizeBytes: 0,
      formattedTotalSize: '0 Bytes'
    };

    try {
      const backupDir = await getBackupDirectory();
      const backups = await getAllBackups();
      const totalSizeBytes = backups.reduce((acc, b) => acc + b.totalSizeBytes, 0);

      // Check write permission by attempting a stat/access
      await fs.access(backupDir, fs.constants.R_OK | fs.constants.W_OK);

      const lastBackup = backups[0];

      backupHealthStatus = {
        status: 'ACCESSIBLE',
        directory: backupDir,
        totalBackups: backups.length,
        totalSizeBytes,
        formattedTotalSize: `${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB`,
        lastBackupDate: lastBackup?.backupDate,
        lastBackupStatus: lastBackup?.status
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      backupHealthStatus = {
        status: 'NOT_ACCESSIBLE',
        directory: process.env.BACKUP_DIRECTORY || '/home/rmg/mongodb-backups',
        totalBackups: 0,
        totalSizeBytes: 0,
        formattedTotalSize: '0 Bytes',
        error: `Backup directory access error: ${msg}`
      };
    }

    const systemHealth: SystemHealth = {
      mongodb: mongoHealth,
      docker: dockerHealth,
      backups: backupHealthStatus,
      serverTime: new Date().toISOString()
    };

    return NextResponse.json(systemHealth);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
