import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from './src/store';
import { useTheme } from './src/theme';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import TrendsScreen from './src/screens/TrendsScreen';
import MotivationScreen from './src/screens/MotivationScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { useColorScheme } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

const TABS = [
  { key: 'home', label: 'Messen', C: HomeScreen },
  { key: 'history', label: 'Verlauf', C: HistoryScreen },
  { key: 'trends', label: 'Trends', C: TrendsScreen },
  { key: 'motivation', label: 'Ziele', C: MotivationScreen },
  { key: 'more', label: 'Mehr', C: SettingsScreen },
] as const;

type TabKey = 'home' | 'history' | 'trends' | 'motivation' | 'more';

function Icon({ name, color }: { name: TabKey; color: string }) {
  const p = { stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {name === 'home' && <Polyline points="2,12 7,12 9.5,5 14.5,19 17,12 22,12" {...p} />}
      {name === 'history' && (
        <>
          <Line x1="9" y1="7" x2="21" y2="7" {...p} />
          <Line x1="9" y1="12" x2="21" y2="12" {...p} />
          <Line x1="9" y1="17" x2="21" y2="17" {...p} />
          <Circle cx="4.5" cy="7" r="1" {...p} />
          <Circle cx="4.5" cy="12" r="1" {...p} />
          <Circle cx="4.5" cy="17" r="1" {...p} />
        </>
      )}
      {name === 'trends' && <Polyline points="3,17 9,11 13,15 21,6" {...p} />}
      {name === 'motivation' && (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Circle cx="12" cy="12" r="4.5" {...p} />
        </>
      )}
      {name === 'more' && (
        <>
          <Circle cx="5" cy="12" r="1.2" {...p} />
          <Circle cx="12" cy="12" r="1.2" {...p} />
          <Circle cx="19" cy="12" r="1.2" {...p} />
        </>
      )}
    </Svg>
  );
}

function Shell() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { ready } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('home');
  const Active = TABS.find((t) => t.key === tab)!.C;

  if (!ready) {
    return (
      <View style={[s.fill, { backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }
  return (
    <View style={[s.fill, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={s.fill}>
        <Active />
      </View>
      <View style={[s.bar, { backgroundColor: c.card, borderTopColor: c.line, paddingBottom: Math.max(insets.bottom, 6) }]}>
        {TABS.map((t) => {
          const on = t.key === tab;
          const col = on ? c.accent : c.muted;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={s.tab} accessibilityRole="tab" accessibilityState={{ selected: on }}>
              <View style={[s.pill, { backgroundColor: on ? c.accent + '26' : 'transparent' }]}>
                <Icon name={t.key} color={col} />
              </View>
              <Text style={{ color: col, fontSize: 12, fontWeight: on ? '700' : '500', marginTop: 2 }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  const scheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center' },
  pill: { width: 60, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
