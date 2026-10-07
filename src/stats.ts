import { Measurement } from './types';
import { dayKey, startOfWeek } from './dates';

export function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function averages(list: Measurement[]) {
  return {
    sys: avg(list.map((m) => m.sys)),
    dia: avg(list.map((m) => m.dia)),
    pulse: avg(list.map((m) => m.pulse)),
    count: list.length,
  };
}

function daySet(list: Measurement[]): Set<string> {
  return new Set(list.map((m) => dayKey(new Date(m.ts))));
}

export function currentStreak(list: Measurement[]): number {
  const days = daySet(list);
  const d = new Date();
  // Wenn heute noch nicht gemessen wurde, zählt die Serie ab gestern weiter.
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function bestStreak(list: Measurement[]): number {
  const keys = [...daySet(list)].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of keys) {
    const [y, m, d] = k.split('-').map(Number);
    const cur = new Date(y, m - 1, d);
    if (prev) {
      const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
      run = diff === 1 ? run + 1 : 1;
    } else run = 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return best;
}

export function measuredToday(list: Measurement[]): boolean {
  return daySet(list).has(dayKey(new Date()));
}

export function weekCount(list: Measurement[]): number {
  const start = startOfWeek(new Date()).getTime();
  return list.filter((m) => new Date(m.ts).getTime() >= start).length;
}

export type Achievement = { id: string; title: string; text: string; done: boolean };

export function achievements(list: Measurement[], goal: number): Achievement[] {
  const best = bestStreak(list);
  return [
    { id: 'first', title: 'Erster Eintrag', text: 'Du hast deine erste Messung gespeichert.', done: list.length >= 1 },
    { id: 's3', title: '3 Tage in Folge', text: 'An drei Tagen hintereinander gemessen.', done: best >= 3 },
    { id: 's7', title: '7 Tage in Folge', text: 'Eine ganze Woche ohne Pause.', done: best >= 7 },
    { id: 's30', title: '30 Tage in Folge', text: 'Ein Monat Routine.', done: best >= 30 },
    { id: 'n30', title: '30 Messungen', text: 'Dreißig Werte gesammelt.', done: list.length >= 30 },
    { id: 'n100', title: '100 Messungen', text: 'Hundert Werte, das ergibt ein klares Bild.', done: list.length >= 100 },
    { id: 'goal', title: 'Wochenziel erreicht', text: `Diese Woche ${goal} Messungen geschafft.`, done: weekCount(list) >= goal },
  ];
}

export function summaryText(list: Measurement[], goal: number): string {
  const start = startOfWeek(new Date()).getTime();
  const week = list.filter((m) => new Date(m.ts).getTime() >= start);
  if (!week.length) return 'In dieser Woche gibt es noch keine Messung. Eine einzige reicht für den Anfang.';
  const a = averages(week);
  return `Diese Woche: ${week.length} von ${goal} Messungen, Durchschnitt ${a.sys}/${a.dia}, Puls ${a.pulse}.`;
}

export function motivation(count: number, streak: number, doneToday: boolean): string {
  if (count === 0) return 'Dein erster Wert ist der wichtigste. Das dauert nur zehn Sekunden.';
  if (!doneToday) return streak > 0 ? `Du hast eine Serie von ${streak} Tagen. Miss heute, damit sie bleibt.` : 'Heute noch keine Messung. Jetzt ist ein guter Zeitpunkt.';
  if (streak >= 7) return `${streak} Tage in Folge. Das ist echte Routine.`;
  if (streak >= 3) return `${streak} Tage am Stück. Weiter so.`;
  return 'Gespeichert. Morgen wieder?';
}
