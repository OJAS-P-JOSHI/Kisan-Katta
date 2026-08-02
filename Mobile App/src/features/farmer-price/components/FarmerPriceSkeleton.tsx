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

/** Mirrors the summary card layout so the first paint does not jump. */
const SummaryCardSkeleton = memo(function SummaryCardSkeleton() {
  return (
    <View style={[styles.card, cardSurface]}>
      <SkeletonBox style={styles.title} />
      <SkeletonBox style={styles.subtitle} />
      <View style={styles.metrics}>
        <SkeletonBox style={styles.metric} />
        <SkeletonBox style={styles.metric} />
      </View>
      <SkeletonBox style={styles.meta} />
      <SkeletonBox style={styles.divider} />
      <View style={styles.chipsRow}>
        <SkeletonBox style={styles.chip} />
        <SkeletonBox style={styles.chipWide} />
      </View>
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
    padding: spacing.md,
    gap: 14,
  },
  title: { height: 30, width: '55%' },
  subtitle: { height: 14, width: '45%' },
  metrics: { flexDirection: 'row', gap: spacing.md },
  metric: { flex: 1, height: 62, borderRadius: radius.md },
  meta: { height: 16, width: '70%' },
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
  chipsRow: { flexDirection: 'row', gap: spacing.sm },
  chip: { height: 28, width: 110, borderRadius: radius.pill },
  chipWide: { height: 28, width: 140, borderRadius: radius.pill },
  button: { height: 48, width: '100%', borderRadius: radius.lg },
});
