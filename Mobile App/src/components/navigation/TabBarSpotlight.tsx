import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { tabBarColors, tabBarTokens } from './tabBar.theme';

type TabBarSpotlightProps = {
  activeIndex: number;
  tabCount: number;
  barWidth: number;
};

/** Sliding soft-green spotlight beneath the active tab slot. */
export const TabBarSpotlight = memo(function TabBarSpotlight({
  activeIndex,
  tabCount,
  barWidth,
}: TabBarSpotlightProps) {
  const indexAnim = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(indexAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      friction: 11,
      tension: 150,
    }).start();
  }, [activeIndex, indexAnim]);

  const { spotlightWidth, translateX } = useMemo(() => {
    const inner = Math.max(barWidth - tabBarTokens.horizontalInset * 2, 0);
    const slot = tabCount > 0 ? inner / tabCount : 0;
    const spotW = slot * tabBarTokens.spotlightWidthRatio;
    const offset = (slot - spotW) / 2 + tabBarTokens.horizontalInset;

    const inputRange = Array.from({ length: tabCount }, (_, i) => i);
    const outputRange = inputRange.map((i) => i * slot + offset);

    return {
      spotlightWidth: spotW,
      translateX: indexAnim.interpolate({
        inputRange,
        outputRange,
        extrapolate: 'clamp',
      }),
    };
  }, [barWidth, indexAnim, tabCount]);

  if (barWidth <= 0 || tabCount === 0) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.spotlight,
        {
          width: spotlightWidth,
          transform: [{ translateX }],
        },
      ]}
    />
  );
});

const styles = StyleSheet.create({
  spotlight: {
    position: 'absolute',
    top: tabBarTokens.spotlightInsetV,
    bottom: tabBarTokens.spotlightInsetV,
    left: 0,
    borderRadius: tabBarTokens.spotlightRadius,
    backgroundColor: tabBarColors.spotlight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tabBarColors.spotlightBorder,
    zIndex: 0,
  },
});
