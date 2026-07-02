import { DefaultTheme as NavigationDefaultTheme } from 'expo-router';
import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

import { lightColors } from './colors';

/** 4pt spacing scale. Use these tokens instead of raw numbers. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Corner radius scale. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;

/**
 * The application's Paper (MD3) theme. We extend the stock light theme and
 * override only the color roles defined in our palette.
 */
export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
};

/** Navigation theme kept in sync with the Paper theme. */
export const navigationTheme: ReactNavigation.Theme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: paperTheme.colors.primary,
    background: paperTheme.colors.background,
    card: paperTheme.colors.surface,
    text: paperTheme.colors.onSurface,
    border: paperTheme.colors.outlineVariant,
    notification: paperTheme.colors.error,
  },
};

export type AppTheme = typeof paperTheme;
