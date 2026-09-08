import fs from 'fs/promises';
import path from 'path';
import * as cron from 'node-cron';
import { ScheduleConfig } from '@/types/backup';
import { executeBackup } from '@/lib/backup/backupEngine';
import { runRetentionCleanup } from '@/lib/backup/retentionCleaner';
import { addLog } from '@/lib/logs/logger';

const SCHEDULE_FILE_PATH = path.join(process.cwd(), 'data', 'schedule.json');

const DEFAULT_SCHEDULE: ScheduleConfig = {
  enabled: false,
  frequency: 'daily',
  dailyTime: '02:00',
  weeklyDay: 'Sunday',
  weeklyTime: '02:00'
};

let currentCronTask: cron.ScheduledTask | null = null;
let cachedSchedule: ScheduleConfig | null = null;

async function ensureDataDir() {
  const dir = path.join(process.cwd(), 'data');
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // ignore
  }
}

export async function getScheduleConfig(): Promise<ScheduleConfig> {
  if (cachedSchedule) return cachedSchedule;
  try {
    await ensureDataDir();
    const data = await fs.readFile(SCHEDULE_FILE_PATH, 'utf-8');
    cachedSchedule = { ...DEFAULT_SCHEDULE, ...JSON.parse(data) };
  } catch {
    cachedSchedule = { ...DEFAULT_SCHEDULE };
  }
  return cachedSchedule || DEFAULT_SCHEDULE;
}

export function buildCronExpression(config: ScheduleConfig): string | null {
  if (!config.enabled) return null;

  if (config.frequency === 'hourly') {
    // Top of every hour
    return '0 * * * *';
  } else if (config.frequency === 'daily') {
    // e.g. "02:00" -> 0 2 * * *
    const [hourStr, minStr] = (config.dailyTime || '02:00').split(':');
    const minute = parseInt(minStr, 10) || 0;
    const hour = parseInt(hourStr, 10) || 2;
    return `${minute} ${hour} * * *`;
  } else if (config.frequency === 'weekly') {
    const dayMap: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
    };
    const dayNum = dayMap[config.weeklyDay] ?? 0;
    const [hourStr, minStr] = (config.weeklyTime || '02:00').split(':');
    const minute = parseInt(minStr, 10) || 0;
    const hour = parseInt(hourStr, 10) || 2;
    return `${minute} ${hour} * * ${dayNum}`;
  }
  return null;
}

export async function saveScheduleConfig(newConfig: Partial<ScheduleConfig>): Promise<ScheduleConfig> {
  const current = await getScheduleConfig();
  cachedSchedule = { ...current, ...newConfig };

  try {
    await ensureDataDir();
    await fs.writeFile(SCHEDULE_FILE_PATH, JSON.stringify(cachedSchedule, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save schedule configuration:', err);
  }

  // Re-initialize cron schedule
  await initScheduler();
  return cachedSchedule;
}

export async function initScheduler(): Promise<void> {
  if (currentCronTask) {
    currentCronTask.stop();
    currentCronTask = null;
  }

  const config = await getScheduleConfig();
  const cronExpr = buildCronExpression(config);

  if (!config.enabled || !cronExpr) {
    await addLog('INFO', 'Backup scheduler is currently disabled');
    return;
  }

  if (!cron.validate(cronExpr)) {
    await addLog('ERROR', `Invalid cron expression generated: ${cronExpr}`);
    return;
  }

  await addLog('INFO', `Initializing backup scheduler with schedule: ${cronExpr} (${config.frequency})`);

  currentCronTask = cron.schedule(cronExpr, async () => {
    await addLog('INFO', 'Scheduled backup task triggered automatically by scheduler');
    try {
      const backup = await executeBackup();
      await addLog('SUCCESS', `Scheduled backup completed successfully: ${backup.id}`);

      // Run retention policy cleanup right after successful backup
      await runRetentionCleanup().catch((err) => {
        console.error('Retention cleanup error during scheduled backup:', err);
      });

      // Update lastRun in schedule config
      const updated = await getScheduleConfig();
      updated.lastRun = new Date().toISOString();
      await fs.writeFile(SCHEDULE_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await addLog('ERROR', `Scheduled backup failed: ${msg}`);
    }
  });
}
