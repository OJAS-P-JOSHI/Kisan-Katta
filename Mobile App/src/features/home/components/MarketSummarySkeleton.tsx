import { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { Card } from 'react-native-paper';

import { cardSurface, palette, radius, spacing } from '@/theme';

const SkeletonBox = memo(function SkeletonBox({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

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

/** Skeleton for Home market summary — mirrors existing weather skeleton behaviour. */
export function MarketSummarySkeleton() {
  return (
    <Card mode="elevated" style={[styles.card, cardSurface]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <SkeletonBox style={styles.icon} />
          <View style={styles.titleBlock}>
            <SkeletonBox style={styles.title} />
            <SkeletonBox style={styles.subtitle} />
          </View>
        </View>
        <SkeletonBox style={styles.divider} />
        <SkeletonBox style={styles.row} />
        <SkeletonBox style={styles.row} />
        <SkeletonBox style={styles.rowShort} />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  content: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: radius.md },
  titleBlock: { flex: 1, gap: 6 },
  title: { height: 16, width: '62%' },
  subtitle: { height: 12, width: '40%' },
  divider: { height: 1, marginVertical: spacing.xs },
  row: { height: 18, width: '100%' },
  rowShort: { height: 18, width: '72%' },
});
