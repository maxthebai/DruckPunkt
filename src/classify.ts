import { Palette } from './theme';

export type Level = 'low' | 'ok' | 'warn' | 'bad' | 'crisis';

// Orientierung an gängigen Leitlinien (nur informativ, keine Diagnose).
export function classify(sys: number, dia: number): Level {
  if (sys >= 180 || dia >= 110) return 'crisis';
  if (sys >= 140 || dia >= 90) return 'bad';
  if (sys >= 130 || dia >= 85) return 'warn';
  if (sys < 100 || dia < 60) return 'low';
  return 'ok';
}

export function levelLabel(l: Level): string {
  switch (l) {
    case 'low':
      return 'Niedrig';
    case 'ok':
      return 'Normal';
    case 'warn':
      return 'Hochnormal';
    case 'bad':
      return 'Erhöht';
    case 'crisis':
      return 'Sehr hoch';
  }
}

export function levelColor(l: Level, c: Palette): string {
  switch (l) {
    case 'low':
      return c.low;
    case 'ok':
      return c.ok;
    case 'warn':
      return c.warn;
    default:
      return c.bad;
  }
}

export function levelHint(l: Level): string | null {
  if (l === 'crisis')
    return 'Dieser Wert ist sehr hoch. Miss in Ruhe nach. Bleibt er hoch oder hast du Beschwerden, wende dich an einen Arzt. Bei Brustschmerzen, Atemnot oder Lähmungen wähle den Notruf 112.';
  if (l === 'bad')
    return 'Dieser Wert liegt im erhöhten Bereich. Sprich bei wiederholt hohen Werten mit deinem Arzt.';
  if (l === 'low')
    return 'Dieser Wert ist niedrig. Wenn dir schwindelig ist, setz dich hin und sprich bei Beschwerden mit deinem Arzt.';
  return null;
}
