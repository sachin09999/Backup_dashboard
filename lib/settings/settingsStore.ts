import fs from 'fs/promises';
import path from 'path';
import { MongoConnectionProfile, SettingsConfig } from '@/types/backup';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'data', 'settings.json');

const DEFAULT_LOCAL_PROFILE: MongoConnectionProfile = {
  id: 'local-docker',
  name: 'Local Docker (ast-mongodb)',
  type: 'LOCAL_DOCKER',
  containerName: process.env.MONGODB_CONTAINER || 'ast-mongodb',
  database: process.env.MONGODB_DATABASE || 'factory',
  username: process.env.MONGODB_USER || 'aspeed_db',
  password: process.env.MONGODB_PASS || 'db5274',
  authDatabase: process.env.MONGODB_AUTH_DB || 'admin'
};

const DEFAULT_SETTINGS: SettingsConfig = {
  mongodbContainer: process.env.MONGODB_CONTAINER || 'ast-mongodb',
  mongodbDatabase: process.env.MONGODB_DATABASE || 'factory',
  backupDirectory: process.env.BACKUP_DIRECTORY || '/home/rmg/mongodb-backups',
  collections: {
    plants: true,
    cameras: true
  },
  retentionDays: 30,
  autoCleanupEnabled: true,
  activeConnectionId: 'local-docker',
  connections: [DEFAULT_LOCAL_PROFILE]
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
    const parsed = JSON.parse(data);
    
    // Ensure default local profile is present if connections array is empty
    const connections = parsed.connections && parsed.connections.length > 0
      ? parsed.connections
      : [DEFAULT_LOCAL_PROFILE];
      
    const activeConnectionId = parsed.activeConnectionId || connections[0].id;

    cachedSettings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      connections,
      activeConnectionId
    };
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

export async function getActiveConnection(): Promise<MongoConnectionProfile> {
  const settings = await getSettings();
  const profile = settings.connections?.find(c => c.id === settings.activeConnectionId);
  return profile || DEFAULT_LOCAL_PROFILE;
}
