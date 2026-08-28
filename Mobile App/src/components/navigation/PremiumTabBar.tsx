import { BottomTabBar, type BottomTabBarProps } from 'expo-router/js-tabs';
import { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/theme';

import { TabBarSpotlight } from './TabBarSpotlight';
import { tabBarColors, tabBarTokens } from './tabBar.theme';

/**
 * Emerald Meridian — floating glass dock with a sliding inverted-emerald active pill.
 * Navigation behavior remains owned by React Navigation's BottomTabBar.
 */
export const PremiumTabBar = memo(function PremiumTabBar(props: BottomTabBarProps) {
  const { state } = props;
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, spacing.sm);
  const [barWidth, setBarWidth] = useState(0);

  return (
    <View
      style={[
        styles.outer,
        {
          paddingBottom: bottomPad + tabBarTokens.floatMarginBottom,
          paddingHorizontal: tabBarTokens.floatMarginH,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.glowHalo} pointerEvents="none" />
      <View style={styles.rim}>
        <View
          style={styles.shell}
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        >
          <View style={styles.surfaceTint} pointerEvents="none" />
          <View style={styles.topHighlight} pointerEvents="none" />
          <TabBarSpotlight
            activeIndex={state.index}
            tabCount={state.routes.length}
            barWidth={barWidth}
          />
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
  glowHalo: {
    position: 'absolute',
    left: tabBarTokens.floatMarginH + 14,
    right: tabBarTokens.floatMarginH + 14,
    bottom: tabBarTokens.floatMarginBottom + 1,
    height: 10,
    borderRadius: 12,
    backgroundColor: tabBarColors.pillGlow,
    opacity: 0.28,
    transform: [{ scaleX: 0.9 }],
  },
  rim: {
    borderRadius: tabBarTokens.rimRadius,
    padding: tabBarTokens.rimWidth,
    backgroundColor: tabBarColors.rim,
    overflow: 'hidden',
    shadowColor: tabBarColors.shadow,
    shadowOpacity: tabBarTokens.shadowOpacity,
    shadowRadius: tabBarTokens.shadowRadius,
    shadowOffset: { width: 0, height: tabBarTokens.shadowOffsetY },
    elevation: tabBarTokens.elevation,
  },
  shell: {
    backgroundColor: tabBarColors.surface,
    borderRadius: tabBarTokens.shellRadius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tabBarColors.surfaceBorder,
    overflow: 'visible',
    paddingVertical: tabBarTokens.shellPadV,
    paddingHorizontal: tabBarTokens.horizontalInset,
  },
  surfaceTint: {
    ...StyleSheet.absoluteFill,
    borderRadius: tabBarTokens.shellRadius,
    backgroundColor: tabBarColors.surfaceTint,
    zIndex: 0,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: StyleSheet.hairlineWidth,
    backgroundColor: tabBarColors.highlight,
    zIndex: 3,
  },
});
