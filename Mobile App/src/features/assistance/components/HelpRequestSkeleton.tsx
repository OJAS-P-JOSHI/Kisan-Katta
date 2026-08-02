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

/** Placeholder matching Marketplace ListingCard / HelpRequestCard horizontal layout. */
const HelpRequestCardSkeleton = memo(function HelpRequestCardSkeleton() {
  return (
    <View style={[styles.card, cardSurface]}>
      <View style={styles.cardRow}>
        <SkeletonBox style={styles.thumb} />
        <View style={styles.content}>
          <SkeletonBox style={styles.title} />
          <SkeletonBox style={styles.badge} />
          <SkeletonBox style={styles.support} />
          <SkeletonBox style={styles.place} />
          <SkeletonBox style={styles.meta} />
        </View>
      </View>
    </View>
  );
});

type HelpRequestSkeletonProps = {
  count?: number;
};

export function HelpRequestSkeleton({ count = 3 }: HelpRequestSkeletonProps) {
  return (
    <View style={styles.root} accessibilityLabel="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <HelpRequestCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  card: { backgroundColor: palette.white },
  cardRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.md },
  thumb: { width: 96, height: 96, borderRadius: radius.md },
  content: { flex: 1, gap: spacing.xs, justifyContent: 'center' },
  title: { height: 18, width: '90%' },
  badge: { height: 22, width: 72, borderRadius: radius.pill },
  support: { height: 18, width: '55%', marginTop: spacing.xs },
  place: { height: 14, width: '70%' },
  meta: { height: 12, width: '40%' },
});
