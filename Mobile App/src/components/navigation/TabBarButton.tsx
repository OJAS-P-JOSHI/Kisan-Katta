import { type BottomTabBarButtonProps } from 'expo-router/js-tabs';
import { Pressable, type GestureResponderEvent } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { tabBarAnim, tabBarLayout } from './tabBar.theme';

/**
 * Press scale/opacity for tab slots. Kept in its own file so React Compiler
 * memo-cache size stays stable across Fast Refresh of the tabs layout.
 */
export function TabBarButton(props: BottomTabBarButtonProps) {
  const press = useSharedValue<number>(0);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(press.get(), [0, 1], [1, tabBarAnim.pressScale]) },
    ],
    opacity: interpolate(press.get(), [0, 1], [1, tabBarAnim.pressOpacity]),
    flex: 1,
    width: '100%' as const,
  }));

  const onPress = (event: GestureResponderEvent) => {
    props.onPress?.(event);
  };

  return (
    <Pressable
      testID={props.testID}
      onPress={onPress}
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
      onLongPress={props.onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: props['aria-selected'] === true }}
      accessibilityLabel={typeof props['aria-label'] === 'string' ? props['aria-label'] : undefined}
      android_ripple={{ color: 'transparent', borderless: true }}
      style={[props.style, tabBarLayout.button]}
    >
      <Animated.View style={pressStyle}>{props.children}</Animated.View>
    </Pressable>
  );
}
