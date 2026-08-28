import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useEffect, useRef } from 'react';
import type { ComponentProps } from 'react';
import { Animated, StyleSheet, Text, View, type ColorValue } from 'react-native';

import { tabBarAnim, tabBarColors, tabBarTokens } from './tabBar.theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type TabIconPair = {
  outline: IconName;
  filled: IconName;
};

type TabBarIconProps = {
  pair: TabIconPair;
  label: string;
  color: ColorValue;
  focused: boolean;
};

export const TabBarIcon = memo(function TabBarIcon({ pair, label, color, focused }: TabBarIconProps) {
  const focusProgress = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const iconPop = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    if (focused) {
      iconPop.setValue(0);
      focusProgress.setValue(0);
      Animated.parallel([
        Animated.timing(focusProgress, {
          toValue: 1,
          duration: tabBarAnim.popDurationMs + 80,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(iconPop, {
            toValue: 0.65,
            duration: tabBarAnim.popDurationMs,
            useNativeDriver: true,
          }),
          Animated.spring(iconPop, {
            toValue: 1,
            friction: tabBarAnim.settleFriction,
            tension: tabBarAnim.settleTension,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(focusProgress, {
          toValue: 0,
          duration: tabBarAnim.fadeOutMs,
          useNativeDriver: true,
        }),
        Animated.timing(iconPop, {
          toValue: 0,
          duration: tabBarAnim.fadeOutMs,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused, focusProgress, iconPop]);

  const labelSlide = focusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, 0],
  });
  const inactiveOpacity = focusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const inactiveScale = focusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, tabBarAnim.iconInactiveScale],
  });

  const iconScale = iconPop.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [tabBarAnim.iconStartScale, tabBarAnim.iconPeakScale, tabBarAnim.iconSettleScale],
  });
  const iconLift = iconPop.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [1, tabBarAnim.iconLiftPeak, tabBarAnim.iconLiftSettle],
  });
  const iconOpacity = iconPop.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.88, 1, 1],
  });

  return (
    <View style={styles.slot}>
      <Animated.View
        pointerEvents={focused ? 'none' : 'auto'}
        style={[
          styles.inactiveLayer,
          {
            opacity: inactiveOpacity,
            transform: [{ scale: inactiveScale }],
          },
        ]}
      >
        <View style={styles.iconBox}>
          <MaterialCommunityIcons
            name={pair.outline}
            color={color}
            size={tabBarTokens.iconSize}
          />
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents={focused ? 'auto' : 'none'}
        style={[styles.capsule, { opacity: focusProgress }]}
      >
        <Animated.View
          style={[
            styles.iconBox,
            {
              opacity: iconOpacity,
              transform: [{ scale: iconScale }, { translateY: iconLift }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name={pair.filled}
            color={tabBarColors.activeIcon}
            size={tabBarTokens.iconActiveSize}
          />
        </Animated.View>
        <Animated.View
          style={{
            transform: [{ translateX: labelSlide }],
            flexShrink: 1,
            minWidth: 0,
            opacity: focusProgress,
          }}
        >
          <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
            {label}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  slot: {
    width: '100%',
    minHeight: tabBarTokens.slotHeight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  inactiveLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: tabBarTokens.touchTarget,
    height: tabBarTokens.touchTarget,
    overflow: 'visible',
  },
  iconBox: {
    width: tabBarTokens.iconBox,
    height: tabBarTokens.iconBox,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tabBarTokens.capsuleGap,
    paddingHorizontal: tabBarTokens.capsulePadH,
    paddingVertical: tabBarTokens.capsulePadV,
    maxWidth: '100%',
    minWidth: 0,
    overflow: 'visible',
  },
  label: {
    fontSize: tabBarTokens.labelSize,
    lineHeight: tabBarTokens.labelLineHeight,
    fontWeight: '700',
    color: tabBarColors.activeLabel,
    flexShrink: 1,
    includeFontPadding: false,
  },
});
