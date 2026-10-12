export type Measurement = {
  id: string;
  ts: string; // ISO-Zeitstempel
  sys: number; // systolisch
  dia: number; // diastolisch
  pulse: number;
  tags: string[];
  note: string;
};

export type MedKind = 'start' | 'increase' | 'decrease' | 'stop' | 'other';

export type MedChange = {
  id: string;
  ts: string; // ISO-Zeitstempel der Änderung
  name: string; // Medikament
  kind: MedKind;
  dose: string; // freier Text, z. B. "5 mg morgens"
  note: string;
};

export const MED_KINDS: { key: MedKind; label: string }[] = [
  { key: 'start', label: 'Neu begonnen' },
  { key: 'increase', label: 'Dosis erhöht' },
  { key: 'decrease', label: 'Dosis verringert' },
  { key: 'stop', label: 'Abgesetzt' },
  { key: 'other', label: 'Sonstiges' },
];

export const medKindLabel = (k: MedKind) => MED_KINDS.find((x) => x.key === k)?.label ?? 'Sonstiges';

// Wochentage: 1 = Montag ... 7 = Sonntag
export type Reminder = {
  id: string;
  time: string; // "HH:MM"
  days: number[];
  on: boolean;
};

export const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export type Settings = {
  remindersOn: boolean;
  reminders: Reminder[];
  weeklyGoal: number;
  backupReminder: boolean;
  lastBackup: string | null;
};

export type AppData = {
  measurements: Measurement[];
  medChanges: MedChange[];
  settings: Settings;
};

export type BackupFile = {
  app: 'DruckPunkt';
  version: number;
  exportedAt: string;
  data: AppData;
};

export const BACKUP_VERSION = 2;

export const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

export const DEFAULT_REMINDERS: Reminder[] = [
  { id: 'r-morgens', time: '08:00', days: ALL_DAYS, on: true },
  { id: 'r-abends', time: '20:00', days: ALL_DAYS, on: true },
];

export const DEFAULT_SETTINGS: Settings = {
  remindersOn: true,
  reminders: DEFAULT_REMINDERS,
  weeklyGoal: 5,
  backupReminder: true,
  lastBackup: null,
};

export const TAGS = ['Stress', 'Kaffee', 'Sport', 'Medikamente genommen'];
