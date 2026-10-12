import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Switch, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { Button, Card, Chip, Muted } from './ui';
import {
  MAX_REMINDER_COUNT,
  expectedCount,
  hasPermission,
  nextReminder,
  openAppSettings,
  openBatterySettings,
  parseTime,
  rescheduleAll,
  scheduledCount,
  sendTest,
} from '../notifications';
import { ALL_DAYS, Reminder, WEEKDAYS } from '../types';
import { fmtDate, fmtTime } from '../dates';

const WD_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

function TimeField({ value, onCommit }: { value: string; onCommit: (t: string) => void }) {
  const c = useTheme();
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const valid = !!parseTime(text);
  const change = (raw: string) => {
    let t = raw.replace(/[^0-9:]/g, '');
    // „0800“ oder „08“ -> Doppelpunkt automatisch einfügen
    if (/^\d{3,4}$/.test(t)) t = `${t.slice(0, t.length - 2)}:${t.slice(-2)}`;
    if (/^\d{2}$/.test(t) && t.length > text.length) t = `${t}:`;
    if (/^\d:\d\d$/.test(t)) t = `0${t}`;
    setText(t);
    if (parseTime(t)) onCommit(t);
  };
  return (
    <TextInput
      value={text}
      onChangeText={change}
      onBlur={() => !valid && setText(value)}
      keyboardType="numbers-and-punctuation"
      maxLength={5}
      placeholder="08:00"
      placeholderTextColor={c.muted}
      style={{
        borderWidth: 1,
        borderColor: valid ? c.line : c.bad,
        color: c.ink,
        backgroundColor: c.bg,
        borderRadius: 10,
        padding: 10,
        fontSize: 20,
        fontWeight: '700',
        width: 100,
        textAlign: 'center',
      }}
    />
  );
}

const sameDays = (a: number[], b: number[]) => a.length === b.length && b.every((d) => a.includes(d));

export function RemindersSection() {
  const c = useTheme();
  const { data, setSettings } = useStore();
  const st = data.settings;
  const [perm, setPerm] = useState<boolean | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const want = expectedCount(st);
  const next = nextReminder(st);

  const refresh = useCallback(async () => {
    setPerm(await hasPermission());
    setCount(await scheduledCount());
  }, []);

  useEffect(() => {
    refresh();
    const t = setTimeout(refresh, 1500); // Planung läuft asynchron im Hintergrund
    return () => clearTimeout(t);
  }, [refresh, st.remindersOn, st.reminders, st.backupReminder]);

  const setReminder = (id: string, patch: Partial<Reminder>) =>
    setSettings({ reminders: st.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const toggleDay = (r: Reminder, d: number) =>
    setReminder(r.id, { days: r.days.includes(d) ? r.days.filter((x) => x !== d) : [...r.days, d].sort() });

  const addReminder = () => {
    if (st.reminders.length >= MAX_REMINDER_COUNT) return;
    setSettings({ reminders: [...st.reminders, { id: `r-${Date.now()}`, time: '12:00', days: ALL_DAYS, on: true }] });
  };

  const test = async () => {
    const ok = await sendTest(5);
    Alert.alert(
      ok ? 'Test gestartet' : 'Keine Berechtigung',
      ok
        ? 'In etwa 5 Sekunden sollte eine Benachrichtigung erscheinen. Du kannst die App dafür in den Hintergrund legen.'
        : 'Erlaube Benachrichtigungen für DruckPunkt in den Systemeinstellungen.',
    );
    refresh();
  };

  const resync = async () => {
    const n = await rescheduleAll(st);
    await refresh();
    Alert.alert('Erinnerungen neu geplant', n < 0 ? 'Das Planen ist fehlgeschlagen.' : `${n} Benachrichtigungen sind geplant.`);
  };

  const ok = perm === true && count === want;

  return (
    <>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: c.ink, fontSize: 16 }}>Messung erinnern</Text>
          <Switch value={st.remindersOn} onValueChange={(v) => setSettings({ remindersOn: v })} trackColor={{ true: c.accent }} />
        </View>
        {st.remindersOn && (
          <>
            {st.reminders.map((r) => (
              <View key={r.id} style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.line, opacity: r.on ? 1 : 0.55 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <TimeField value={r.time} onCommit={(t) => setReminder(r.id, { time: t })} />
                  <Switch value={r.on} onValueChange={(v) => setReminder(r.id, { on: v })} trackColor={{ true: c.accent }} />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                  {WEEKDAYS.map((w, i) => (
                    <Chip key={w} label={w} on={r.days.includes(i + 1)} onPress={() => toggleDay(r, i + 1)} />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  <Chip label="Täglich" on={sameDays(r.days, ALL_DAYS)} onPress={() => setReminder(r.id, { days: ALL_DAYS })} />
                  <Chip label="Mo–Fr" on={sameDays(r.days, [1, 2, 3, 4, 5])} onPress={() => setReminder(r.id, { days: [1, 2, 3, 4, 5] })} />
                  <Chip label="Wochenende" on={sameDays(r.days, [6, 7])} onPress={() => setReminder(r.id, { days: [6, 7] })} />
                </View>
                {r.days.length === 0 && <Text style={{ color: c.bad, marginBottom: 4 }}>Wähle mindestens einen Tag.</Text>}
                {st.reminders.length > 1 && (
                  <Button
                    kind="ghost"
                    title="Erinnerung entfernen"
                    onPress={() => setSettings({ reminders: st.reminders.filter((x) => x.id !== r.id) })}
                    style={{ minHeight: 44, marginTop: 4 }}
                  />
                )}
              </View>
            ))}
            {st.reminders.length < MAX_REMINDER_COUNT && (
              <Button kind="ghost" title="Erinnerung hinzufügen" onPress={addReminder} style={{ marginTop: 14 }} />
            )}
            <Muted style={{ marginTop: 8 }}>
              Jede Erinnerung hat eigene Uhrzeit und eigene Wochentage, z. B. werktags früh und am Wochenende später.
            </Muted>
          </>
        )}
      </Card>

      <Card>
        <Text style={{ color: c.ink, fontSize: 16, fontWeight: '700', marginBottom: 6 }}>Status der Erinnerungen</Text>
        <Muted>Berechtigung: {perm === null ? '…' : perm ? 'erteilt' : 'nicht erteilt'}</Muted>
        <Muted>
          Geplant: {count === null || count < 0 ? '…' : count} von {want}
          {ok ? ' (alles in Ordnung)' : ''}
        </Muted>
        <Muted>
          Nächste Erinnerung:{' '}
          {next ? `${WD_LONG[(next.getDay() + 6) % 7]}, ${fmtDate(next)} um ${fmtTime(next)} Uhr` : 'keine aktiv'}
        </Muted>
        <Button title="Test-Benachrichtigung (5 Sekunden)" onPress={test} style={{ marginTop: 12 }} />
        <Button kind="ghost" title="Erinnerungen neu planen" onPress={resync} style={{ marginTop: 10 }} />
        {perm === false && <Button kind="ghost" title="Systemeinstellungen öffnen" onPress={openAppSettings} style={{ marginTop: 10 }} />}
        {Platform.OS === 'android' && (
          <>
            <Muted style={{ marginTop: 12 }}>
              Kommen Erinnerungen trotzdem nicht oder verspätet an: Stelle den Akku für DruckPunkt auf „Nicht optimiert“ bzw. „Unbeschränkt“ und erlaube
              „Wecker & Erinnerungen“ in den App-Einstellungen. Manche Hersteller (z. B. Xiaomi, Samsung, Huawei) beenden Apps im Hintergrund sehr aggressiv.
            </Muted>
            <Button kind="ghost" title="Akku-Optimierung öffnen" onPress={openBatterySettings} style={{ marginTop: 10 }} />
            <Button kind="ghost" title="App-Einstellungen öffnen" onPress={openAppSettings} style={{ marginTop: 10 }} />
          </>
        )}
      </Card>
    </>
  );
}
