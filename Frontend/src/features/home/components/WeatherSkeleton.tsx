import { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { Card } from 'react-native-paper';

import { palette, radius, spacing } from '@/theme';

/** Animated pulsing grey box — the primitive for all skeleton states. */
const SkeletonBox = memo(function SkeletonBox({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ backgroundColor: palette.mist, borderRadius: radius.sm, opacity }, style]}
    />
  );
});

export function WeatherCardSkeleton() {
  return (
    <Card mode="elevated" style={sk.card}>
      <Card.Content style={sk.content}>
        <View style={sk.topRow}>
          <SkeletonBox style={sk.iconBox} />
          <SkeletonBox style={sk.tempBox} />
        </View>
        <SkeletonBox style={sk.msgBox} />
        <SkeletonBox style={sk.divider} />
        <View style={sk.statsRow}>
          <SkeletonBox style={sk.stat} />
          <SkeletonBox style={sk.stat} />
          <SkeletonBox style={sk.stat} />
        </View>
        <View style={[sk.statsRow, { marginTop: spacing.sm }]}>
          <SkeletonBox style={sk.stat} />
          <SkeletonBox style={sk.stat} />
          <SkeletonBox style={sk.stat} />
        </View>
      </Card.Content>
    </Card>
  );
}

export function AlertSkeleton() {
  return (
    <Card mode="elevated" style={sk.card}>
      <Card.Content>
        <SkeletonBox style={sk.alertBox} />
      </Card.Content>
    </Card>
  );
}

export function ForecastSkeleton() {
  return (
    <View style={sk.forecastRow}>
      {[1, 2, 3, 4].map((i) => (
        <SkeletonBox key={i} style={sk.forecastCard} />
      ))}
    </View>
  );
}

const sk = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  content: { gap: spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBox: { width: 80, height: 80, borderRadius: radius.md },
  tempBox: { width: 80, height: 60 },
  msgBox: { height: 40, borderRadius: radius.pill },
  divider: { height: 1, marginVertical: spacing.xs },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, height: 64 },
  alertBox: { height: 56 },
  forecastRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  forecastCard: { width: 80, height: 120, borderRadius: radius.md },
});
