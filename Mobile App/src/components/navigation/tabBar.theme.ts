import { StyleSheet } from 'react-native';

import { palette, radius, spacing } from '@/theme';

/** Bottom navigation design tokens — scoped to tab bar only. */

export const tabBarColors = {
  outer: palette.sand,
  surface: palette.white,
  surfaceBorder: 'rgba(46, 125, 50, 0.12)',
  pill: palette.green700,
  onPill: palette.white,
  active: palette.green700,
  inactive: palette.steel,
  inactiveLabel: palette.steel,
  shadow: palette.ink,
} as const;

export const tabBarTokens = {
  /** Must match slot content — avoids empty space inside BottomTabBar */
  height: 46,
  slotHeight: 46,
  floatMarginBottom: 6,
  shellRadius: 22,
  chipRadius: radius.md,
  iconSize: 20,
  iconBox: 20,
  touchTarget: 44,
  labelSize: 10,
  labelLineHeight: 12,
  labelGap: 1,
  shadowOpacity: 0.1,
  shadowRadius: 14,
  shadowOffsetY: 6,
  elevation: 6,
  horizontalInset: 2,
  shellPadV: 4,
  maxWidth: 560,
} as const;

/** Density tweaks so six equal tabs stay readable on narrow phones. */
export function tabBarAdapt(width: number) {
  const narrow = width < 360;
  const tablet = width >= 600;
  const wideTablet = width >= 768;

  return {
    floatMarginH: wideTablet ? spacing.lg : tablet ? spacing.md : narrow ? 6 : 8,
    horizontalInset: tablet ? spacing.sm : 2,
    labelSize: width < 380 ? 9 : tabBarTokens.labelSize,
    labelLineHeight: width < 380 ? 11 : tabBarTokens.labelLineHeight,
    chipGap: narrow ? 1 : width < 400 ? 2 : 4,
  } as const;
}

export const tabBarLayout = StyleSheet.create({
  item: {
    flex: 1,
    minWidth: 0,
    height: tabBarTokens.slotHeight,
    minHeight: tabBarTokens.touchTarget,
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: 0,
    zIndex: 2,
    overflow: 'visible',
  },
  icon: {
    width: '100%',
    height: '100%',
    alignSelf: 'stretch',
    overflow: 'visible',
  },
  button: {
    flex: 1,
    width: '100%',
    padding: 0,
    margin: 0,
    justifyContent: 'center',
    alignItems: 'stretch',
    overflow: 'visible',
  },
});
