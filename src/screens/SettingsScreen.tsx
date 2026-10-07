import React, { useState } from 'react';
import { Alert, Platform, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { Button, Card, H, Muted } from '../components/ui';
import { pickBackup, saveBackupToFolder, shareBackup } from '../backup';
import { sharePdf, shareCsv } from '../report';
import { fmtDate } from '../dates';

const validTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

function SectionTitle({ children }: { children: string }) {
  const c = useTheme();
  return <Text style={{ color: c.ink, fontSize: 18, fontWeight: '800', marginTop: 12, marginBottom: 8 }}>{children}</Text>;
}

export default function SettingsScreen() {
  const c = useTheme();
  const { data, setSettings, replaceAll, merge, wipe } = useStore();
  const st = data.settings;
  const [busy, setBusy] = useState(false);

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

  const setTime = (i: number, v: string) => {
    const times = [...st.reminderTimes];
    times[i] = v;
    // Erst speichern, wenn die Zeit gültig ist, sonst bleibt der alte Wert aktiv.
    setSettings({ reminderTimes: times });
  };

  const markBackup = () => setSettings({ lastBackup: new Date().toISOString() });

  const doShare = () =>
    run(async () => {
      await shareBackup(data);
      markBackup();
    });

  const doFolder = () =>
    run(async () => {
      const name = await saveBackupToFolder(data);
      markBackup();
      Alert.alert('Backup gespeichert', name);
    });

  const doRestore = () =>
    run(async () => {
      const p = await pickBackup();
      if (!p) return;
      const range = p.from && p.to ? `\n${fmtDate(new Date(p.from))} bis ${fmtDate(new Date(p.to))}` : '';
      Alert.alert('Backup gefunden', `${p.count} Messungen${range}`, [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Zusammenführen', onPress: () => merge(p.data) },
        {
          text: 'Alles ersetzen',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Alles ersetzen?', 'Deine aktuellen Daten werden durch das Backup ersetzt.', [
              { text: 'Abbrechen', style: 'cancel' },
              { text: 'Ersetzen', style: 'destructive', onPress: () => replaceAll(p.data) },
            ]),
        },
      ]);
    });

  const doWipe = () =>
    Alert.alert('Alle Daten löschen?', 'Erstelle vorher ein Backup, wenn du die Werte behalten möchtest.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Weiter',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Wirklich löschen?', 'Das lässt sich nicht rückgängig machen.', [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Alles löschen', style: 'destructive', onPress: wipe },
          ]),
      },
    ]);

  const lastDays = st.lastBackup ? Math.floor((Date.now() - new Date(st.lastBackup).getTime()) / 86400000) : null;
  const old = data.measurements.length > 0 && (lastDays === null || lastDays >= 30);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <H>Mehr</H>

      {old && (
        <Card style={{ borderColor: c.warn }}>
          <Text style={{ color: c.ink, fontWeight: '700', fontSize: 16 }}>Zeit für ein Backup</Text>
          <Muted>{lastDays === null ? 'Du hast noch kein Backup erstellt.' : `Dein letztes Backup ist ${lastDays} Tage alt.`}</Muted>
        </Card>
      )}

      <SectionTitle>Erinnerungen</SectionTitle>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: c.ink, fontSize: 16 }}>Messung erinnern</Text>
          <Switch value={st.remindersOn} onValueChange={(v) => setSettings({ remindersOn: v })} trackColor={{ true: c.accent }} />
        </View>
        {st.remindersOn &&
          st.reminderTimes.map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <TextInput
                value={t}
                onChangeText={(v) => setTime(i, v)}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                placeholder="08:00"
                placeholderTextColor={c.muted}
                style={{
                  borderWidth: 1,
                  borderColor: validTime(t) ? c.line : c.bad,
                  color: c.ink,
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 18,
                  width: 100,
                }}
              />
              <Muted style={{ marginLeft: 10, flex: 1 }}>{validTime(t) ? 'Uhr' : 'Format HH:MM, z. B. 08:00'}</Muted>
              {st.reminderTimes.length > 1 && (
                <Button kind="ghost" title="Entfernen" onPress={() => setSettings({ reminderTimes: st.reminderTimes.filter((_, j) => j !== i) })} style={{ minHeight: 40 }} />
              )}
            </View>
          ))}
        {st.remindersOn && st.reminderTimes.length < 4 && (
          <Button kind="ghost" title="Weitere Zeit hinzufügen" style={{ marginTop: 10 }} onPress={() => setSettings({ reminderTimes: [...st.reminderTimes, '12:00'] })} />
        )}
      </Card>

      <SectionTitle>Wochenziel</SectionTitle>
      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button kind="ghost" title="−" style={{ width: 56 }} onPress={() => setSettings({ weeklyGoal: Math.max(1, st.weeklyGoal - 1) })} />
        <Text style={{ color: c.ink, fontSize: 18, fontWeight: '700' }}>{st.weeklyGoal} Messungen pro Woche</Text>
        <Button kind="ghost" title="+" style={{ width: 56 }} onPress={() => setSettings({ weeklyGoal: Math.min(21, st.weeklyGoal + 1) })} />
      </Card>

      <SectionTitle>Daten & Backup</SectionTitle>
      <Card>
        <Muted style={{ marginBottom: 10 }}>
          {st.lastBackup ? `Letztes Backup: ${fmtDate(new Date(st.lastBackup))}` : 'Noch kein Backup erstellt.'}
        </Muted>
        <Button title="Backup erstellen und teilen" onPress={doShare} disabled={busy} />
        <Button kind="ghost" title="Backup in Ordner speichern" onPress={doFolder} disabled={busy} style={{ marginTop: 10 }} />
        <Muted style={{ marginTop: 6 }}>
          {Platform.OS === 'android' ? 'Wähle den Ordner „Downloads“, um die Datei dort abzulegen.' : 'Wähle einen Ordner, z. B. in „Dateien“.'}
        </Muted>
        <Button kind="ghost" title="Backup wiederherstellen" onPress={doRestore} disabled={busy} style={{ marginTop: 10 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <Text style={{ color: c.ink, fontSize: 16, flex: 1 }}>Monatliche Backup-Erinnerung</Text>
          <Switch value={st.backupReminder} onValueChange={(v) => setSettings({ backupReminder: v })} trackColor={{ true: c.accent }} />
        </View>
      </Card>

      <SectionTitle>Bericht für den Arzt</SectionTitle>
      <Card>
        <Button title="PDF-Bericht teilen" disabled={busy || !data.measurements.length} onPress={() => run(() => sharePdf(data.measurements))} />
        <Button kind="ghost" title="CSV teilen" disabled={busy || !data.measurements.length} onPress={() => run(() => shareCsv(data.measurements))} style={{ marginTop: 10 }} />
      </Card>

      <SectionTitle>Gefahrenbereich</SectionTitle>
      <Card>
        <Button kind="danger" title="Alle Daten löschen" onPress={doWipe} />
      </Card>

      <Card>
        <Text style={{ color: c.ink, fontWeight: '700', marginBottom: 4 }}>Hinweis</Text>
        <Muted>
          Diese App ersetzt keine ärztliche Beratung. Alle Daten bleiben auf deinem Gerät.
        </Muted>
      </Card>
    </ScrollView>
  );
}
