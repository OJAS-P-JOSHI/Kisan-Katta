import { BottomTabBar, type BottomTabBarProps } from 'expo-router/js-tabs';
import { memo, useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { spacing } from '@/theme';

import {
  tabBarAdapt,
  tabBarColors,
  tabBarTokens,
  tabBarWebGlass,
} from './tabBar.theme';

/**
 * Mirrors `tabBarHideOnKeyboard`. The dock floats over the scene, so the glass
 * shell has to leave with the inner bar instead of hovering above the keyboard.
 */
function useKeyboardShown(): boolean {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setShown(true));
    const hide = Keyboard.addListener(hideEvent, () => setShown(false));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return shown;
}

/**
 * Floating frosted dock. Material is a short stack — fill, green tint, top
 * sheen, hairline highlight, inner rim, grounded wash — so it reads as glass
 * on Android without a blur package. Web adds a backdrop filter on the same
 * layers. Navigation behavior remains owned by BottomTabBar.
 */
export const PremiumTabBar = memo(function PremiumTabBar(props: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const adapt = tabBarAdapt(width);
  const bottomPad = Math.max(props.insets.bottom, spacing.sm);
  const keyboardShown = useKeyboardShown();

  if (keyboardShown) return null;

  return (
    <View
      style={[
        styles.outer,
        {
          paddingBottom: bottomPad + tabBarTokens.floatMarginBottom,
          paddingHorizontal: adapt.floatMarginH,
        },
      ]}
    >
      <View style={[styles.shellWrap, tabBarWebGlass]}>
        <View style={styles.frost}>
          <View style={styles.tint} />
          <View style={styles.deep} />
          <View style={styles.sheen} />
          <View style={styles.highlight} />
          <View style={styles.ambient} />
          <View style={styles.baseLine} />
          <View style={styles.innerRim} />
        </View>
        <View style={[styles.tabs, { paddingHorizontal: adapt.horizontalInset }]}>
          <BottomTabBar {...props} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: tabBarColors.outer,
    pointerEvents: 'box-none',
  },
  shellWrap: {
    width: '100%',
    maxWidth: tabBarTokens.maxWidth,
    alignSelf: 'center',
    borderRadius: tabBarTokens.shellRadius,
    overflow: 'visible',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tabBarColors.surfaceBorder,
    backgroundColor: tabBarColors.surface,
    shadowColor: tabBarColors.shadow,
    shadowOpacity: tabBarTokens.shadowOpacity,
    shadowRadius: tabBarTokens.shadowRadius,
    shadowOffset: { width: 0, height: tabBarTokens.shadowOffsetY },
    elevation: tabBarTokens.elevation,
  },
  frost: {
    ...StyleSheet.absoluteFill,
    borderRadius: tabBarTokens.shellRadius,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tabBarColors.surfaceEdge,
    pointerEvents: 'none',
  },
  tint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: tabBarColors.surfaceTint,
  },
  deep: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
    backgroundColor: tabBarColors.surfaceDeep,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: '40%',
    borderTopLeftRadius: tabBarTokens.shellRadius,
    borderTopRightRadius: tabBarTokens.shellRadius,
    backgroundColor: tabBarColors.sheen,
  },
  highlight: {
    position: 'absolute',
    top: 1,
    left: 18,
    right: 18,
    height: StyleSheet.hairlineWidth * 2,
    borderRadius: 1,
    backgroundColor: tabBarColors.highlight,
  },
  ambient: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 0,
    height: 8,
    backgroundColor: tabBarColors.ambient,
  },
  baseLine: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: tabBarColors.baseLine,
  },
  innerRim: {
    position: 'absolute',
    top: 1,
    right: 1,
    bottom: 1,
    left: 1,
    borderRadius: tabBarTokens.shellRadius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tabBarColors.innerRim,
  },
  tabs: {
    paddingVertical: tabBarTokens.shellPadV,
    overflow: 'visible',
    zIndex: 1,
  },
});
