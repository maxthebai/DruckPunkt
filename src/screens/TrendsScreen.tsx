import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { Card, Chip, H, Muted } from '../components/ui';
import { LineChart } from '../components/LineChart';
import { averages, beforeAfter, signed } from '../stats';
import { medKindLabel } from '../types';
import { fmtDate } from '../dates';
import { daysAgo } from '../dates';

export default function TrendsScreen() {
  const c = useTheme();
  const { data } = useStore();
  const [range, setRange] = useState(30);
  const [metric, setMetric] = useState<'bp' | 'pulse'>('bp');
  const [medId, setMedId] = useState<string | null>(null);
  const [cmpDays, setCmpDays] = useState(14);

  const from = daysAgo(range - 1).getTime();
  const to = Date.now();
  const list = useMemo(
    () => data.measurements.filter((m) => new Date(m.ts).getTime() >= from).sort((a, b) => a.ts.localeCompare(b.ts)),
    [data.measurements, from],
  );
  const a = averages(list);
  const morning = averages(list.filter((m) => new Date(m.ts).getHours() < 12));
  const evening = averages(list.filter((m) => new Date(m.ts).getHours() >= 17));

  const meds = data.medChanges; // neueste zuerst
  const selMed = meds.find((x) => x.id === medId) ?? meds[0] ?? null;
  const ba = selMed ? beforeAfter(data.measurements, selMed.ts, cmpDays) : null;
  const markers = meds
    .map((x, i) => ({ t: new Date(x.ts).getTime(), label: 'M' }))
    .filter((mk) => mk.t >= from && mk.t <= to);

  const pts = (k: 'sys' | 'dia' | 'pulse') => list.map((m) => ({ t: new Date(m.ts).getTime(), v: m[k] }));

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <H>Trends</H>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {[7, 30, 90].map((r) => (
          <Chip key={r} label={`${r} Tage`} on={range === r} onPress={() => setRange(r)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Chip label="Blutdruck" on={metric === 'bp'} onPress={() => setMetric('bp')} />
        <Chip label="Puls" on={metric === 'pulse'} onPress={() => setMetric('pulse')} />
      </View>

      {list.length === 0 ? (
        <Card>
          <Text style={{ color: c.ink, fontSize: 17, fontWeight: '700', marginBottom: 4 }}>Keine Daten in diesem Zeitraum</Text>
          <Muted>Sobald du Werte einträgst, zeichne ich hier deinen Verlauf.</Muted>
        </Card>
      ) : (
        <>
          <Card>
            {metric === 'bp' ? (
              <LineChart
                series={[
                  { name: 'Systolisch', color: c.accent, points: pts('sys') },
                  { name: 'Diastolisch', color: c.low, points: pts('dia') },
                ]}
                from={from}
                to={to}
                min={40}
                max={200}
                markers={markers}
              />
            ) : (
              <LineChart
                series={[{ name: 'Puls', color: c.bad, points: pts('pulse') }]}
                from={from}
                to={to}
                min={40}
                max={140}
                markers={markers}
              />
            )}
          </Card>

          <Card>
            <Text style={{ color: c.muted, fontSize: 13 }}>Durchschnitt, {a.count} Messungen</Text>
            <Text style={{ color: c.ink, fontSize: 34, fontWeight: '800' }}>
              {a.sys}/{a.dia} <Text style={{ fontSize: 16, color: c.muted }}>Puls {a.pulse}</Text>
            </Text>
          </Card>

          <Card>
            <Text style={{ color: c.ink, fontSize: 17, fontWeight: '700', marginBottom: 8 }}>Morgens und abends</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: '48%' }}>
                <Muted>Morgens (vor 12 Uhr)</Muted>
                <Text style={{ color: c.ink, fontSize: 24, fontWeight: '800' }}>
                  {morning.count ? `${morning.sys}/${morning.dia}` : '–'}
                </Text>
                <Muted>{morning.count} Messungen</Muted>
              </View>
              <View style={{ width: '48%' }}>
                <Muted>Abends (ab 17 Uhr)</Muted>
                <Text style={{ color: c.ink, fontSize: 24, fontWeight: '800' }}>
                  {evening.count ? `${evening.sys}/${evening.dia}` : '–'}
                </Text>
                <Muted>{evening.count} Messungen</Muted>
              </View>
            </View>
          </Card>
        </>
      )}
      <Card>
        <Text style={{ color: c.ink, fontSize: 17, fontWeight: '700', marginBottom: 8 }}>Vor und nach Medikamentenänderung</Text>
        {!selMed || !ba ? (
          <Muted>Trag unter „Verlauf“ eine Medikamentenänderung ein. Dann siehst du hier die Durchschnitte davor und danach.</Muted>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {meds.map((x) => (
                <Chip key={x.id} label={`${fmtDate(new Date(x.ts)).slice(0, 6)} ${x.name}`} on={x.id === selMed.id} onPress={() => setMedId(x.id)} />
              ))}
            </ScrollView>
            <Muted>
              {medKindLabel(selMed.kind)}
              {selMed.dose ? ` · ${selMed.dose}` : ''} · {fmtDate(new Date(selMed.ts))}
            </Muted>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {[7, 14, 30].map((d) => (
                <Chip key={d} label={`${d} Tage`} on={cmpDays === d} onPress={() => setCmpDays(d)} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <View style={{ width: '48%' }}>
                <Muted>Davor</Muted>
                <Text style={{ color: c.ink, fontSize: 26, fontWeight: '800' }}>
                  {ba.before.count ? `${ba.before.sys}/${ba.before.dia}` : '–'}
                </Text>
                <Muted>
                  Puls {ba.before.pulse ?? '–'} · {ba.before.count} Messungen
                </Muted>
              </View>
              <View style={{ width: '48%' }}>
                <Muted>Danach</Muted>
                <Text style={{ color: c.ink, fontSize: 26, fontWeight: '800' }}>
                  {ba.after.count ? `${ba.after.sys}/${ba.after.dia}` : '–'}
                </Text>
                <Muted>
                  Puls {ba.after.pulse ?? '–'} · {ba.after.count} Messungen
                </Muted>
              </View>
            </View>
            {ba.before.count > 0 && ba.after.count > 0 ? (
              <Text style={{ color: c.ink, fontSize: 16, fontWeight: '700', marginTop: 10 }}>
                Unterschied: {signed(ba.diffSys)}/{signed(ba.diffDia)}, Puls {signed(ba.diffPulse)}
              </Text>
            ) : (
              <Muted style={{ marginTop: 10 }}>Für den Vergleich braucht es Messungen in beiden Zeiträumen.</Muted>
            )}
            <Muted style={{ marginTop: 4 }}>Jeweils die {cmpDays} Tage vor bzw. nach dem Zeitpunkt der Änderung.</Muted>
          </>
        )}
      </Card>
    </ScrollView>
  );
}
