import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useEffect, useRef } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet, View, useWindowDimensions, type ColorValue } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { tabBarAdapt, tabBarAnim, tabBarColors, tabBarTokens } from './tabBar.theme';

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

/** Smooth decelerate — no overshoot, no bounce. */
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.inOut(Easing.quad);

/**
 * Active state lives on the content: green icon + green label, a short pop,
 * a slight lift, a 3px dot, and a slot-wide haze so faint it is not a shape.
 *
 * Vector icons are never wrapped in createAnimatedComponent — Reanimated's
 * web runtime calls setNativeProps on them and Expo icons do not implement it.
 * Color/glyph transitions are an opacity crossfade of two static icons.
 */
export const TabBarIcon = memo(function TabBarIcon({ pair, label, focused }: TabBarIconProps) {
  const { width } = useWindowDimensions();
  const adapt = tabBarAdapt(width);
  const reduceMotion = useReducedMotion();

  const progress = useSharedValue(focused ? 1 : 0);
  const iconScale = useSharedValue<number>(
    focused ? tabBarAnim.iconSettled : tabBarAnim.iconInactive,
  );
  const lift = useSharedValue<number>(focused ? tabBarAnim.liftSettled : 0);
  const ready = useRef(false);

  useEffect(() => {
    const settle = () => {
      progress.set(focused ? 1 : 0);
      iconScale.set(focused ? tabBarAnim.iconSettled : tabBarAnim.iconInactive);
      lift.set(focused ? tabBarAnim.liftSettled : 0);
    };

    if (!ready.current) {
      ready.current = true;
      settle();
      return;
    }

    if (reduceMotion) {
      settle();
      return;
    }

    progress.set(
      withTiming(focused ? 1 : 0, {
        duration: focused ? tabBarAnim.duration : tabBarAnim.outDuration,
        easing: easeOut,
      }),
    );

    if (focused) {
      iconScale.set(
        withSequence(
          withTiming(tabBarAnim.iconFrom, { duration: 0 }),
          withTiming(tabBarAnim.iconPeak, { duration: tabBarAnim.iconPopUp, easing: easeOut }),
          withTiming(tabBarAnim.iconSettled, {
            duration: tabBarAnim.iconPopSettle,
            easing: easeInOut,
          }),
        ),
      );
      lift.set(
        withSequence(
          withTiming(tabBarAnim.liftFrom, { duration: 0 }),
          withTiming(tabBarAnim.liftPeak, { duration: tabBarAnim.iconPopUp, easing: easeOut }),
          withTiming(tabBarAnim.liftSettled, {
            duration: tabBarAnim.iconPopSettle,
            easing: easeInOut,
          }),
        ),
      );
      return;
    }

    iconScale.set(
      withTiming(tabBarAnim.iconInactive, {
        duration: tabBarAnim.outDuration,
        easing: easeInOut,
      }),
    );
    lift.set(withTiming(0, { duration: tabBarAnim.outDuration, easing: easeInOut }));
  }, [focused, iconScale, lift, progress, reduceMotion]);

  const itemStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.get() }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.get() }],
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 1], [1, 0]),
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 1], [0, 1]),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.get(),
      [0, 1],
      [tabBarColors.inactiveLabel, tabBarColors.activeLabel],
    ),
    opacity: interpolate(progress.get(), [0, 1], [0.92, 1]),
  }));

  const dotStyle = useAnimatedStyle(() => {
    const value = progress.get();
    return {
      opacity: value,
      transform: [{ scale: interpolate(value, [0, 1], [0.35, 1]) }],
    };
  });

  return (
    <View style={styles.slot}>
      <Animated.View
        style={[
          styles.item,
          {
            marginHorizontal: adapt.itemGap,
            paddingHorizontal: adapt.itemPadH,
          },
          itemStyle,
        ]}
      >
        <Animated.View pointerEvents="none" style={[styles.glowWash, glowStyle]} />
        <Animated.View style={[styles.iconBox, iconStyle]}>
          <Animated.View style={[styles.iconLayer, inactiveIconStyle]}>
            <MaterialCommunityIcons
              name={pair.outline}
              size={tabBarTokens.iconSize}
              color={tabBarColors.inactive}
            />
          </Animated.View>
          <Animated.View style={[styles.iconLayer, activeIconStyle]}>
            <MaterialCommunityIcons
              name={pair.filled}
              size={tabBarTokens.iconSize}
              color={tabBarColors.active}
            />
          </Animated.View>
        </Animated.View>

        <Animated.Text
          style={[
            styles.label,
            focused ? styles.labelActive : styles.labelInactive,
            labelStyle,
            {
              marginTop: tabBarTokens.labelGap,
              fontSize: adapt.labelSize,
              lineHeight: adapt.labelLineHeight,
            },
          ]}
          allowFontScaling={false}
          numberOfLines={1}
          ellipsizeMode="clip"
          adjustsFontSizeToFit
          minimumFontScale={0.84}
        >
          {label}
        </Animated.Text>

        <Animated.View style={[styles.dot, dotStyle]} />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    height: tabBarTokens.slotHeight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  item: {
    minWidth: 0,
    maxWidth: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  iconBox: {
    width: tabBarTokens.iconBox,
    height: tabBarTokens.iconBox,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  iconLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
    height: tabBarTokens.glowWashH,
    backgroundColor: tabBarColors.glowWash,
  },
  label: {
    textAlign: 'center',
    maxWidth: '100%',
    flexShrink: 1,
    includeFontPadding: false,
    letterSpacing: -0.15,
  },
  labelInactive: {
    fontWeight: '500',
    color: tabBarColors.inactiveLabel,
  },
  labelActive: {
    fontWeight: '700',
    color: tabBarColors.activeLabel,
  },
  dot: {
    width: tabBarTokens.dotSize,
    height: tabBarTokens.dotSize,
    marginTop: tabBarTokens.dotGap,
    borderRadius: tabBarTokens.dotSize / 2,
    backgroundColor: tabBarColors.indicatorDot,
    pointerEvents: 'none',
  },
});
