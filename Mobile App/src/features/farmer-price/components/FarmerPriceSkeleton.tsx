import { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { elevation, palette, radius, spacing } from '@/theme';

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

export function FarmerPriceSkeleton() {
  return (
    <View style={styles.root} accessibilityLabel="Loading">
      <View style={[styles.card, elevation.soft]}>
        <SkeletonBox style={styles.title} />
        <SkeletonBox style={styles.subtitle} />
        <SkeletonBox style={styles.divider} />
        <View style={styles.metrics}>
          <SkeletonBox style={styles.metric} />
          <SkeletonBox style={styles.metric} />
        </View>
        <SkeletonBox style={styles.chips} />
        <SkeletonBox style={styles.progress} />
        <SkeletonBox style={styles.divider} />
        <SkeletonBox style={styles.input} />
        <SkeletonBox style={styles.button} />
        <SkeletonBox style={styles.comments} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  card: {
    backgroundColor: palette.white,
    borderRadius: 18,
    padding: spacing.md,
    gap: 12,
  },
  title: { height: 28, width: '65%' },
  subtitle: { height: 14, width: '40%' },
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  metric: { flex: 1, height: 52, borderRadius: radius.md },
  chips: { height: 28, width: '85%', borderRadius: radius.pill },
  progress: { height: 3, width: '100%', borderRadius: radius.pill },
  input: { height: 48, width: '100%', borderRadius: radius.lg },
  button: { height: 48, width: '100%', borderRadius: radius.lg },
  comments: { height: 20, width: '55%' },
});
