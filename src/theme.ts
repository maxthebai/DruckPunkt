import { useColorScheme } from 'react-native';

export type Palette = {
  bg: string;
  card: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accentInk: string;
  ok: string;
  warn: string;
  bad: string;
  low: string;
};

const light: Palette = {
  bg: '#EEF2F5',
  card: '#FFFFFF',
  ink: '#14232F',
  muted: '#5E7080',
  line: '#D5DDE3',
  accent: '#0F7C86',
  accentInk: '#FFFFFF',
  ok: '#2A9266',
  warn: '#C98F00',
  bad: '#CF3F3F',
  low: '#3F74B8',
};

const dark: Palette = {
  bg: '#0E1820',
  card: '#17252F',
  ink: '#E8EFF3',
  muted: '#93A5B2',
  line: '#27394584',
  accent: '#3FB6C1',
  accentInk: '#06232A',
  ok: '#4CC590',
  warn: '#E8B730',
  bad: '#F07070',
  low: '#6FA3E6',
};

export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}
