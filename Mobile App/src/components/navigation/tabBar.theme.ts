import { StyleSheet } from 'react-native';

import { palette } from '@/theme';

/** Bottom navigation design tokens — scoped to tab bar only. */

export const tabBarColors = {
  outer: 'transparent',
  rim: '#E8E2D4',
  surface: 'rgba(255, 255, 255, 0.96)',
  surfaceTint: 'rgba(240, 248, 237, 0.55)',
  surfaceBorder: 'rgba(46, 125, 50, 0.11)',
  pill: palette.green700,
  pillHighlight: 'rgba(255, 255, 255, 0.22)',
  pillBorder: 'rgba(255, 255, 255, 0.18)',
  pillGlow: 'rgba(46, 125, 50, 0.28)',
  onPill: '#FFFFFF',
  onPillMuted: 'rgba(255, 255, 255, 0.88)',
  active: palette.green700,
  activeIcon: palette.green900,
  activeLabel: palette.green900,
  inactive: '#8B9489',
  inactiveLabel: '#7A8378',
  inactiveMuted: 'rgba(139, 148, 137, 0.72)',
  shadow: '#1A2418',
  highlight: 'rgba(255, 255, 255, 0.92)',
} as const;

/** Active icon pop — scale peaks then settles; box sized to fit peak without clipping. */
export const tabBarAnim = {
  iconStartScale: 0.92,
  iconPeakScale: 1.08,
  iconSettleScale: 1.04,
  iconInactiveScale: 0.96,
  iconLiftPeak: -1,
  iconLiftSettle: 0,
  popDurationMs: 150,
  settleFriction: 9,
  settleTension: 140,
  fadeOutMs: 150,
  pillArriveScale: 0.94,
} as const;

export const tabBarTokens = {
  /** Must match slot content — avoids empty space inside BottomTabBar */
  height: 46,
  slotHeight: 46,
  floatMarginH: 8,
  floatMarginBottom: 3,
  rimRadius: 22,
  shellRadius: 20,
  pillRadius: 12,
  pillWidthRatio: 0.92,
  iconSize: 20,
  iconActiveSize: 18,
  iconBox: 22,
  touchTarget: 44,
  labelSize: 8,
  labelLineHeight: 10,
  labelGap: 0,
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffsetY: 4,
  pillShadowOpacity: 0.28,
  pillShadowRadius: 6,
  elevation: 6,
  horizontalInset: 2,
  rimWidth: 1,
  pillInsetV: 1,
  shellPadV: 1,
} as const;

export const tabBarLayout = StyleSheet.create({
  item: {
    flex: 1,
    height: tabBarTokens.slotHeight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    zIndex: 2,
    overflow: 'visible',
  },
});
