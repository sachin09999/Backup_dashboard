export interface CollectionInfo {
  name: string;
  count: number;
}

export interface CollectionBackupMeta {
  documents: number;
  file: string;
  size: number;
  status: 'valid' | 'invalid' | 'missing';
}

export interface BackupMetadata {
  id: string; // Timestamp folder name: D-MMM-YYYY_HH-MM-SS
  backupDate: string; // ISO string
  formattedDate: string;
  formattedTime: string;
  database: string;
  collections: Record<string, CollectionBackupMeta>;
  totalDocuments: number;
  totalSizeBytes: number;
  formattedTotalSize: string;
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
  durationMs: number;
  durationFormatted: string;
  errorMessage?: string;
}

export interface SystemHealth {
  mongodb: {
    status: 'ONLINE' | 'OFFLINE';
    version?: string;
    database?: string;
    collections?: CollectionInfo[];
    error?: string;
  };
  docker: {
    status: 'RUNNING' | 'STOPPED' | 'NOT_FOUND';
    containerName: string;
    containerId?: string;
    uptime?: string;
    error?: string;
  };
  backups: {
    status: 'ACCESSIBLE' | 'READ_ONLY' | 'NOT_ACCESSIBLE';
    directory: string;
    totalBackups: number;
    totalSizeBytes: number;
    formattedTotalSize: string;
    lastBackupDate?: string;
    lastBackupStatus?: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
    error?: string;
  };
  serverTime: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
  details?: Record<string, unknown>;
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly';
  dailyTime: string; // e.g. "02:00"
  weeklyDay: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  weeklyTime: string; // e.g. "02:00"
  lastRun?: string;
  nextRun?: string;
}

export interface SettingsConfig {
  mongodbContainer: string;
  mongodbDatabase: string;
  backupDirectory: string;
  collections: {
    plants: boolean;
    cameras: boolean;
  };
  retentionDays: number; // 7, 14, 30, 60, 90, 0 (forever)
  autoCleanupEnabled: boolean;
}

export interface SSEProgressEvent {
  step: number;
  totalSteps: number;
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  message: string;
  data?: Partial<BackupMetadata>;
}
