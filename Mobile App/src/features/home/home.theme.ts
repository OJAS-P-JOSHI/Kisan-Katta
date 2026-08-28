import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import { elevation, palette, radius, spacing } from '@/theme';

/** Home-scoped design tokens — does not affect other screens. */

export const homeColors = {
  heroGradientTop: '#F7F3EA',
  heroGradientMid: '#F0F5EB',
  heroGradientBottom: palette.white,
  heroAccent: palette.green700,
  heroAccentMuted: palette.green500,
  marketAccent: palette.green700,
  supportAccent: palette.amber700,
  inkSoft: '#3D4F42',
  sandLine: 'rgba(46, 125, 50, 0.08)',
} as const;

/** Vertical rhythm between Home sections. */
export const homeRhythm = {
  /** Tight coupling inside hero zone */
  heroInner: spacing.sm,
  /** Between major blocks */
  block: spacing.lg,
  /** Utility sections */
  utility: spacing.md,
} as const;

export const homeSpacing = {
  sectionGap: spacing.lg,
  sectionGapTight: spacing.md,
  horizontal: spacing.md,
} as const;

/** Devanagari-friendly text overrides for Home only. */
export const homeText = {
  heroGreeting: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    lineHeight: 36,
  },
  heroBrand: {
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.15,
    lineHeight: 18,
  },
  sectionHero: {
    fontSize: 19,
    fontWeight: '700' as const,
    letterSpacing: -0.25,
    lineHeight: 26,
  },
  sectionPrimary: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.15,
    lineHeight: 24,
  },
  sectionUtility: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
    lineHeight: 23,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.6,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
  marathiBody: {
    lineHeight: 24,
  },
  marathiCaption: {
    lineHeight: 20,
  },
  tempDisplay: {
    fontSize: 64,
    fontWeight: '700' as const,
    letterSpacing: -2.5,
    lineHeight: 68,
  },
  priceHero: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
} satisfies Record<string, TextStyle>;

export const homeSurfaces = {
  /** Unified header + weather shell */
  heroShell: {
    marginHorizontal: homeSpacing.horizontal,
    borderRadius: radius.xl + 4,
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
  primary: {
    marginHorizontal: homeSpacing.horizontal,
    borderRadius: radius.xl,
    overflow: 'hidden' as const,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.mist,
    backgroundColor: palette.white,
    ...elevation.soft,
  } satisfies ViewStyle,
  utility: {
    marginHorizontal: homeSpacing.horizontal,
    borderRadius: radius.lg,
    overflow: 'hidden' as const,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.mist,
    backgroundColor: palette.white,
  } satisfies ViewStyle,
  marketHero: {
    marginHorizontal: homeSpacing.horizontal,
    borderRadius: radius.xl,
    overflow: 'hidden' as const,
    backgroundColor: palette.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: homeColors.sandLine,
    ...elevation.card,
  } satisfies ViewStyle,
  marketRow: {
    borderRadius: radius.lg,
    backgroundColor: palette.sand,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.mist,
  } satisfies ViewStyle,
  support: {
    marginHorizontal: homeSpacing.horizontal,
    borderRadius: radius.xl,
    overflow: 'hidden' as const,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201, 162, 39, 0.18)',
    backgroundColor: palette.white,
  } satisfies ViewStyle,
} as const;

export const tabBarTokens = {
  height: 70,
  iconSize: 22,
  iconActiveSize: 24,
  iconActiveScale: 1.04,
  indicatorSize: 34,
  labelFontSize: 9,
  labelLineHeight: 11,
  topShadowOpacity: 0.06,
} as const;
