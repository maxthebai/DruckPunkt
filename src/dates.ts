export const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fmtDate(d: Date): string {
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function fmtTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export function fmtDayLong(d: Date): string {
  const today = dayKey(new Date());
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (dayKey(d) === today) return 'Heute';
  if (dayKey(d) === dayKey(y)) return 'Gestern';
  return `${WD[d.getDay()]}, ${fmtDate(d)}`;
}

export function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const wd = (x.getDay() + 6) % 7; // Montag = 0
  x.setDate(x.getDate() - wd);
  return x;
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}
