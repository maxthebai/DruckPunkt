import React, { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { Badge, Button, Card, Chip, Muted } from '../components/ui';
import { Numpad } from '../components/Numpad';
import { DateTimeModal } from '../components/DateTimeModal';
import { currentStreak, measuredToday, motivation } from '../stats';
import { fmtDate, fmtTime } from '../dates';
import { snoozeReminder } from '../notifications';
import { TAGS } from '../types';

type Field = 'sys' | 'dia' | 'pulse';
const ORDER: Field[] = ['sys', 'dia', 'pulse'];
const LABEL: Record<Field, string> = { sys: 'Systolisch', dia: 'Diastolisch', pulse: 'Puls' };

export default function HomeScreen() {
  const c = useTheme();
  const { data, add } = useStore();
  const [vals, setVals] = useState<Record<Field, string>>({ sys: '', dia: '', pulse: '' });
  const [active, setActive] = useState<Field>('sys');
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [when, setWhen] = useState<Date>(new Date());
  const [custom, setCustom] = useState(false); // Zeit manuell geändert
  const [dateModal, setDateModal] = useState(false);
  const [msg, setMsg] = useState<{ text: string } | null>(null);
  const timer = useRef<any>(null);

  const list = data.measurements;
  const streak = currentStreak(list);
  const today = measuredToday(list);

  const onDigit = (d: string) => {
    const cur = vals[active];
    if (cur.length >= 3) return;
    const next = cur + d;
    setVals({ ...vals, [active]: next });
    if (next.length === 3 && active !== 'pulse') setActive(ORDER[ORDER.indexOf(active) + 1]);
  };
  const onBack = () => {
    if (vals[active] === '' && active !== 'sys') {
      const prev = ORDER[ORDER.indexOf(active) - 1];
      setActive(prev);
      setVals({ ...vals, [prev]: vals[prev].slice(0, -1) });
    } else setVals({ ...vals, [active]: vals[active].slice(0, -1) });
  };
  const onNext = () => {
    const i = ORDER.indexOf(active);
    if (i < 2) setActive(ORDER[i + 1]);
  };

  const sys = Number(vals.sys);
  const dia = Number(vals.dia);
  const pulse = Number(vals.pulse);

  const save = () => {
    if (!(sys >= 60 && sys <= 260)) return Alert.alert('Systolisch prüfen', 'Der systolische Wert sollte zwischen 60 und 260 liegen.');
    if (!(dia >= 30 && dia <= 160)) return Alert.alert('Diastolisch prüfen', 'Der diastolische Wert sollte zwischen 30 und 160 liegen.');
    if (dia >= sys) return Alert.alert('Werte prüfen', 'Der diastolische Wert muss kleiner sein als der systolische.');
    if (!(pulse >= 30 && pulse <= 220)) return Alert.alert('Puls prüfen', 'Der Puls sollte zwischen 30 und 220 liegen.');
    const ts = custom ? when : new Date();
    add({ ts: ts.toISOString(), sys, dia, pulse, tags, note: note.trim() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setMsg({ text: motivation(list.length + 1, today ? streak : streak + 1, true) });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 8000);
    setVals({ sys: '', dia: '', pulse: '' });
    setActive('sys');
    setTags([]);
    setNote('');
    setCustom(false);
    setWhen(new Date());
  };

  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: c.ink, fontSize: 17, fontWeight: '700' }}>
            {today ? 'Heute schon gemessen' : 'Heute noch nicht gemessen'}
          </Text>
          <Muted>{streak > 0 ? `Serie: ${streak} ${streak === 1 ? 'Tag' : 'Tage'}` : 'Starte deine Serie'}</Muted>
        </View>
        <Badge label={today ? 'Ja' : 'Nein'} color={today ? c.ok : c.warn} />
      </Card>

      {msg && (
        <Card style={{ borderColor: c.ok }}>
          <Text style={{ color: c.ink, fontSize: 16, fontWeight: '700' }}>Gespeichert</Text>
          <Muted>{msg.text}</Muted>
        </Card>
      )}

      <View style={s.row}>
        {ORDER.map((f) => (
          <Pressable
            key={f}
            onPress={() => setActive(f)}
            style={[
              s.field,
              { backgroundColor: c.card, borderColor: active === f ? c.accent : c.line, borderWidth: 2 },
            ]}
            accessibilityLabel={`${LABEL[f]} Wert`}
          >
            <Text style={{ color: c.muted, fontSize: 13 }}>{LABEL[f]}</Text>
            <Text style={{ color: c.ink, fontSize: 38, fontWeight: '800', minHeight: 46 }}>{vals[f] || '–'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ height: 8 }} />

      <Numpad onDigit={onDigit} onBack={onBack} onNext={onNext} nextLabel={active === 'pulse' ? '' : 'Weiter'} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {TAGS.map((t) => (
          <Chip key={t} label={t} on={tags.includes(t)} onPress={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])} />
        ))}
      </View>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Notiz (optional)"
        placeholderTextColor={c.muted}
        style={[s.input, { color: c.ink, borderColor: c.line, backgroundColor: c.card }]}
      />

      <Pressable onPress={() => setDateModal(true)} style={{ alignSelf: 'flex-start', marginVertical: 10 }}>
        <Chip label={custom ? `${fmtDate(when)} ${fmtTime(when)}` : 'Jetzt · Zeit ändern'} />
      </Pressable>

      <Button title="Speichern" onPress={save} disabled={!vals.sys || !vals.dia || !vals.pulse} />
      {!today && (
        <Button
          kind="ghost"
          title="In 30 Minuten erinnern"
          style={{ marginTop: 10 }}
          onPress={() => {
            snoozeReminder(30);
            Alert.alert('Erinnerung gesetzt', 'Ich erinnere dich in 30 Minuten.');
          }}
        />
      )}

      <DateTimeModal
        visible={dateModal}
        title="Zeit der Messung"
        value={when}
        onChange={(d) => {
          setWhen(d);
          setCustom(true);
        }}
        onNow={() => {
          setWhen(new Date());
          setCustom(false);
        }}
        onClose={() => setDateModal(false)}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  field: { width: '31.5%', borderRadius: 14, padding: 10, alignItems: 'center' },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16, marginTop: 4 },
});
