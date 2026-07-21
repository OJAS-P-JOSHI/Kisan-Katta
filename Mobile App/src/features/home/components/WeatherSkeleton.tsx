import { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { Card } from 'react-native-paper';

import { cardSurface, palette, radius, spacing } from '@/theme';

/** Animated pulsing grey box — the primitive for all skeleton states. */
const SkeletonBox = memo(function SkeletonBox({ style }: { style?: ViewStyle }) {
  const opacityRef = useRef(new Animated.Value(0.3));
  const opacity = opacityRef.current;

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
    <Card mode="elevated" style={[sk.card, cardSurface]}>
      <SkeletonBox style={sk.heroBand} />
      <Card.Content style={sk.content}>
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
    <Card mode="elevated" style={[sk.card, cardSurface]}>
      <Card.Content>
        <SkeletonBox style={sk.alertBox} />
      </Card.Content>
    </Card>
  );
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
  card: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  heroBand: { height: 160, borderRadius: 0 },
  content: { gap: spacing.md, paddingTop: spacing.md },
  msgBox: { height: 44, borderRadius: radius.md },
  divider: { height: 1, marginVertical: spacing.xs },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, height: 72, borderRadius: radius.md },
  alertBox: { height: 72, borderRadius: radius.md },
  forecastWrapper: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  forecastRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  forecastCard: { width: 76, height: 140, borderRadius: radius.md },
});
