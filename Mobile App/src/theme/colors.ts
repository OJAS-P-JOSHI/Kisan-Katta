/**
 * Single source of truth for raw color values.
 * Never reference hex codes outside this file; consume the semantic
 * `lightColors` map (or the Paper/Navigation themes) everywhere else.
 */

export const palette = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  /** Deep earthy green — headlines / primary actions */
  green900: '#1B5E20',
  /** Soft primary brand green */
  green700: '#2E7D32',
  /** Mid leaf green — accents, icons */
  green500: '#43A047',
  /** Soft foliage wash */
  green100: '#C8E6C9',
  /** Whisper-green for decorative washes */
  green50: '#EEF5EB',

  /** Soft harvest gold — secondary accents (not neon) */
  amber700: '#C9A227',
  /** Soft harvest wash / earth beige */
  amber100: '#F3E9D2',

  /** Warm white / soft field background */
  sand: '#F8F7F2',
  mist: '#E4E8DE',

  /** Dark leaf / ink */
  ink: '#1A1C19',
  slate: '#3F463C',
  steel: '#6E7669',

  red700: '#BA1A1A',
  red100: '#FFDAD6',

  /** Soft steel blue — confidence MEDIUM chips */
  blue800: '#2F5F7A',
  blue100: '#DCE8F0',

  /** Warm harvest orange — confidence LOW chips */
  orange800: '#9A6B1A',
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
