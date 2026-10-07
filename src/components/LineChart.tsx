import React, { useState } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Svg, { Line, Polyline, Rect, Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme';

export type Point = { t: number; v: number };
export type Series = { name: string; color: string; points: Point[] };

export function LineChart({
  series,
  from,
  to,
  min,
  max,
  zones,
  height = 220,
}: {
  series: Series[];
  from: number;
  to: number;
  min: number;
  max: number;
  zones?: { from: number; to: number; color: string }[];
  height?: number;
}) {
  const c = useTheme();
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const padL = 34;
  const padR = 10;
  const padT = 10;
  const padB = 22;
  const x = (t: number) => padL + ((t - from) / Math.max(1, to - from)) * (w - padL - padR);
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * (height - padT - padB);
  const ticks: number[] = [];
  for (let v = Math.ceil(min / 20) * 20; v <= max; v += 20) ticks.push(v);
  const dayMs = 86400000;
  const days = Math.max(1, Math.round((to - from) / dayMs));
  const xt = [0, 0.5, 1].map((f) => from + f * (to - from));

  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      {w > 0 && (
        <Svg width={w} height={height}>
          {zones?.map((z, i) => (
            <Rect
              key={i}
              x={padL}
              width={w - padL - padR}
              y={y(Math.min(max, z.to))}
              height={Math.max(0, y(Math.max(min, z.from)) - y(Math.min(max, z.to)))}
              fill={z.color}
              opacity={0.1}
            />
          ))}
          {ticks.map((v) => (
            <React.Fragment key={v}>
              <Line x1={padL} x2={w - padR} y1={y(v)} y2={y(v)} stroke={c.line} strokeWidth={1} />
              <SvgText x={padL - 6} y={y(v) + 4} fontSize={10} fill={c.muted} textAnchor="end">
                {v}
              </SvgText>
            </React.Fragment>
          ))}
          {xt.map((t, i) => {
            const d = new Date(t);
            return (
              <SvgText
                key={i}
                x={x(t)}
                y={height - 6}
                fontSize={10}
                fill={c.muted}
                textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
              >
                {`${d.getDate()}.${d.getMonth() + 1}.`}
              </SvgText>
            );
          })}
          {series.map((s) => (
            <React.Fragment key={s.name}>
              {s.points.length > 1 && (
                <Polyline
                  points={s.points.map((p) => `${x(p.t)},${y(p.v)}`).join(' ')}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                />
              )}
              {s.points.map((p, i) => (
                <Circle key={i} cx={x(p.t)} cy={y(p.v)} r={days > 40 ? 2 : 3.5} fill={s.color} />
              ))}
            </React.Fragment>
          ))}
        </Svg>
      )}
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {series.map((s) => (
          <View key={s.name} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color, marginRight: 6 }} />
            <Text style={{ color: c.muted, fontSize: 13 }}>{s.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
