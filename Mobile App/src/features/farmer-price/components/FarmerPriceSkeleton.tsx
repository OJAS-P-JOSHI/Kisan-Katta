import { memo, useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { mp, mpCard, mpRadius } from '@/features/marketplace/marketplace.ui';
import { spacing } from '@/theme';

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
      style={[{ backgroundColor: mp.produceWash, borderRadius: mpRadius.control, opacity }, style]}
    />
  );
});

/** Mirrors the lighter summary card so the first paint does not jump. */
const SummaryCardSkeleton = memo(function SummaryCardSkeleton() {
  return (
    <View style={[styles.card, mpCard]}>
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
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { height: 40, width: 40, borderRadius: 12 },
  headerText: { flex: 1, gap: 4 },
  title: { height: 22, width: '50%' },
  subtitle: { height: 12, width: '40%' },
  metrics: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, height: 56, borderRadius: mpRadius.tile },
  status: { height: 34, width: '100%', borderRadius: mpRadius.tile },
  button: { height: 44, width: '100%', borderRadius: mpRadius.chip },
});
