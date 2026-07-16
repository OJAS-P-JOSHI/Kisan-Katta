import { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { Card } from 'react-native-paper';

import { cardSurface, palette, radius, spacing } from '@/theme';

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
      <Card mode="elevated" style={[styles.card, cardSurface]}>
        <Card.Content style={styles.content}>
          <SkeletonBox style={styles.title} />
          <SkeletonBox style={styles.subtitle} />
          <SkeletonBox style={styles.divider} />
          <SkeletonBox style={styles.priceRow} />
          <SkeletonBox style={styles.priceRow} />
          <SkeletonBox style={styles.progress} />
        </Card.Content>
      </Card>

      <Card mode="elevated" style={[styles.card, cardSurface]}>
        <Card.Content style={styles.content}>
          <SkeletonBox style={styles.title} />
          <SkeletonBox style={styles.input} />
          <SkeletonBox style={styles.button} />
        </Card.Content>
      </Card>

      <Card mode="elevated" style={[styles.card, cardSurface]}>
        <Card.Content style={styles.content}>
          <SkeletonBox style={styles.title} />
          <SkeletonBox style={styles.insight} />
          <SkeletonBox style={styles.insight} />
          <SkeletonBox style={styles.insight} />
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  card: { backgroundColor: palette.white },
  content: { gap: spacing.md, paddingVertical: spacing.sm },
  title: { height: 28, width: '70%' },
  subtitle: { height: 16, width: '45%' },
  divider: { height: 1, width: '100%', marginVertical: spacing.xs },
  priceRow: { height: 56, width: '100%' },
  progress: { height: 8, width: '100%' },
  input: { height: 56, width: '100%' },
  button: { height: 48, width: '100%' },
  insight: { height: 64, width: '100%' },
});
