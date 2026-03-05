import { createTamagui } from 'tamagui';
import { config } from '@tamagui/config/v3';
import { colors } from './colors';

// Create custom themes based on our app colors
const themes = {
  light: {
    background: colors.light.background,
    backgroundHover: colors.light.muted,
    backgroundPress: colors.light.secondary,
    backgroundFocus: colors.light.muted,
    backgroundStrong: colors.light.card,
    backgroundTransparent: 'transparent',

    color: colors.light.foreground,
    colorHover: colors.light.foreground,
    colorPress: colors.light.mutedForeground,
    colorFocus: colors.light.foreground,
    colorTransparent: 'transparent',

    borderColor: colors.light.border,
    borderColorHover: colors.light.input,
    borderColorFocus: colors.light.ring,
    borderColorPress: colors.light.border,

    placeholderColor: '#6b7280',

    // Semantic colors
    blue: colors.light.accent,
    red: colors.light.destructive,
    green: colors.light.success,
    yellow: colors.light.warning,

    // App-specific colors
    primary: colors.light.primary,
    primaryForeground: colors.light.primaryForeground,
    secondary: colors.light.secondary,
    secondaryForeground: colors.light.secondaryForeground,
    muted: colors.light.muted,
    mutedForeground: colors.light.mutedForeground,
    accent: colors.light.accent,
    accentForeground: colors.light.accentForeground,
    destructive: colors.light.destructive,
    destructiveForeground: colors.light.destructiveForeground,
    card: colors.light.card,
    cardForeground: colors.light.cardForeground,
  },

  dark: {
    background: colors.dark.background,
    backgroundHover: colors.dark.muted,
    backgroundPress: colors.dark.secondary,
    backgroundFocus: colors.dark.muted,
    backgroundStrong: colors.dark.card,
    backgroundTransparent: 'transparent',

    color: colors.dark.foreground,
    colorHover: colors.dark.foreground,
    colorPress: colors.dark.mutedForeground,
    colorFocus: colors.dark.foreground,
    colorTransparent: 'transparent',

    borderColor: colors.dark.border,
    borderColorHover: colors.dark.input,
    borderColorFocus: colors.dark.ring,
    borderColorPress: colors.dark.border,

    placeholderColor: colors.dark.mutedForeground,

    // Semantic colors
    blue: colors.dark.accent,
    red: colors.dark.destructive,
    green: colors.dark.success,
    yellow: colors.dark.warning,

    // App-specific colors
    primary: colors.dark.primary,
    primaryForeground: colors.dark.primaryForeground,
    secondary: colors.dark.secondary,
    secondaryForeground: colors.dark.secondaryForeground,
    muted: colors.dark.muted,
    mutedForeground: colors.dark.mutedForeground,
    accent: colors.dark.accent,
    accentForeground: colors.dark.accentForeground,
    destructive: colors.dark.destructive,
    destructiveForeground: colors.dark.destructiveForeground,
    card: colors.dark.card,
    cardForeground: colors.dark.cardForeground,
  },
};

export const tamaguiConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      ...themes.light,
    },
    dark: {
      ...config.themes.dark,
      ...themes.dark,
    },
  },
});

export default tamaguiConfig;

// TypeScript type for the config
export type AppConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
