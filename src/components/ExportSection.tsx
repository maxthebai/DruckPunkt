import React, { useMemo, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { Button, Card, Chip, Muted } from './ui';
import { PERIODS, PeriodKey, fmtInput, inPeriod, resolvePeriod } from '../period';
import { shareCsv, sharePdf } from '../report';
import { daysAgo } from '../dates';

export function ExportSection() {
  const c = useTheme();
  const { data } = useStore();
  const [key, setKey] = useState<PeriodKey>('all');
  const [from, setFrom] = useState(fmtInput(daysAgo(29)));
  const [to, setTo] = useState(fmtInput(new Date()));
  const [busy, setBusy] = useState(false);

  const period = useMemo(() => resolvePeriod(key, from, to), [key, from, to]);
  const ms = useMemo(() => (period.error ? [] : inPeriod(data.measurements, period)), [data.measurements, period]);
  const meds = useMemo(() => (period.error ? [] : inPeriod(data.medChanges, period)), [data.medChanges, period]);

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (e: any) {
      Alert.alert('Das hat nicht geklappt', e?.message ?? 'Unbekannter Fehler.');
    } finally {
      setBusy(false);
    }
  };

  const input = {
    borderWidth: 1,
    borderColor: c.line,
    color: c.ink,
    backgroundColor: c.bg,
    borderRadius: 10,
    padding: 10,
    fontSize: 17,
    width: 130,
  } as const;

  const disabled = busy || !!period.error || ms.length === 0;

  return (
    <Card>
      <Muted style={{ marginBottom: 8 }}>Zeitraum für den Bericht</Muted>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {PERIODS.map((p) => (
          <Chip key={p.key} label={p.label} on={key === p.key} onPress={() => setKey(p.key)} />
        ))}
      </View>
      {key === 'custom' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
          <TextInput value={from} onChangeText={setFrom} placeholder="TT.MM.JJJJ" placeholderTextColor={c.muted} keyboardType="numbers-and-punctuation" maxLength={10} style={input} />
          <Text style={{ color: c.muted, marginHorizontal: 10 }}>bis</Text>
          <TextInput value={to} onChangeText={setTo} placeholder="TT.MM.JJJJ" placeholderTextColor={c.muted} keyboardType="numbers-and-punctuation" maxLength={10} style={input} />
        </View>
      )}
      {period.error ? (
        <Text style={{ color: c.bad, marginTop: 10, lineHeight: 20 }}>{period.error}</Text>
      ) : (
        <Muted style={{ marginTop: 10 }}>
          {period.label}: {ms.length} {ms.length === 1 ? 'Messung' : 'Messungen'}
          {meds.length ? `, ${meds.length} ${meds.length === 1 ? 'Medikamentenänderung' : 'Medikamentenänderungen'}` : ''}
        </Muted>
      )}
      <Button
        title="PDF-Bericht teilen"
        disabled={disabled}
        onPress={() => run(() => sharePdf(ms, meds, period.label, data.measurements))}
        style={{ marginTop: 12 }}
      />
      <Button kind="ghost" title="CSV teilen" disabled={disabled} onPress={() => run(() => shareCsv(ms, meds))} style={{ marginTop: 10 }} />
      {!period.error && ms.length === 0 && <Muted style={{ marginTop: 8 }}>In diesem Zeitraum gibt es keine Messungen.</Muted>}
    </Card>
  );
}
