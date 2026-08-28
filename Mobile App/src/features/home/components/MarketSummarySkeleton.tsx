import { memo, useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { palette, radius, spacing } from '@/theme';

import { homeSurfaces } from '../home.theme';

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

export function MarketSummarySkeleton() {
  return (
    <View style={[styles.cardBody, homeSurfaces.marketHero]}>
      <View style={homeSurfaces.marketAccentBar} />
      <View style={styles.rows}>
        <SkeletonBox style={styles.row} />
        <SkeletonBox style={styles.row} />
        <SkeletonBox style={styles.rowShort} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardBody: {
    overflow: 'hidden',
  },
  rows: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: { height: 56, width: '100%', borderRadius: radius.md },
  rowShort: { height: 56, width: '85%', borderRadius: radius.md },
});
