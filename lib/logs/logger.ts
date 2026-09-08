import fs from 'fs/promises';
import path from 'path';
import { LogEntry } from '@/types/backup';

const LOG_FILE_PATH = path.join(process.cwd(), 'data', 'logs.json');
const MAX_LOG_ENTRIES = 1000;

// In-memory cache of logs
let logCache: LogEntry[] = [];
let loaded = false;

async function ensureDataDir() {
  const dir = path.join(process.cwd(), 'data');
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // ignore
  }
}

function sanitizeMessage(msg: string): string {
  if (!msg) return '';
  // Mask mongo password patterns like --password=XYZ or mongodb://user:pass@
  return msg
    .replace(/--password=\S+/g, '--password=***')
    .replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@)/g, '$1***$2');
}

export async function getLogs(): Promise<LogEntry[]> {
  if (loaded) return logCache;
  try {
    await ensureDataDir();
    const data = await fs.readFile(LOG_FILE_PATH, 'utf-8');
    logCache = JSON.parse(data);
    loaded = true;
  } catch {
    logCache = [
      {
        id: 'init-1',
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Log system initialized'
      }
    ];
    loaded = true;
  }
  return logCache;
}

export async function addLog(
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR',
  message: string,
  details?: Record<string, unknown>
): Promise<LogEntry> {
  const logs = await getLogs();
  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    level,
    message: sanitizeMessage(message),
    details
  };

  logs.unshift(entry);
  if (logs.length > MAX_LOG_ENTRIES) {
    logs.length = MAX_LOG_ENTRIES;
  }

  try {
    await ensureDataDir();
    await fs.writeFile(LOG_FILE_PATH, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write log file:', err);
  }

  return entry;
}

export async function clearLogs(): Promise<void> {
  logCache = [];
  try {
    await ensureDataDir();
    await fs.writeFile(LOG_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to clear logs:', err);
  }
}
