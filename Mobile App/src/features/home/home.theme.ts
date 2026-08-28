import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import { elevation, palette, radius, spacing } from '@/theme';

/** Home-scoped design tokens — does not affect other screens. */

export const homeColors = {
  heroGradientTop: '#F9F5EC',
  heroGradientMid: '#EEF4E8',
  heroGradientBottom: palette.white,
  heroAccent: palette.green700,
  heroAccentMuted: palette.green500,
  heroAccentSoft: 'rgba(46, 125, 50, 0.08)',
  heroSkyWash: 'rgba(227, 240, 229, 0.65)',
  marketAccent: palette.green700,
  marketAccentLine: palette.green500,
  marketPrice: '#1B5E20',
  marketMandi: palette.blue800,
  supportAccent: palette.amber700,
  supportWarm: '#FBF6ED',
  supportBorder: 'rgba(201, 162, 39, 0.22)',
  inkSoft: '#3D4F42',
  inkMuted: '#6B756C',
  sandLine: 'rgba(46, 125, 50, 0.08)',
  sandInset: '#F7F4ED',
  utilityMuted: '#F3F5F2',
  divider: 'rgba(46, 125, 50, 0.06)',
} as const;

/** Vertical rhythm between Home sections. */
export const homeRhythm = {
  heroInner: spacing.sm,
  block: spacing.md + 4,
  utility: spacing.sm + 4,
} as const;

export const homeSpacing = {
  sectionGap: spacing.md + 4,
  sectionGapTight: spacing.md,
  horizontal: spacing.md,
} as const;

/** Devanagari-friendly text overrides for Home only. */
export const homeText = {
  heroGreeting: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.35,
    lineHeight: 32,
  },
  heroBrand: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  sectionHero: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  sectionPrimary: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.15,
    lineHeight: 23,
  },
  sectionUtility: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
    lineHeight: 21,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    lineHeight: 13,
    textTransform: 'uppercase' as const,
  },
  marathiBody: {
    lineHeight: 22,
  },
  marathiCaption: {
    lineHeight: 18,
  },
  tempDisplay: {
    fontSize: 56,
    fontWeight: '700' as const,
    letterSpacing: -2,
    lineHeight: 58,
  },
  tempUnit: {
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  priceHero: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 18,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    letterSpacing: 0.4,
    lineHeight: 12,
    textTransform: 'uppercase' as const,
  },
} satisfies Record<string, TextStyle>;

export const homeSurfaces = {
  /** LEVEL 1 — Hero shell (header + weather) */
  heroShell: {
    marginHorizontal: homeSpacing.horizontal,
    borderRadius: radius.xl + 2,
    overflow: 'hidden' as const,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: homeColors.sandLine,
    backgroundColor: palette.white,
    ...elevation.soft,
  } satisfies ViewStyle,
  hero: {
    borderRadius: radius.xl,
    overflow: 'hidden' as const,
    backgroundColor: 'transparent',
  } satisfies ViewStyle,
  weatherInner: {
    borderRadius: radius.lg,
    backgroundColor: homeColors.heroSkyWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(46, 125, 50, 0.07)',
  } satisfies ViewStyle,
  /** LEVEL 1 — Market hero */
  marketHero: {
    marginHorizontal: homeSpacing.horizontal,
    borderRadius: radius.xl,
    overflow: 'hidden' as const,
    backgroundColor: palette.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: homeColors.sandLine,
    ...elevation.card,
  } satisfies ViewStyle,
  marketAccentBar: {
    height: 3,
    backgroundColor: homeColors.marketAccentLine,
    opacity: 0.85,
  } satisfies ViewStyle,
  /** LEVEL 2 — Primary modules */
  primary: {
    marginHorizontal: homeSpacing.horizontal,
    borderRadius: radius.lg + 2,
    overflow: 'hidden' as const,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.mist,
    backgroundColor: palette.white,
    ...elevation.soft,
  } satisfies ViewStyle,
  /** LEVEL 3 — Utility / glance */
  utility: {
    marginHorizontal: homeSpacing.horizontal,
    borderRadius: radius.lg,
    overflow: 'hidden' as const,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: homeColors.divider,
    backgroundColor: palette.white,
  } satisfies ViewStyle,
  utilityOpen: {
    marginHorizontal: homeSpacing.horizontal,
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  } satisfies ViewStyle,
  /** LEVEL 3 — Support / Gram Sahakari */
  support: {
    marginHorizontal: homeSpacing.horizontal,
    borderRadius: radius.xl,
    overflow: 'hidden' as const,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: homeColors.supportBorder,
    backgroundColor: palette.white,
  } satisfies ViewStyle,
  supportHeader: {
    backgroundColor: homeColors.supportWarm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: homeColors.supportBorder,
  } satisfies ViewStyle,
} as const;
