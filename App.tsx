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

const TABS = [
  { key: 'home', label: 'Messen', C: HomeScreen },
  { key: 'history', label: 'Verlauf', C: HistoryScreen },
  { key: 'trends', label: 'Trends', C: TrendsScreen },
  { key: 'motivation', label: 'Ziele', C: MotivationScreen },
  { key: 'more', label: 'Mehr', C: SettingsScreen },
] as const;

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
      <View style={[s.bar, { backgroundColor: c.card, borderTopColor: c.line, paddingBottom: Math.max(insets.bottom, 8) }]}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={s.tab} accessibilityRole="tab" accessibilityState={{ selected: on }}>
              <View style={[s.dot, { backgroundColor: on ? c.accent : 'transparent' }]} />
              <Text style={{ color: on ? c.accent : c.muted, fontSize: 13, fontWeight: on ? '800' : '600' }}>{t.label}</Text>
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
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  dot: { width: 22, height: 4, borderRadius: 2, marginBottom: 6 },
});
