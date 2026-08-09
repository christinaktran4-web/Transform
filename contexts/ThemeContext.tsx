import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { DarkColors, LightColors, ColorScheme } from '../constants/theme';

interface ThemeCtx { colors: ColorScheme; isDark: boolean }
const Ctx = createContext<ThemeCtx>({ colors: DarkColors, isDark: true });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const value = useMemo<ThemeCtx>(
    () => scheme === 'light' ? { colors: LightColors, isDark: false } : { colors: DarkColors, isDark: true },
    [scheme],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() { return useContext(Ctx); }
