import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';

export function Ring({ value, goal, size = 120 }: { value: number; goal: number; size?: number }) {
  const c = useTheme();
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, goal > 0 ? value / goal : 0);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.line} strokeWidth={10} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={pct >= 1 ? c.ok : c.accent}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ color: c.ink, fontSize: 28, fontWeight: '800' }}>
          {value}/{goal}
        </Text>
      </View>
    </View>
  );
}
