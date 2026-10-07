import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const c = useTheme();
  return <View style={[s.card, { backgroundColor: c.card, borderColor: c.line }, style]}>{children}</View>;
}

export function H({ children }: { children: React.ReactNode }) {
  const c = useTheme();
  return <Text style={[s.h, { color: c.ink }]}>{children}</Text>;
}

export function Muted({ children, style }: { children: React.ReactNode; style?: any }) {
  const c = useTheme();
  return <Text style={[{ color: c.muted, fontSize: 14, lineHeight: 20 }, style]}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const c = useTheme();
  const bg = kind === 'primary' ? c.accent : kind === 'danger' ? c.bad : 'transparent';
  const fg = kind === 'ghost' ? c.accent : kind === 'danger' ? '#fff' : c.accentInk;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, borderColor: kind === 'ghost' ? c.accent : bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      <Text style={[s.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, { borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accent : 'transparent' }]}
    >
      <Text style={{ color: on ? c.accentInk : c.ink, fontSize: 14, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[s.badge, { backgroundColor: color + '26', borderColor: color }]}>
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 12 },
  h: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  btn: { minHeight: 52, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  btnText: { fontSize: 17, fontWeight: '700' },
  chip: { borderWidth: 1.5, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, marginBottom: 8 },
  badge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
});
