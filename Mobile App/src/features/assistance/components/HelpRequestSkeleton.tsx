import { memo, useEffect, useState } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions, type ViewStyle } from 'react-native';

import { radius, spacing } from '@/theme';

import { assistanceStrings } from '../assistance.strings';
import { saath, saathCard, saathImageSize } from '../assistance.ui';

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
      style={[{ backgroundColor: saath.disabled, borderRadius: radius.md, opacity }, style]}
    />
  );
});

const HelpRequestCardSkeleton = memo(function HelpRequestCardSkeleton() {
  const { width } = useWindowDimensions();
  const imageSize = saathImageSize(width);

  return (
    <View style={saathCard}>
      <View style={styles.cardRow}>
        <SkeletonBox style={{ width: imageSize, height: imageSize, borderRadius: 16 }} />
        <View style={styles.content}>
          <SkeletonBox style={styles.badge} />
          <SkeletonBox style={styles.title} />
          <SkeletonBox style={styles.place} />
          <SkeletonBox style={styles.meta} />
          <SkeletonBox style={styles.support} />
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
    <View style={styles.root} accessibilityLabel={assistanceStrings.feed.loading}>
      {Array.from({ length: count }).map((_, index) => (
        <HelpRequestCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  cardRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.md },
  content: { flex: 1, gap: spacing.xs, justifyContent: 'center' },
  badge: { height: 22, width: 72, borderRadius: radius.pill },
  title: { height: 18, width: '90%' },
  place: { height: 14, width: '70%' },
  meta: { height: 12, width: '40%' },
  support: { height: 32, width: '100%', borderRadius: radius.pill, marginTop: spacing.xs },
});
