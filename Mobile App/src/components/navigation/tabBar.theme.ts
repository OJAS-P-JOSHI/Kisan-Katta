import { StyleSheet } from 'react-native';

import { palette } from '@/theme';

/** Bottom navigation design tokens — scoped to tab bar only. */

export const tabBarColors = {
  outer: 'transparent',
  rim: palette.sand,
  surface: palette.white,
  surfaceBorder: 'rgba(46, 125, 50, 0.09)',
  spotlight: 'rgba(238, 245, 235, 0.92)',
  spotlightBorder: 'rgba(46, 125, 50, 0.12)',
  active: palette.green700,
  activeIcon: palette.green900,
  activeLabel: palette.green900,
  inactive: '#90988E',
  shadow: '#1A1C19',
  highlight: 'rgba(255, 255, 255, 0.8)',
} as const;

/** Active icon pop — scale peaks then settles; box sized to fit peak without clipping. */
export const tabBarAnim = {
  iconStartScale: 0.93,
  iconPeakScale: 1.07,
  iconSettleScale: 1.04,
  iconInactiveScale: 0.94,
  iconLiftPeak: -2,
  iconLiftSettle: -1,
  popDurationMs: 140,
  settleFriction: 8,
  settleTension: 130,
  fadeOutMs: 160,
} as const;

export const tabBarTokens = {
  height: 56,
  slotHeight: 46,
  floatMarginH: 12,
  floatMarginBottom: 8,
  rimRadius: 26,
  shellRadius: 24,
  spotlightRadius: 14,
  spotlightWidthRatio: 0.9,
  iconSize: 21,
  iconActiveSize: 20,
  /** Sized for iconActiveSize × iconPeakScale with glyph breathing room */
  iconBox: 26,
  touchTarget: 44,
  capsulePadH: 8,
  capsulePadV: 5,
  capsuleGap: 5,
  labelSize: 10,
  labelLineHeight: 13,
  shadowOpacity: 0.065,
  shadowRadius: 12,
  shadowOffsetY: 5,
  elevation: 7,
  horizontalInset: 3,
  rimWidth: 1.5,
  spotlightInsetV: 4,
  shellPadV: 5,
} as const;

export const tabBarLayout = StyleSheet.create({
  item: {
    flex: 1,
    minHeight: tabBarTokens.touchTarget,
    height: tabBarTokens.slotHeight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 1,
    zIndex: 2,
    overflow: 'visible',
  },
});
