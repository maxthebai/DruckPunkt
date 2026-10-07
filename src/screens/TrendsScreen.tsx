import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { Card, Chip, H, Muted } from '../components/ui';
import { LineChart } from '../components/LineChart';
import { averages } from '../stats';
import { classify, levelColor, levelLabel } from '../classify';
import { daysAgo } from '../dates';

export default function TrendsScreen() {
  const c = useTheme();
  const { data } = useStore();
  const [range, setRange] = useState(30);
  const [metric, setMetric] = useState<'bp' | 'pulse'>('bp');

  const from = daysAgo(range - 1).getTime();
  const to = Date.now();
  const list = useMemo(
    () => data.measurements.filter((m) => new Date(m.ts).getTime() >= from).sort((a, b) => a.ts.localeCompare(b.ts)),
    [data.measurements, from],
  );
  const a = averages(list);
  const morning = averages(list.filter((m) => new Date(m.ts).getHours() < 12));
  const evening = averages(list.filter((m) => new Date(m.ts).getHours() >= 17));

  const pts = (k: 'sys' | 'dia' | 'pulse') => list.map((m) => ({ t: new Date(m.ts).getTime(), v: m[k] }));
  const lvl = a.sys && a.dia ? classify(a.sys, a.dia) : null;

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
                  { name: 'Oben', color: c.accent, points: pts('sys') },
                  { name: 'Unten', color: c.low, points: pts('dia') },
                ]}
                from={from}
                to={to}
                min={40}
                max={200}
                zones={[
                  { from: 40, to: 130, color: c.ok },
                  { from: 130, to: 140, color: c.warn },
                  { from: 140, to: 200, color: c.bad },
                ]}
              />
            ) : (
              <LineChart
                series={[{ name: 'Puls', color: c.bad, points: pts('pulse') }]}
                from={from}
                to={to}
                min={40}
                max={140}
                zones={[{ from: 60, to: 100, color: c.ok }]}
              />
            )}
            {metric === 'bp' && <Muted style={{ marginTop: 6 }}>Farbflächen zeigen die Bereiche für „oben“: normal, hochnormal, erhöht.</Muted>}
          </Card>

          <Card>
            <Text style={{ color: c.muted, fontSize: 13 }}>Durchschnitt, {a.count} Messungen</Text>
            <Text style={{ color: c.ink, fontSize: 34, fontWeight: '800' }}>
              {a.sys}/{a.dia} <Text style={{ fontSize: 16, color: c.muted }}>Puls {a.pulse}</Text>
            </Text>
            {lvl && <Text style={{ color: levelColor(lvl, c), fontWeight: '700' }}>{levelLabel(lvl)}</Text>}
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
      <Muted>Die Einordnung ist nur eine Orientierung und ersetzt keine ärztliche Beratung.</Muted>
    </ScrollView>
  );
}
