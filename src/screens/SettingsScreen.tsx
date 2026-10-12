import React, { useState } from 'react';
import { Alert, Platform, ScrollView, Switch, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { Button, Card, H, Muted } from '../components/ui';
import { pickBackup, saveBackupToFolder, shareBackup } from '../backup';
import { ExportSection } from '../components/ExportSection';
import { RemindersSection } from '../components/RemindersSection';
import { fmtDate } from '../dates';


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
      Alert.alert('Backup gefunden', `${p.count} Messungen${p.medCount ? `, ${p.medCount} Medikamentenänderungen` : ''}${range}`, [
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
      <RemindersSection />

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
      <ExportSection />

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
