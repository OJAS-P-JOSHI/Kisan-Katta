import { memo, useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { cardSurface, palette, radius, spacing } from '@/theme';

const SkeletonBox = memo(function SkeletonBox({ style }: { style?: ViewStyle }) {
  const [opacity] = useState(() => new Animated.Value(0.3));

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

/** Mirrors the lighter summary card so the first paint does not jump. */
const SummaryCardSkeleton = memo(function SummaryCardSkeleton() {
  return (
    <View style={[styles.card, cardSurface]}>
      <View style={styles.header}>
        <SkeletonBox style={styles.emoji} />
        <View style={styles.headerText}>
          <SkeletonBox style={styles.title} />
          <SkeletonBox style={styles.subtitle} />
        </View>
      </View>
      <View style={styles.metrics}>
        <SkeletonBox style={styles.metric} />
        <SkeletonBox style={styles.metric} />
      </View>
      <SkeletonBox style={styles.status} />
      <SkeletonBox style={styles.button} />
    </View>
  );
});

export function FarmerPriceSkeleton() {
  return (
    <View style={styles.root} accessibilityLabel="Loading">
      <SummaryCardSkeleton />
      <SummaryCardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  card: {
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { height: 28, width: 28, borderRadius: radius.md },
  headerText: { flex: 1, gap: 4 },
  title: { height: 22, width: '50%' },
  subtitle: { height: 12, width: '40%' },
  metrics: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, height: 56, borderRadius: radius.lg },
  status: { height: 34, width: '100%', borderRadius: radius.lg },
  button: { height: 44, width: '100%', borderRadius: radius.xl },
});
