export const DarkColors = {
  background: '#070B14',
  surface: '#0C1525',
  surfaceElevated: '#132038',
  surfaceGlass: 'rgba(12, 21, 37, 0.88)',
  border: '#1B2D4F',
  borderLight: '#253F6B',
  borderGlow: 'rgba(184, 150, 90, 0.20)',
  text: '#EDF1FF',
  textSecondary: '#7A90B5',
  textTertiary: '#3C5070',
  accent: '#B8965A',
  accentLight: '#D4B078',
  accentGlow: 'rgba(184, 150, 90, 0.15)',
  destructive: '#FF453A',
  success: '#32D74B',
  warning: '#FFD60A',
};

export const LightColors = {
  background: '#EDE7FF',
  surface: '#F5F1FF',
  surfaceElevated: '#FFFFFF',
  surfaceGlass: 'rgba(245, 241, 255, 0.92)',
  border: '#D6CEF0',
  borderLight: '#C5BBEA',
  borderGlow: 'rgba(120, 90, 200, 0.20)',
  text: '#130E2A',
  textSecondary: '#4B3E80',
  textTertiary: '#9080C5',
  accent: '#7A5730',
  accentLight: '#9A7248',
  accentGlow: 'rgba(122, 87, 48, 0.12)',
  destructive: '#FF3B30',
  success: '#30D158',
  warning: '#FF9500',
};

export const Colors = DarkColors;
export type ColorScheme = typeof DarkColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
