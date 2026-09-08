import fs from 'fs/promises';
import path from 'path';
import { SettingsConfig } from '@/types/backup';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'data', 'settings.json');

const DEFAULT_SETTINGS: SettingsConfig = {
  mongodbContainer: process.env.MONGODB_CONTAINER || 'ast-mongodb',
  mongodbDatabase: process.env.MONGODB_DATABASE || 'factory',
  backupDirectory: process.env.BACKUP_DIRECTORY || '/home/rmg/mongodb-backups',
  collections: {
    plants: true,
    cameras: true
  },
  retentionDays: 30,
  autoCleanupEnabled: true
};

let cachedSettings: SettingsConfig | null = null;

async function ensureDataDir() {
  const dir = path.join(process.cwd(), 'data');
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // ignore
  }
}

export async function getSettings(): Promise<SettingsConfig> {
  if (cachedSettings) return cachedSettings;
  try {
    await ensureDataDir();
    const data = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
    cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    cachedSettings = { ...DEFAULT_SETTINGS };
  }
  return cachedSettings || DEFAULT_SETTINGS;
}

export async function updateSettings(newSettings: Partial<SettingsConfig>): Promise<SettingsConfig> {
  const current = await getSettings();
  cachedSettings = { ...current, ...newSettings };
  try {
    await ensureDataDir();
    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(cachedSettings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
  return cachedSettings;
}
