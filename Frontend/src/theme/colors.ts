/**
 * Single source of truth for raw color values.
 * Never reference hex codes outside this file; consume the semantic
 * `lightColors` map (or the Paper/Navigation themes) everywhere else.
 */

export const palette = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  green900: '#1B5E20',
  green700: '#2E7D32',
  green500: '#43A047',
  green100: '#C8E6C9',

  amber700: '#F9A825',
  amber100: '#FFE08D',

  sand: '#F6F8F4',
  mist: '#DEE5D8',

  ink: '#1A1C19',
  slate: '#424940',
  steel: '#72796F',

  red700: '#BA1A1A',
  red100: '#FFDAD6',
} as const;

/**
 * Semantic color tokens mapped onto the Material Design 3 color roles
 * used by React Native Paper. Add new tokens here, not inline.
 */
export const lightColors = {
  primary: palette.green700,
  onPrimary: palette.white,
  primaryContainer: palette.green100,
  onPrimaryContainer: palette.green900,

  secondary: palette.amber700,
  onSecondary: palette.ink,
  secondaryContainer: palette.amber100,
  onSecondaryContainer: palette.ink,

  background: palette.sand,
  onBackground: palette.ink,
  surface: palette.white,
  onSurface: palette.ink,
  surfaceVariant: palette.mist,
  onSurfaceVariant: palette.slate,

  outline: palette.steel,
  outlineVariant: palette.mist,

  error: palette.red700,
  onError: palette.white,
  errorContainer: palette.red100,
  onErrorContainer: palette.red700,
} as const;

export type ColorToken = keyof typeof lightColors;
