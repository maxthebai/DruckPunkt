import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { Badge, Button, Chip, Muted } from '../components/ui';
import { SwipeRow } from '../components/SwipeRow';
import { DateTimeModal } from '../components/DateTimeModal';
import { dayKey, fmtDate, fmtDayLong, fmtTime } from '../dates';
import { beforeAfter, signed } from '../stats';
import { MED_KINDS, MedChange, MedKind, Measurement, TAGS, medKindLabel } from '../types';

type Item = { type: 'm'; ts: string; m: Measurement } | { type: 'med'; ts: string; c: MedChange };

const COMPARE_DAYS = 14;

function MeasurementRow({ m, onOpen, onDelete }: { m: Measurement; onOpen: () => void; onDelete: () => void }) {
  const c = useTheme();
  const extra = [...m.tags, m.note].filter(Boolean).join(' · ');
  return (
    <SwipeRow onDelete={onDelete}>
      <Pressable onPress={onOpen} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 6, alignSelf: 'stretch', borderRadius: 3, backgroundColor: c.accent, marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.ink, fontSize: 22, fontWeight: '800' }}>
            {m.sys}/{m.dia} <Text style={{ fontSize: 14, color: c.muted, fontWeight: '600' }}>Puls {m.pulse}</Text>
          </Text>
          <Muted>
            {fmtTime(new Date(m.ts))} Uhr{extra ? ` · ${extra}` : ''}
          </Muted>
        </View>
      </Pressable>
    </SwipeRow>
  );
}

function MedRow({ med, list, onOpen, onDelete }: { med: MedChange; list: Measurement[]; onOpen: () => void; onDelete: () => void }) {
  const c = useTheme();
  const ba = beforeAfter(list, med.ts, COMPARE_DAYS);
  const have = ba.before.count > 0 && ba.after.count > 0;
  return (
    <SwipeRow onDelete={onDelete}>
      <Pressable onPress={onOpen} style={{ flex: 1, flexDirection: 'row', alignItems: 'stretch' }}>
        <View style={{ width: 6, borderRadius: 3, backgroundColor: c.low, marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Badge label="Medikament" color={c.low} />
          <Text style={{ color: c.ink, fontSize: 18, fontWeight: '800', marginTop: 4 }}>{med.name}</Text>
          <Muted>
            {medKindLabel(med.kind)}
            {med.dose ? ` · ${med.dose}` : ''} · {fmtTime(new Date(med.ts))} Uhr
          </Muted>
          {!!med.note && <Muted>{med.note}</Muted>}
          <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }}>
            {have ? (
              <>
                <Text style={{ color: c.ink, fontSize: 14 }}>
                  Davor: <Text style={{ fontWeight: '800' }}>{ba.before.sys}/{ba.before.dia}</Text>
                  {'  '}Danach: <Text style={{ fontWeight: '800' }}>{ba.after.sys}/{ba.after.dia}</Text>
                </Text>
                <Muted>
                  Änderung {signed(ba.diffSys)}/{signed(ba.diffDia)}, Puls {signed(ba.diffPulse)} · Ø aus {ba.before.count} und {ba.after.count} Messungen in je {COMPARE_DAYS} Tagen
                </Muted>
              </>
            ) : (
              <Muted>
                Für den Vergleich fehlen Messungen {ba.before.count === 0 ? `in den ${COMPARE_DAYS} Tagen davor` : `in den ${COMPARE_DAYS} Tagen danach`}.
              </Muted>
            )}
          </View>
        </View>
      </Pressable>
    </SwipeRow>
  );
}

function EditModal({ m, onClose }: { m: Measurement | null; onClose: () => void }) {
  const c = useTheme();
  const { update } = useStore();
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [pulse, setPulse] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [when, setWhen] = useState(new Date());
  const [timeModal, setTimeModal] = useState(false);
  const [id, setId] = useState<string | null>(null);
  if (m && m.id !== id) {
    setId(m.id);
    setSys(String(m.sys));
    setDia(String(m.dia));
    setPulse(String(m.pulse));
    setTags(m.tags);
    setNote(m.note);
    setWhen(new Date(m.ts));
  }
  const close = () => {
    setId(null);
    onClose();
  };
  const save = () => {
    if (!m) return;
    const a = Number(sys);
    const b = Number(dia);
    const p = Number(pulse);
    if (!(a >= 60 && a <= 260 && b >= 30 && b <= 160 && b < a && p >= 30 && p <= 220)) {
      return Alert.alert('Werte prüfen', 'Bitte gib sinnvolle Werte ein. Der diastolische Wert muss kleiner als der systolische sein.');
    }
    update({ ...m, ts: when.toISOString(), sys: a, dia: b, pulse: p, tags, note: note.trim() });
    close();
  };
  const box = [s.input, { color: c.ink, borderColor: c.line, backgroundColor: c.bg }];
  return (
    <Modal visible={!!m} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.backdrop}>
        <View style={[s.sheet, { backgroundColor: c.card }]}>
          <Text style={{ color: c.ink, fontSize: 20, fontWeight: '800', marginBottom: 12 }}>Messung bearbeiten</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextInput style={[box, { width: '31%' }]} value={sys} onChangeText={setSys} keyboardType="number-pad" maxLength={3} placeholder="Systolisch" placeholderTextColor={c.muted} />
            <TextInput style={[box, { width: '31%' }]} value={dia} onChangeText={setDia} keyboardType="number-pad" maxLength={3} placeholder="Diastolisch" placeholderTextColor={c.muted} />
            <TextInput style={[box, { width: '31%' }]} value={pulse} onChangeText={setPulse} keyboardType="number-pad" maxLength={3} placeholder="Puls" placeholderTextColor={c.muted} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            {TAGS.map((t) => (
              <Chip key={t} label={t} on={tags.includes(t)} onPress={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])} />
            ))}
          </View>
          <TextInput style={box} value={note} onChangeText={setNote} placeholder="Notiz" placeholderTextColor={c.muted} />
          <Pressable onPress={() => setTimeModal(true)} style={{ alignSelf: 'flex-start', marginTop: 10 }}>
            <Chip label={`${fmtDate(when)} ${fmtTime(when)} · ändern`} />
          </Pressable>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <Button kind="ghost" title="Abbrechen" style={{ width: '48.5%' }} onPress={close} />
            <Button title="Speichern" style={{ width: '48.5%' }} onPress={save} />
          </View>
        </View>
        <DateTimeModal visible={timeModal} title="Zeit der Messung" value={when} onChange={setWhen} onNow={() => setWhen(new Date())} onClose={() => setTimeModal(false)} />
      </KeyboardAvoidingView>
    </Modal>
  );
}

// `med === null` schließt, `med === 'new'` legt neu an, sonst wird bearbeitet.
function MedModal({ med, onClose }: { med: MedChange | 'new' | null; onClose: () => void }) {
  const c = useTheme();
  const { addMed, updateMed } = useStore();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<MedKind>('start');
  const [dose, setDose] = useState('');
  const [note, setNote] = useState('');
  const [when, setWhen] = useState(new Date());
  const [timeModal, setTimeModal] = useState(false);
  const [key, setKey] = useState<string | null>(null);

  const curKey = med === null ? null : med === 'new' ? 'new' : med.id;
  if (curKey !== key) {
    setKey(curKey);
    if (med === 'new') {
      setName('');
      setKind('start');
      setDose('');
      setNote('');
      setWhen(new Date());
    } else if (med) {
      setName(med.name);
      setKind(med.kind);
      setDose(med.dose);
      setNote(med.note);
      setWhen(new Date(med.ts));
    }
  }

  const save = () => {
    if (!name.trim()) return Alert.alert('Name fehlt', 'Bitte gib den Namen des Medikaments ein.');
    const payload = { ts: when.toISOString(), name: name.trim(), kind, dose: dose.trim(), note: note.trim() };
    if (med === 'new') addMed(payload);
    else if (med) updateMed({ ...med, ...payload });
    onClose();
  };
  const box = [s.input, { color: c.ink, borderColor: c.line, backgroundColor: c.bg }];
  return (
    <Modal visible={med !== null} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.backdrop}>
        <View style={[s.sheet, { backgroundColor: c.card, maxHeight: '90%' }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={{ color: c.ink, fontSize: 20, fontWeight: '800', marginBottom: 12 }}>
              {med === 'new' ? 'Medikamentenänderung' : 'Änderung bearbeiten'}
            </Text>
            <TextInput style={box} value={name} onChangeText={setName} placeholder="Medikament, z. B. Ramipril" placeholderTextColor={c.muted} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
              {MED_KINDS.map((k) => (
                <Chip key={k.key} label={k.label} on={kind === k.key} onPress={() => setKind(k.key)} />
              ))}
            </View>
            <TextInput style={box} value={dose} onChangeText={setDose} placeholder="Dosis (optional), z. B. 5 mg morgens" placeholderTextColor={c.muted} />
            <TextInput style={box} value={note} onChangeText={setNote} placeholder="Notiz (optional)" placeholderTextColor={c.muted} />
            <Pressable onPress={() => setTimeModal(true)} style={{ alignSelf: 'flex-start', marginTop: 10 }}>
              <Chip label={`${fmtDate(when)} ${fmtTime(when)} · ändern`} />
            </Pressable>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <Button kind="ghost" title="Abbrechen" style={{ width: '48.5%' }} onPress={onClose} />
              <Button title="Speichern" style={{ width: '48.5%' }} onPress={save} />
            </View>
          </ScrollView>
        </View>
        <DateTimeModal visible={timeModal} title="Zeitpunkt der Änderung" value={when} onChange={setWhen} onNow={() => setWhen(new Date())} onClose={() => setTimeModal(false)} />
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function HistoryScreen() {
  const c = useTheme();
  const { data, remove, removeMed } = useStore();
  const [edit, setEdit] = useState<Measurement | null>(null);
  const [medEdit, setMedEdit] = useState<MedChange | 'new' | null>(null);

  const sections = useMemo(() => {
    const items: Item[] = [
      ...data.measurements.map((m): Item => ({ type: 'm', ts: m.ts, m })),
      ...data.medChanges.map((x): Item => ({ type: 'med', ts: x.ts, c: x })),
    ].sort((a, b) => b.ts.localeCompare(a.ts));
    const map = new Map<string, Item[]>();
    for (const it of items) {
      const k = dayKey(new Date(it.ts));
      map.set(k, [...(map.get(k) ?? []), it]);
    }
    return [...map.entries()].map(([k, list]) => ({ key: k, title: fmtDayLong(new Date(list[0].ts)), data: list }));
  }, [data.measurements, data.medChanges]);

  const confirmDelete = (m: Measurement) =>
    Alert.alert('Messung löschen?', `${m.sys}/${m.dia} wird dauerhaft gelöscht.`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => remove(m.id) },
    ]);
  const confirmDeleteMed = (x: MedChange) =>
    Alert.alert('Änderung löschen?', `${x.name} (${medKindLabel(x.kind)}) wird dauerhaft gelöscht.`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => removeMed(x.id) },
    ]);

  const header = (
    <View style={{ marginBottom: 8 }}>
      <Button kind="ghost" title="Medikamentenänderung eintragen" onPress={() => setMedEdit('new')} />
    </View>
  );

  if (!sections.length) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        {header}
        <View style={{ flex: 1, justifyContent: 'center', padding: 8 }}>
          <Text style={{ color: c.ink, fontSize: 20, fontWeight: '800', marginBottom: 6 }}>Noch keine Messungen</Text>
          <Muted>Trag unter „Messen“ deinen ersten Wert ein. Er erscheint dann hier.</Muted>
        </View>
        <MedModal med={medEdit} onClose={() => setMedEdit(null)} />
      </View>
    );
  }

  return (
    <>
      <SectionList
        sections={sections}
        keyExtractor={(it) => (it.type === 'm' ? it.m.id : it.c.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        renderSectionHeader={({ section }) => (
          <Text style={{ color: c.muted, fontSize: 14, fontWeight: '700', marginVertical: 8 }}>{section.title}</Text>
        )}
        renderItem={({ item }) =>
          item.type === 'm' ? (
            <MeasurementRow m={item.m} onOpen={() => setEdit(item.m)} onDelete={() => confirmDelete(item.m)} />
          ) : (
            <MedRow med={item.c} list={data.measurements} onOpen={() => setMedEdit(item.c)} onDelete={() => confirmDeleteMed(item.c)} />
          )
        }
        ListFooterComponent={<Muted style={{ textAlign: 'center', marginTop: 8 }}>Nach links wischen zum Löschen, tippen zum Bearbeiten.</Muted>}
      />
      <EditModal m={edit} onClose={() => setEdit(null)} />
      <MedModal med={medEdit} onClose={() => setMedEdit(null)} />
    </>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 28 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 17, marginTop: 8 },
});
