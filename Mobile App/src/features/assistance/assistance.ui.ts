import { Platform, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import { elevation, palette, radius, spacing } from '@/theme';

/**
 * साथ-scoped presentation tokens. Colors stay on the existing Agrisathi
 * palette — this file does not introduce a new brand.
 */
export const saath = {
  cream: '#FDF9F3',
  heading: '#1B5E20',
  primary: '#006A2C',
  primaryMuted: palette.green500,
  wash: palette.green50,
  washStrong: palette.green100,
  tagline: '#5C5348',
  body: palette.slate,
  muted: palette.steel,
  white: palette.white,
  line: 'rgba(46, 125, 50, 0.10)',
  searchBorder: '#E4DFD4',
  searchBorderFocus: '#8FBF98',
  searchWashFocus: '#F7FBF7',
  inkShadow: palette.ink,
  error: palette.red700,
  disabled: palette.mist,
} as const;

export const saathRadius = {
  card: radius.xl,
  control: radius.lg,
  chip: radius.pill,
  image: radius.lg,
} as const;

export const saathShadow = {
  card: elevation.card,
  soft: elevation.soft,
} as const;

export const saathCard: ViewStyle = {
  backgroundColor: saath.white,
  borderRadius: saathRadius.card,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: saath.line,
  overflow: 'hidden',
  ...saathShadow.card,
};

export const saathSearchPill: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  minHeight: 50,
  borderRadius: saathRadius.chip,
  backgroundColor: saath.white,
  borderWidth: 1,
  borderColor: saath.searchBorder,
  paddingHorizontal: 4,
  ...saathShadow.soft,
};

export const saathSearchInput: TextStyle = {
  flex: 1,
  minWidth: 0,
  minHeight: 44,
  paddingVertical: Platform.OS === 'android' ? 0 : 8,
  color: saath.heading,
  fontWeight: '500',
  textAlignVertical: 'center',
  includeFontPadding: false,
};

export const saathText = {
  heroTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 20,
  },
  introBody: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  meta: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  supportCount: {
    fontSize: 13,
    fontWeight: '700' as const,
    lineHeight: 18,
  },
  supportAction: {
    fontSize: 13,
    fontWeight: '700' as const,
    lineHeight: 16,
  },
  chip: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
} as const;

export function saathPadX(width: number): number {
  if (width >= 768) return Math.max(spacing.xl, Math.round((width - 680) / 2));
  if (width >= 600) return spacing.lg;
  const scale = Math.min(Math.max(width / 390, 0.82), 1.06);
  return Math.max(14, Math.min(20, Math.round(18 * scale)));
}

export function saathImageSize(width: number): number {
  if (width < 360) return 88;
  if (width < 390) return 96;
  if (width >= 768) return 120;
  return 108;
}
