import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter, type Href } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { strings } from '@/constants';

import { tabBarAnim, tabBarColors, tabBarWebGlass } from './tabBar.theme';

const PROFILE_HREF = '/profile' as Href;
const TABS_HREF = '/(tabs)' as Href;

const SIZE_COMPACT = 38;
const SIZE_DEFAULT = 40;
const ICON_SIZE = 20;

function isProfilePath(pathname: string): boolean {
  return pathname === '/profile';
}

/**
 * Persistent circular account control. Navigates to the existing `/profile`
 * route — never a second profile stack.
 */
export function AccountButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const active = isProfilePath(pathname);
  const size = width < 360 ? SIZE_COMPACT : SIZE_DEFAULT;
  const press = useSharedValue<number>(0);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.get(), [0, 1], [1, tabBarAnim.pressScale]) }],
    opacity: interpolate(press.get(), [0, 1], [1, tabBarAnim.pressOpacity]),
  }));

  return (
    <Pressable
      onPress={() => {
        if (active) return;
        router.push(PROFILE_HREF);
      }}
      onPressIn={() => {
        press.set(
          withTiming(1, {
            duration: tabBarAnim.pressDuration,
            easing: Easing.out(Easing.quad),
          }),
        );
      }}
      onPressOut={() => {
        press.set(
          withTiming(0, {
            duration: tabBarAnim.releaseDuration,
            easing: Easing.out(Easing.quad),
          }),
        );
      }}
      accessibilityRole="button"
      accessibilityLabel={strings.account.a11y}
      accessibilityState={{ selected: active }}
      hitSlop={4}
      android_ripple={{ color: 'transparent', borderless: true }}
      style={styles.hit}
    >
      <Animated.View
        style={[
          styles.circle,
          tabBarWebGlass,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          active ? styles.circleActive : styles.circleIdle,
          pressStyle,
        ]}
      >
        {active ? <View pointerEvents="none" style={styles.activeGlow} /> : null}
        {active ? null : <View pointerEvents="none" style={styles.sheen} />}
        <MaterialCommunityIcons
          name={active ? 'account' : 'account-outline'}
          size={ICON_SIZE}
          color={active ? tabBarColors.onPill : tabBarColors.active}
        />
      </Animated.View>
    </Pressable>
  );
}

/** Glass back control for Profile — pairs with the account button. */
export function HeaderBackButton() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const size = width < 360 ? SIZE_COMPACT : SIZE_DEFAULT;
  const press = useSharedValue<number>(0);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.get(), [0, 1], [1, tabBarAnim.pressScale]) }],
    opacity: interpolate(press.get(), [0, 1], [1, tabBarAnim.pressOpacity]),
  }));

  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }
        router.replace(TABS_HREF);
      }}
      onPressIn={() => {
        press.set(
          withTiming(1, {
            duration: tabBarAnim.pressDuration,
            easing: Easing.out(Easing.quad),
          }),
        );
      }}
      onPressOut={() => {
        press.set(
          withTiming(0, {
            duration: tabBarAnim.releaseDuration,
            easing: Easing.out(Easing.quad),
          }),
        );
      }}
      accessibilityRole="button"
      accessibilityLabel={strings.account.backA11y}
      hitSlop={4}
      android_ripple={{ color: 'transparent', borderless: true }}
      style={styles.hit}
    >
      <Animated.View
        style={[
          styles.circle,
          styles.circleIdle,
          tabBarWebGlass,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          pressStyle,
        ]}
      >
        <View pointerEvents="none" style={styles.sheen} />
        <MaterialCommunityIcons
          name="chevron-left"
          size={22}
          color={tabBarColors.active}
        />
      </Animated.View>
    </Pressable>
  );
}

/** Keeps existing header actions and places the account button last. */
export function HeaderActionCluster({ children }: { children?: ReactNode }) {
  return (
    <View style={styles.cluster}>
      {children}
      <AccountButton />
    </View>
  );
}

/** Native stack/tab `headerRight` slot for बाजार. */
export function MarketHeaderAccountButton() {
  return (
    <View style={styles.marketSlot}>
      <AccountButton />
    </View>
  );
}

const styles = StyleSheet.create({
  hit: {
    flexShrink: 0,
  },
  cluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  marketSlot: {
    marginRight: 8,
  },
  circle: {
    width: SIZE_DEFAULT,
    height: SIZE_DEFAULT,
    borderRadius: SIZE_DEFAULT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  circleIdle: {
    backgroundColor: tabBarColors.surface,
    borderColor: tabBarColors.surfaceBorder,
    shadowColor: tabBarColors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  circleActive: {
    backgroundColor: tabBarColors.pill,
    borderColor: 'rgba(255, 255, 255, 0.42)',
    shadowColor: tabBarColors.pill,
    shadowOpacity: 0.42,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  sheen: {
    ...StyleSheet.absoluteFill,
    borderRadius: SIZE_DEFAULT / 2,
    backgroundColor: tabBarColors.sheen,
    opacity: 0.55,
  },
  activeGlow: {
    position: 'absolute',
    top: -5,
    right: -5,
    bottom: -5,
    left: -5,
    borderRadius: (SIZE_DEFAULT + 10) / 2,
    backgroundColor: tabBarColors.pillGlowSoft,
  },
});
