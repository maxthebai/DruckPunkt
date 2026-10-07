import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme';

export function Numpad({
  onDigit,
  onBack,
  onNext,
  nextLabel,
}: {
  onDigit: (d: string) => void;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
}) {
  const c = useTheme();
  const tap = (fn: () => void) => () => {
    Haptics.selectionAsync().catch(() => {});
    fn();
  };
  const key = (label: string, fn: () => void, accent = false) => (
    <Pressable
      key={label}
      onPress={tap(fn)}
      accessibilityLabel={label}
      style={({ pressed }) => [
        s.key,
        { backgroundColor: accent ? c.accent : c.card, borderColor: c.line, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={{ fontSize: accent ? 16 : 26, fontWeight: '700', color: accent ? c.accentInk : c.ink }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={s.grid}>
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => key(d, () => onDigit(d)))}
      {key('⌫', onBack)}
      {key('0', () => onDigit('0'))}
      {key(nextLabel, onNext, true)}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  key: {
    width: '31.5%',
    height: 58,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
