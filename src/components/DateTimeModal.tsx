import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { Button } from './ui';
import { fmtDate, fmtTime } from '../dates';

// Einfache Zeitauswahl ohne zusätzliche Bibliothek: Schrittweise vor und zurück.
export function DateTimeModal({
  visible,
  title = 'Zeitpunkt',
  value,
  onChange,
  onNow,
  onClose,
}: {
  visible: boolean;
  title?: string;
  value: Date;
  onChange: (d: Date) => void;
  onNow: () => void;
  onClose: () => void;
}) {
  const c = useTheme();
  const shift = (ms: number) => onChange(new Date(value.getTime() + ms));
  const shiftDays = (n: number) => {
    const d = new Date(value);
    d.setDate(d.getDate() + n);
    onChange(d);
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={[s.sheet, { backgroundColor: c.card }]}>
          <Text style={{ color: c.ink, fontSize: 18, fontWeight: '800', marginBottom: 4 }}>{title}</Text>
          <Text style={{ color: c.accent, fontSize: 22, fontWeight: '800', marginBottom: 12 }}>
            {fmtDate(value)} · {fmtTime(value)}
          </Text>
          <View style={s.row}>
            <Button kind="ghost" title="−1 Monat" onPress={() => shiftDays(-30)} style={s.step} />
            <Button kind="ghost" title="+1 Monat" onPress={() => shiftDays(30)} style={s.step} />
          </View>
          <View style={s.row}>
            <Button kind="ghost" title="−1 Tag" onPress={() => shiftDays(-1)} style={s.step} />
            <Button kind="ghost" title="+1 Tag" onPress={() => shiftDays(1)} style={s.step} />
          </View>
          <View style={s.row}>
            <Button kind="ghost" title="−1 Std" onPress={() => shift(-3600000)} style={s.step} />
            <Button kind="ghost" title="+1 Std" onPress={() => shift(3600000)} style={s.step} />
          </View>
          <View style={s.row}>
            <Button kind="ghost" title="−5 Min" onPress={() => shift(-300000)} style={s.step} />
            <Button kind="ghost" title="+5 Min" onPress={() => shift(300000)} style={s.step} />
          </View>
          <View style={s.row}>
            <Button kind="ghost" title="Jetzt" onPress={onNow} style={s.step} />
            <Button title="Fertig" onPress={onClose} style={s.step} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 24 },
  sheet: { borderRadius: 16, padding: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  step: { width: '48.5%' },
});
