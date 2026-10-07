import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { Card, H, Muted } from '../components/ui';
import { Ring } from '../components/Ring';
import { achievements, bestStreak, currentStreak, summaryText, weekCount } from '../stats';

export default function MotivationScreen() {
  const c = useTheme();
  const { data } = useStore();
  const list = data.measurements;
  const goal = data.settings.weeklyGoal;
  const week = weekCount(list);
  const streak = currentStreak(list);
  const ach = achievements(list, goal);
  const done = ach.filter((x) => x.done).length;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <H>Dran bleiben</H>
      <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ring value={week} goal={goal} />
        <View style={{ marginLeft: 18, flex: 1 }}>
          <Text style={{ color: c.ink, fontSize: 17, fontWeight: '700' }}>Wochenziel</Text>
          <Muted>
            {week >= goal ? 'Geschafft. Alles darüber ist Bonus.' : `Noch ${goal - week} ${goal - week === 1 ? 'Messung' : 'Messungen'} bis zum Ziel.`}
          </Muted>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Card style={{ width: '48.5%' }}>
          <Muted>Aktuelle Serie</Muted>
          <Text style={{ color: c.ink, fontSize: 32, fontWeight: '800' }}>{streak}</Text>
          <Muted>{streak === 1 ? 'Tag' : 'Tage'}</Muted>
        </Card>
        <Card style={{ width: '48.5%' }}>
          <Muted>Beste Serie</Muted>
          <Text style={{ color: c.ink, fontSize: 32, fontWeight: '800' }}>{bestStreak(list)}</Text>
          <Muted>Tage</Muted>
        </Card>
      </View>

      <Card>
        <Text style={{ color: c.ink, fontSize: 17, fontWeight: '700', marginBottom: 4 }}>Wochenrückblick</Text>
        <Muted>{summaryText(list, goal)}</Muted>
      </Card>

      <Text style={{ color: c.ink, fontSize: 17, fontWeight: '700', marginVertical: 8 }}>
        Abzeichen ({done} von {ach.length})
      </Text>
      {ach.map((a) => (
        <Card key={a.id} style={{ opacity: a.done ? 1 : 0.55, flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              marginRight: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: a.done ? c.ok : c.line,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{a.done ? '✓' : ''}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.ink, fontSize: 16, fontWeight: '700' }}>{a.title}</Text>
            <Muted>{a.text}</Muted>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}
