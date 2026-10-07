export type Measurement = {
  id: string;
  ts: string; // ISO-Zeitstempel
  sys: number;
  dia: number;
  pulse: number;
  tags: string[];
  note: string;
};

export type Settings = {
  remindersOn: boolean;
  reminderTimes: string[]; // "HH:MM"
  weeklyGoal: number;
  backupReminder: boolean;
  lastBackup: string | null;
};

export type AppData = {
  measurements: Measurement[];
  settings: Settings;
};

export type BackupFile = {
  app: 'DruckPunkt';
  version: number;
  exportedAt: string;
  data: AppData;
};

export const BACKUP_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  remindersOn: true,
  reminderTimes: ['08:00', '20:00'],
  weeklyGoal: 5,
  backupReminder: true,
  lastBackup: null,
};

export const TAGS = ['Stress', 'Kaffee', 'Sport', 'Medikamente genommen'];
