import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';

interface Star { x: number; y: number; r: number; op: number }

const STARS: Star[] = (() => {
  let s = 0xDEADBEEF;
  const r = () => { s = ((s * 1664525 + 1013904223) >>> 0); return s / 0x100000000; };
  return Array.from({ length: 88 }, () => ({ x: r() * 100, y: r() * 100, r: r() * 1.0 + 0.25, op: r() * 0.50 + 0.18 }));
})();

export function StarCanvas() {
  const { isDark } = useTheme();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="sky" cx="50" cy="22" r="70" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={isDark ? '#0D1628' : '#E4DBFF'} />
            <Stop offset="100%" stopColor={isDark ? '#060A14' : '#EDE7FF'} />
          </RadialGradient>
          <RadialGradient id="neb1" cx="30" cy="40" r="28" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={isDark ? '#1A2A50' : '#C8B8F8'} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={isDark ? '#070B14' : '#EDE7FF'} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="neb2" cx="72" cy="65" r="25" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={isDark ? '#2A1A40' : '#D4C0FF'} stopOpacity="0.14" />
            <Stop offset="100%" stopColor={isDark ? '#070B14' : '#EDE7FF'} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#sky)" />
        <Rect width="100" height="100" fill="url(#neb1)" />
        <Rect width="100" height="100" fill="url(#neb2)" />
        {STARS.map((st, i) => (
          <Circle
            key={i}
            cx={st.x}
            cy={st.y}
            r={st.r}
            fill={isDark ? '#FFFFFF' : '#5040A0'}
            opacity={isDark ? st.op : st.op * 0.30}
          />
        ))}
      </Svg>
    </View>
  );
}
