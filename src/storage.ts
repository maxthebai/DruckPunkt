import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, DEFAULT_SETTINGS, Measurement } from './types';

const KEY = 'druckpunkt:data:v1';

export const emptyData = (): AppData => ({
  measurements: [],
  settings: { ...DEFAULT_SETTINGS },
});

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
  const s = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
  return {
    measurements: ms,
    settings: {
      ...DEFAULT_SETTINGS,
      ...s,
      reminderTimes: Array.isArray(s.reminderTimes) ? s.reminderTimes : DEFAULT_SETTINGS.reminderTimes,
    },
  };
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
