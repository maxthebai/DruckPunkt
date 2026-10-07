import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { Badge, Button, Chip, Muted } from '../components/ui';
import { classify, levelColor, levelLabel } from '../classify';
import { dayKey, fmtDayLong, fmtTime } from '../dates';
import { Measurement, TAGS } from '../types';

const W = 96;

function SwipeRow({ m, onOpen, onDelete }: { m: Measurement; onOpen: () => void; onDelete: () => void }) {
  const c = useTheme();
  const x = useRef(new Animated.Value(0)).current;
  const open = useRef(false);
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        const base = open.current ? -W : 0;
        x.setValue(Math.max(-W, Math.min(0, base + g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        const base = open.current ? -W : 0;
        const end = base + g.dx < -W / 2 ? -W : 0;
        open.current = end !== 0;
        Animated.spring(x, { toValue: end, useNativeDriver: true, bounciness: 0 }).start();
      },
    }),
  ).current;
  const lvl = classify(m.sys, m.dia);
  const col = levelColor(lvl, c);
  const extra = [...m.tags, m.note].filter(Boolean).join(' · ');
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={[s.del, { backgroundColor: c.bad }]}>
        <Pressable onPress={onDelete} style={s.delBtn} accessibilityLabel="Löschen">
          <Text style={{ color: '#fff', fontWeight: '800' }}>Löschen</Text>
        </Pressable>
      </View>
      <Animated.View
        {...pan.panHandlers}
        style={[s.row, { backgroundColor: c.card, borderColor: c.line, transform: [{ translateX: x }] }]}
      >
        <Pressable onPress={onOpen} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 6, alignSelf: 'stretch', borderRadius: 3, backgroundColor: col, marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.ink, fontSize: 22, fontWeight: '800' }}>
              {m.sys}/{m.dia} <Text style={{ fontSize: 14, color: c.muted, fontWeight: '600' }}>Puls {m.pulse}</Text>
            </Text>
            <Muted>
              {fmtTime(new Date(m.ts))} Uhr{extra ? ` · ${extra}` : ''}
            </Muted>
          </View>
          <Badge label={levelLabel(lvl)} color={col} />
        </Pressable>
      </Animated.View>
    </View>
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
  const [id, setId] = useState<string | null>(null);
  if (m && m.id !== id) {
    setId(m.id);
    setSys(String(m.sys));
    setDia(String(m.dia));
    setPulse(String(m.pulse));
    setTags(m.tags);
    setNote(m.note);
  }
  const save = () => {
    if (!m) return;
    const a = Number(sys);
    const b = Number(dia);
    const p = Number(pulse);
    if (!(a >= 60 && a <= 260 && b >= 30 && b <= 160 && b < a && p >= 30 && p <= 220)) {
      return Alert.alert('Werte prüfen', 'Bitte gib sinnvolle Werte ein. Der untere Wert muss kleiner als der obere sein.');
    }
    update({ ...m, sys: a, dia: b, pulse: p, tags, note: note.trim() });
    setId(null);
    onClose();
  };
  const box = [s.input, { color: c.ink, borderColor: c.line, backgroundColor: c.bg }];
  return (
    <Modal visible={!!m} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.backdrop}>
        <View style={[s.sheet, { backgroundColor: c.card }]}>
          <Text style={{ color: c.ink, fontSize: 20, fontWeight: '800', marginBottom: 12 }}>Messung bearbeiten</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextInput style={[box, { width: '31%' }]} value={sys} onChangeText={setSys} keyboardType="number-pad" maxLength={3} placeholder="Oben" placeholderTextColor={c.muted} />
            <TextInput style={[box, { width: '31%' }]} value={dia} onChangeText={setDia} keyboardType="number-pad" maxLength={3} placeholder="Unten" placeholderTextColor={c.muted} />
            <TextInput style={[box, { width: '31%' }]} value={pulse} onChangeText={setPulse} keyboardType="number-pad" maxLength={3} placeholder="Puls" placeholderTextColor={c.muted} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            {TAGS.map((t) => (
              <Chip key={t} label={t} on={tags.includes(t)} onPress={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])} />
            ))}
          </View>
          <TextInput style={box} value={note} onChangeText={setNote} placeholder="Notiz" placeholderTextColor={c.muted} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
            <Button kind="ghost" title="Abbrechen" style={{ width: '48.5%' }} onPress={() => { setId(null); onClose(); }} />
            <Button title="Speichern" style={{ width: '48.5%' }} onPress={save} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function HistoryScreen() {
  const c = useTheme();
  const { data, remove } = useStore();
  const [edit, setEdit] = useState<Measurement | null>(null);

  const sections = useMemo(() => {
    const map = new Map<string, Measurement[]>();
    for (const m of data.measurements) {
      const k = dayKey(new Date(m.ts));
      map.set(k, [...(map.get(k) ?? []), m]);
    }
    return [...map.entries()].map(([k, items]) => ({ key: k, title: fmtDayLong(new Date(items[0].ts)), data: items }));
  }, [data.measurements]);

  const confirmDelete = (m: Measurement) =>
    Alert.alert('Messung löschen?', `${m.sys}/${m.dia} wird dauerhaft gelöscht.`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => remove(m.id) },
    ]);

  if (!data.measurements.length) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: c.ink, fontSize: 20, fontWeight: '800', marginBottom: 6 }}>Noch keine Messungen</Text>
        <Muted>Trag unter „Messen“ deinen ersten Wert ein. Er erscheint dann hier.</Muted>
      </View>
    );
  }

  return (
    <>
      <SectionList
        sections={sections}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={{ color: c.muted, fontSize: 14, fontWeight: '700', marginVertical: 8 }}>{section.title}</Text>
        )}
        renderItem={({ item }) => <SwipeRow m={item} onOpen={() => setEdit(item)} onDelete={() => confirmDelete(item)} />}
        ListFooterComponent={<Muted style={{ textAlign: 'center', marginTop: 8 }}>Nach links wischen zum Löschen, tippen zum Bearbeiten.</Muted>}
      />
      <EditModal m={edit} onClose={() => setEdit(null)} />
    </>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  del: { position: 'absolute', right: 0, top: 0, bottom: 0, width: W + 20, borderRadius: 12, alignItems: 'flex-end', justifyContent: 'center' },
  delBtn: { width: W, height: '100%', alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 28 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 17, marginTop: 4 },
});
