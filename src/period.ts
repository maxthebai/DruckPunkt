import { Measurement, MedChange } from './types';
import { fmtDate, pad } from './dates';

export type PeriodKey = 'all' | '7' | '30' | '90' | 'thisMonth' | 'lastMonth' | 'custom';

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'all', label: 'Alles' },
  { key: '7', label: '7 Tage' },
  { key: '30', label: '30 Tage' },
  { key: '90', label: '90 Tage' },
  { key: 'thisMonth', label: 'Dieser Monat' },
  { key: 'lastMonth', label: 'Letzter Monat' },
  { key: 'custom', label: 'Eigener Zeitraum' },
];

export type Period = { from: Date | null; to: Date | null; label: string; error?: string };

// "TT.MM.JJJJ" -> Date (lokal, 00:00), sonst null
export function parseDate(t: string): Date | null {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(t.trim());
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

export const fmtInput = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

export function resolvePeriod(key: PeriodKey, customFrom: string, customTo: string): Period {
  const now = new Date();
  switch (key) {
    case 'all':
      return { from: null, to: null, label: 'Gesamter Zeitraum' };
    case '7':
    case '30':
    case '90': {
      const n = Number(key);
      const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (n - 1)));
      return { from, to: endOfDay(now), label: `Letzte ${n} Tage (${fmtDate(from)} bis ${fmtDate(now)})` };
    }
    case 'thisMonth': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: endOfDay(now), label: `${fmtDate(from)} bis ${fmtDate(now)}` };
    }
    case 'lastMonth': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from, to: endOfDay(to), label: `${fmtDate(from)} bis ${fmtDate(to)}` };
    }
    case 'custom': {
      const f = parseDate(customFrom);
      const t = parseDate(customTo);
      if (!f || !t) return { from: null, to: null, label: '', error: 'Bitte Datum im Format TT.MM.JJJJ eingeben, z. B. 01.09.2026.' };
      if (f > t) return { from: null, to: null, label: '', error: 'Das Startdatum liegt nach dem Enddatum.' };
      return { from: startOfDay(f), to: endOfDay(t), label: `${fmtDate(f)} bis ${fmtDate(t)}` };
    }
  }
}

export function inPeriod<T extends { ts: string }>(list: T[], p: Period): T[] {
  return list.filter((x) => {
    const t = new Date(x.ts).getTime();
    return (!p.from || t >= p.from.getTime()) && (!p.to || t <= p.to.getTime());
  });
}

export type Filtered = { measurements: Measurement[]; meds: MedChange[] };
