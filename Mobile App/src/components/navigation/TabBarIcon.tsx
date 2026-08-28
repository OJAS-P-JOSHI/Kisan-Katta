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
          duration: tabBarAnim.popDurationMs + 70,
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

  const inactiveOpacity = focusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const activeOpacity = focusProgress;
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
    outputRange: [0, tabBarAnim.iconLiftPeak, tabBarAnim.iconLiftSettle],
  });
  const labelRise = focusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 0],
  });

  return (
    <View style={styles.slot}>
      <Animated.View
        pointerEvents={focused ? 'none' : 'auto'}
        style={[
          styles.column,
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
        <Text style={styles.inactiveLabel} numberOfLines={1} ellipsizeMode="tail">
          {label}
        </Text>
      </Animated.View>

      <Animated.View
        pointerEvents={focused ? 'auto' : 'none'}
        style={[styles.column, styles.activeColumn, { opacity: activeOpacity }]}
      >
        <Animated.View
          style={[
            styles.iconBox,
            {
              transform: [{ scale: iconScale }, { translateY: iconLift }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name={pair.filled}
            color={tabBarColors.onPill}
            size={tabBarTokens.iconActiveSize}
          />
        </Animated.View>
        <Animated.View style={{ transform: [{ translateY: labelRise }], width: '100%' }}>
          <Text style={styles.activeLabel} numberOfLines={1} ellipsizeMode="tail">
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
    height: tabBarTokens.slotHeight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  column: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    overflow: 'visible',
  },
  activeColumn: {
    position: 'absolute',
  },
  iconBox: {
    width: tabBarTokens.iconBox,
    height: tabBarTokens.iconBox - 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  inactiveLabel: {
    marginTop: tabBarTokens.labelGap,
    fontSize: tabBarTokens.labelSize,
    lineHeight: tabBarTokens.labelLineHeight,
    fontWeight: '500',
    color: tabBarColors.inactiveLabel,
    textAlign: 'center',
    width: '100%',
    includeFontPadding: false,
    letterSpacing: 0.1,
  },
  activeLabel: {
    marginTop: tabBarTokens.labelGap,
    fontSize: tabBarTokens.labelSize,
    lineHeight: tabBarTokens.labelLineHeight,
    fontWeight: '700',
    color: tabBarColors.onPillMuted,
    textAlign: 'center',
    width: '100%',
    includeFontPadding: false,
    letterSpacing: 0.1,
  },
});
