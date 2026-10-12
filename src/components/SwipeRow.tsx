import React, { useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

const W = 96;

// Zeile, die nach links gewischt werden kann, um „Löschen“ anzuzeigen.
// Der rote Hintergrund erscheint erst beim Wischen, damit er nicht am Rand durchscheint.
export function SwipeRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
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
  const delOpacity = x.interpolate({ inputRange: [-W, -12, 0], outputRange: [1, 1, 0], extrapolate: 'clamp' });
  return (
    <View style={{ marginBottom: 8 }}>
      <Animated.View pointerEvents={open.current ? 'auto' : 'none'} style={[s.del, { backgroundColor: c.bad, opacity: delOpacity }]}>
        <Pressable onPress={onDelete} style={s.delBtn} accessibilityLabel="Löschen">
          <Text style={{ color: '#fff', fontWeight: '800' }}>Löschen</Text>
        </Pressable>
      </Animated.View>
      <Animated.View
        {...pan.panHandlers}
        style={[s.row, { backgroundColor: c.card, borderColor: c.line, transform: [{ translateX: x }] }]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  del: { position: 'absolute', right: 0, top: 0, bottom: 0, width: W + 20, borderRadius: 12, alignItems: 'flex-end', justifyContent: 'center' },
  delBtn: { width: W, height: '100%', alignItems: 'center', justifyContent: 'center' },
});
