import { BottomTabBar, type BottomTabBarProps } from 'expo-router/js-tabs';
import { memo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/theme';

import { tabBarAdapt, tabBarColors, tabBarTokens } from './tabBar.theme';

/**
 * Floating compact dock. Navigation behavior remains owned by BottomTabBar.
 */
export const PremiumTabBar = memo(function PremiumTabBar(props: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const adapt = tabBarAdapt(width);
  const bottomPad = Math.max(insets.bottom, spacing.sm);

  return (
    <View
      style={[
        styles.outer,
        {
          paddingBottom: bottomPad + tabBarTokens.floatMarginBottom,
          paddingHorizontal: adapt.floatMarginH,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.shellWrap}>
        <View style={[styles.shell, { paddingHorizontal: adapt.horizontalInset }]}>
          <BottomTabBar {...props} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  outer: {
    backgroundColor: tabBarColors.outer,
  },
  shellWrap: {
    width: '100%',
    maxWidth: tabBarTokens.maxWidth,
    alignSelf: 'center',
  },
  shell: {
    backgroundColor: tabBarColors.surface,
    borderRadius: tabBarTokens.shellRadius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tabBarColors.surfaceBorder,
    overflow: 'visible',
    paddingVertical: tabBarTokens.shellPadV,
    shadowColor: tabBarColors.shadow,
    shadowOpacity: tabBarTokens.shadowOpacity,
    shadowRadius: tabBarTokens.shadowRadius,
    shadowOffset: { width: 0, height: tabBarTokens.shadowOffsetY },
    elevation: tabBarTokens.elevation,
  },
});
