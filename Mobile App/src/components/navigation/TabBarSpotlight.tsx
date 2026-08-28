import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { tabBarAnim, tabBarColors, tabBarTokens } from './tabBar.theme';

type TabBarSpotlightProps = {
  activeIndex: number;
  tabCount: number;
  barWidth: number;
};

/**
 * Sliding emerald meridian pill — inverted active surface that glides between tabs.
 */
export const TabBarSpotlight = memo(function TabBarSpotlight({
  activeIndex,
  tabCount,
  barWidth,
}: TabBarSpotlightProps) {
  const indexAnim = useRef(new Animated.Value(activeIndex)).current;
  const arriveScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(indexAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      friction: 12,
      tension: 165,
    }).start();

    arriveScale.setValue(tabBarAnim.pillArriveScale);
    Animated.spring(arriveScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 175,
    }).start();
  }, [activeIndex, arriveScale, indexAnim]);

  const { pillWidth, translateX } = useMemo(() => {
    const inner = Math.max(barWidth - tabBarTokens.horizontalInset * 2, 0);
    const slot = tabCount > 0 ? inner / tabCount : 0;
    const width = slot * tabBarTokens.pillWidthRatio;
    const offset = (slot - width) / 2 + tabBarTokens.horizontalInset;

    const inputRange = Array.from({ length: tabCount }, (_, i) => i);
    const outputRange = inputRange.map((i) => i * slot + offset);

    return {
      pillWidth: width,
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
        styles.pillOuter,
        {
          width: pillWidth,
          transform: [{ translateX }, { scale: arriveScale }],
        },
      ]}
    >
      <View style={styles.pillBody}>
        <View style={styles.pillGloss} />
        <View style={styles.pillSheen} />
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  pillOuter: {
    position: 'absolute',
    top: tabBarTokens.pillInsetV,
    bottom: tabBarTokens.pillInsetV,
    left: 0,
    zIndex: 0,
    shadowColor: tabBarColors.pillGlow,
    shadowOpacity: tabBarTokens.pillShadowOpacity,
    shadowRadius: tabBarTokens.pillShadowRadius,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  pillBody: {
    flex: 1,
    borderRadius: tabBarTokens.pillRadius,
    backgroundColor: tabBarColors.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tabBarColors.pillBorder,
    overflow: 'hidden',
  },
  pillGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
    backgroundColor: tabBarColors.pillHighlight,
    borderTopLeftRadius: tabBarTokens.pillRadius,
    borderTopRightRadius: tabBarTokens.pillRadius,
  },
  pillSheen: {
    position: 'absolute',
    top: 1,
    left: '18%',
    right: '18%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
});
