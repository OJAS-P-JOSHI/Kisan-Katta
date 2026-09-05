import { Platform, StyleSheet } from 'react-native';

import { palette, radius, spacing } from '@/theme';

/** Bottom navigation design tokens — scoped to tab bar only. */

export const tabBarColors = {
  outer: 'transparent',
  /**
   * Frosted glass — opaque enough that labels stay readable over any scene,
   * translucent enough that the page still bleeds through as frost, not a card.
   */
  surface: 'rgba(255, 252, 247, 0.74)',
  surfaceTint: 'rgba(232, 242, 230, 0.28)',
  surfaceDeep: 'rgba(46, 125, 50, 0.045)',
  surfaceBorder: 'rgba(255, 255, 255, 0.72)',
  surfaceEdge: 'rgba(46, 125, 50, 0.10)',
  innerRim: 'rgba(255, 255, 255, 0.42)',
  baseLine: 'rgba(46, 125, 50, 0.10)',
  highlight: 'rgba(255, 255, 255, 0.88)',
  sheen: 'rgba(255, 255, 255, 0.28)',
  ambient: 'rgba(46, 125, 50, 0.06)',
  /** Active content — the icon and label themselves, never a plate behind them. */
  active: palette.green700,
  activeLabel: palette.green700,
  inactive: 'rgba(63, 70, 60, 0.62)',
  inactiveLabel: 'rgba(63, 70, 60, 0.70)',
  /** Slot-wide air — so faint it reads as light, not a drawn shape. */
  glowWash: 'rgba(46, 125, 50, 0.03)',
  indicatorDot: palette.green700,
  shadow: palette.ink,
  /** Shared with the top-right account control. */
  pill: palette.green700,
  pillGlowSoft: 'rgba(67, 160, 71, 0.22)',
  onPill: palette.white,
} as const;

export const tabBarTokens = {
  /** Must match slot content — avoids empty space inside BottomTabBar. */
  height: 62,
  slotHeight: 62,
  floatMarginBottom: 12,
  shellRadius: radius.pill,
  iconSize: 22,
  iconBox: 26,
  touchTarget: 48,
  labelSize: 10,
  labelLineHeight: 13,
  labelGap: 4,
  dotSize: 3,
  dotGap: 3,
  glowWashH: 36,
  shadowOpacity: 0.12,
  shadowRadius: 20,
  shadowOffsetY: 8,
  elevation: 10,
  horizontalInset: 8,
  shellPadV: 6,
  maxWidth: 560,
} as const;

export const tabBarAnim = {
  duration: 210,
  outDuration: 170,
  pressDuration: 70,
  releaseDuration: 130,
  iconPopUp: 90,
  iconPopSettle: 130,
  pressScale: 0.97,
  pressOpacity: 0.92,
  iconInactive: 0.98,
  iconFrom: 0.96,
  iconPeak: 1.14,
  iconSettled: 1.08,
  liftFrom: 2,
  liftPeak: -3,
  liftSettled: -1,
} as const;

/** Visual height of the glass capsule itself, excluding float margin and safe area. */
export const tabBarShellHeight = tabBarTokens.slotHeight + tabBarTokens.shellPadV * 2;

/** Space the floating dock occupies above the screen bottom. */
export function tabBarOverlayInset(safeBottom: number): number {
  return (
    tabBarShellHeight + tabBarTokens.floatMarginBottom + Math.max(safeBottom, spacing.sm)
  );
}

/**
 * Bottom padding for scrollable content on tab screens. The dock overlays the
 * scene so content can pass under the glass — this keeps the *last* item, FABs,
 * and buttons clear of it.
 */
export function tabBarContentInset(safeBottom: number): number {
  return tabBarOverlayInset(safeBottom) + spacing.sm;
}

/** Density tweaks so five tabs stay readable — including `बाजारपेठ` — on narrow phones. */
export function tabBarAdapt(width: number) {
  const narrow = width < 360;
  const compact = width < 380;
  const tablet = width >= 600;
  const wideTablet = width >= 768;

  return {
    floatMarginH: wideTablet ? spacing.lg : tablet ? spacing.md : narrow ? 10 : 16,
    horizontalInset: tablet ? spacing.sm : narrow ? 4 : 6,
    labelSize: compact ? 10 : width < 430 ? 10 : 11,
    labelLineHeight: compact ? 13 : width < 430 ? tabBarTokens.labelLineHeight : 14,
    itemGap: 0,
    itemPadH: narrow ? 2 : 4,
  } as const;
}

/** Web-only backdrop frost. Native uses layered translucent fills (no extra blur package). */
export const tabBarWebGlass =
  Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(22px) saturate(150%)',
      } as const)
    : null;

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
