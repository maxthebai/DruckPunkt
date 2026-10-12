import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_DAYS, AppData, DEFAULT_REMINDERS, DEFAULT_SETTINGS, MedChange, MedKind, Measurement, Reminder, Settings } from './types';

const KEY = 'druckpunkt:data:v1';

export const emptyData = (): AppData => ({
  measurements: [],
  medChanges: [],
  settings: { ...DEFAULT_SETTINGS, reminders: DEFAULT_REMINDERS.map((r) => ({ ...r })) },
});

const validTime = (t: any) => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
const KINDS: MedKind[] = ['start', 'increase', 'decrease', 'stop', 'other'];

function sanitizeSettings(s: any): Settings {
  const base: Settings = { ...DEFAULT_SETTINGS, reminders: DEFAULT_REMINDERS.map((r) => ({ ...r })) };
  if (!s || typeof s !== 'object') return base;
  let reminders: Reminder[] | null = null;
  if (Array.isArray(s.reminders)) {
    reminders = s.reminders
      .filter((r: any) => r && validTime(r.time))
      .map((r: any, i: number) => ({
        id: typeof r.id === 'string' ? r.id : `r-${i}-${r.time}`,
        time: r.time,
        days: Array.isArray(r.days) ? r.days.filter((d: any) => Number.isInteger(d) && d >= 1 && d <= 7) : ALL_DAYS,
        on: r.on !== false,
      }));
  } else if (Array.isArray(s.reminderTimes)) {
    // Migration aus Version 1: eine Uhrzeit-Liste, täglich
    reminders = s.reminderTimes
      .filter(validTime)
      .map((t: string, i: number) => ({ id: `r-alt-${i}-${t}`, time: t, days: ALL_DAYS, on: true }));
  }
  return {
    remindersOn: typeof s.remindersOn === 'boolean' ? s.remindersOn : base.remindersOn,
    reminders: reminders ?? base.reminders,
    weeklyGoal: Number.isFinite(s.weeklyGoal) ? Math.min(21, Math.max(1, Math.round(s.weeklyGoal))) : base.weeklyGoal,
    backupReminder: typeof s.backupReminder === 'boolean' ? s.backupReminder : base.backupReminder,
    lastBackup: typeof s.lastBackup === 'string' ? s.lastBackup : null,
  };
}

export function sanitize(raw: any): AppData | null {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.measurements)) return null;
  const ms: Measurement[] = [];
  for (const m of raw.measurements) {
    if (
      m &&
      typeof m.ts === 'string' &&
      !isNaN(new Date(m.ts).getTime()) &&
      Number.isFinite(m.sys) &&
      Number.isFinite(m.dia) &&
      Number.isFinite(m.pulse)
    ) {
      ms.push({
        id: typeof m.id === 'string' ? m.id : `${m.ts}-${m.sys}`,
        ts: m.ts,
        sys: Math.round(m.sys),
        dia: Math.round(m.dia),
        pulse: Math.round(m.pulse),
        tags: Array.isArray(m.tags) ? m.tags.filter((t: any) => typeof t === 'string') : [],
        note: typeof m.note === 'string' ? m.note : '',
      });
    } else {
      return null; // beschädigte Datei: nichts übernehmen
    }
  }
  const meds: MedChange[] = [];
  if (raw.medChanges !== undefined) {
    if (!Array.isArray(raw.medChanges)) return null;
    for (const m of raw.medChanges) {
      if (m && typeof m.ts === 'string' && !isNaN(new Date(m.ts).getTime()) && typeof m.name === 'string') {
        meds.push({
          id: typeof m.id === 'string' ? m.id : `med-${m.ts}-${m.name}`,
          ts: m.ts,
          name: m.name,
          kind: KINDS.includes(m.kind) ? m.kind : 'other',
          dose: typeof m.dose === 'string' ? m.dose : '',
          note: typeof m.note === 'string' ? m.note : '',
        });
      } else {
        return null;
      }
    }
  }
  return { measurements: ms, medChanges: meds, settings: sanitizeSettings(raw.settings) };
}

export async function loadData(): Promise<AppData> {
  try {
    const txt = await AsyncStorage.getItem(KEY);
    if (!txt) return emptyData();
    return sanitize(JSON.parse(txt)) ?? emptyData();
  } catch {
    return emptyData();
  }
}

export async function saveData(d: AppData): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(d));
}
