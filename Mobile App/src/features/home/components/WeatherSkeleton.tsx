import { memo, useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { palette, radius, spacing } from '@/theme';

import { homeSpacing } from '../home.theme';

const SkeletonBox = memo(function SkeletonBox({ style }: { style?: ViewStyle }) {
  const opacity = useMemo(() => new Animated.Value(0.3), []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ backgroundColor: palette.mist, borderRadius: radius.md, opacity }, style]}
    />
  );
});

export function WeatherCardSkeleton() {
  return (
    <View style={sk.root}>
      <View style={sk.primaryRow}>
        <SkeletonBox style={sk.temp} />
        <SkeletonBox style={sk.condition} />
      </View>
      <SkeletonBox style={sk.advice} />
      <SkeletonBox style={sk.stats} />
    </View>
  );
}

export function AlertSkeleton() {
  return <SkeletonBox style={sk.alertBar} />;
}

export function ForecastSkeleton() {
  return (
    <View style={sk.forecastWrapper}>
      <View style={sk.forecastRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBox key={i} style={sk.forecastCard} />
        ))}
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  root: { gap: spacing.md, paddingTop: spacing.sm },
  primaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  temp: { width: 120, height: 64, borderRadius: radius.lg },
  condition: { width: 100, height: 80, borderRadius: radius.lg },
  advice: { height: 40, borderRadius: radius.md },
  stats: { height: 120, borderRadius: radius.lg },
  alertBar: { height: 36, borderRadius: radius.lg },
  forecastWrapper: { marginHorizontal: homeSpacing.horizontal },
  forecastRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  forecastCard: { width: 76, height: 128, borderRadius: radius.md },
});
