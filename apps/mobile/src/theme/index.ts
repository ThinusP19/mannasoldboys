export { tamaguiConfig, type AppConfig } from './tamagui.config';
export { colors, brandColors } from './colors';

// Typography scales
export const typography = {
  heading: {
    h1: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
    h2: { fontSize: 28, lineHeight: 36, fontWeight: '600' as const },
    h3: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
    h4: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
    h5: { fontSize: 18, lineHeight: 26, fontWeight: '500' as const },
    h6: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
  },
  body: {
    large: { fontSize: 18, lineHeight: 28 },
    default: { fontSize: 16, lineHeight: 24 },
    small: { fontSize: 14, lineHeight: 20 },
    xs: { fontSize: 12, lineHeight: 16 },
  },
};

// Spacing scale (based on 4px grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border radius
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
