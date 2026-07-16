import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { palette } from '@/theme';

/**
 * Subtle leaf accents reusing the Login screen’s View-based leaf language.
 * Opacity stays at or below 5% so leaves act as watermarks, not decorations.
 *
 * Use sparingly: greeting headers, hero corners, empty states, profile header.
 */
export type BrandLeavesVariant =
  | 'greeting'
  | 'corner'
  | 'hero'
  | 'empty'
  | 'profile'
  | 'weather';

type BrandLeavesProps = {
  variant?: BrandLeavesVariant;
  style?: StyleProp<ViewStyle>;
};

export const BrandLeaves = memo(function BrandLeaves({
  variant = 'corner',
  style,
}: BrandLeavesProps) {
  return (
    <View pointerEvents="none" style={[styles.root, style]}>
      {variant === 'greeting' ? <GreetingLeaves /> : null}
      {variant === 'corner' || variant === 'hero' ? <CornerLeaves dense={variant === 'hero'} /> : null}
      {variant === 'empty' ? <EmptyLeaves /> : null}
      {variant === 'profile' ? <ProfileLeaves /> : null}
      {variant === 'weather' ? <WeatherLeaves /> : null}
    </View>
  );
});

function GreetingLeaves() {
  return (
    <>
      <View style={styles.greetingCluster}>
        <View style={[styles.blade, styles.gBlade1, { backgroundColor: palette.green500 }]} />
        <View style={[styles.blade, styles.gBlade2, { backgroundColor: palette.green700 }]} />
        <View style={[styles.blade, styles.gBlade3, { backgroundColor: palette.green100 }]} />
      </View>
      <View style={styles.greetingClusterRight}>
        <View style={[styles.blade, styles.gBladeR1, { backgroundColor: palette.green500 }]} />
        <View style={[styles.blade, styles.gBladeR2, { backgroundColor: palette.green100 }]} />
      </View>
    </>
  );
}

function CornerLeaves({ dense }: { dense?: boolean }) {
  return (
    <View style={[styles.cornerWrap, dense && styles.cornerDense]}>
      <View style={[styles.blade, styles.cBlade1, { backgroundColor: palette.green500 }]} />
      <View style={[styles.blade, styles.cBlade2, { backgroundColor: palette.green700 }]} />
      {dense ? (
        <View style={[styles.blade, styles.cBlade3, { backgroundColor: palette.green100 }]} />
      ) : null}
    </View>
  );
}

function EmptyLeaves() {
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.blade, styles.eBlade1, { backgroundColor: palette.green500 }]} />
      <View style={[styles.blade, styles.eBlade2, { backgroundColor: palette.green700 }]} />
      <View style={[styles.blade, styles.eBlade3, { backgroundColor: palette.green100 }]} />
    </View>
  );
}

function ProfileLeaves() {
  return (
    <View style={styles.profileWrap}>
      <View style={[styles.blade, styles.pBlade1, { backgroundColor: palette.green500 }]} />
      <View style={[styles.blade, styles.pBlade2, { backgroundColor: palette.green700 }]} />
      <View style={[styles.blade, styles.pBlade3, { backgroundColor: palette.green100 }]} />
      <View style={[styles.blade, styles.pBlade4, { backgroundColor: palette.green500 }]} />
    </View>
  );
}

function WeatherLeaves() {
  return (
    <View style={styles.weatherWrap}>
      <View style={[styles.blade, styles.wBlade1, { backgroundColor: palette.green700 }]} />
      <View style={[styles.blade, styles.wBlade2, { backgroundColor: palette.green500 }]} />
    </View>
  );
}

const LEAF_OPACITY = 0.05;

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  blade: {
    position: 'absolute',
    borderRadius: 999,
    opacity: LEAF_OPACITY,
  },

  // Greeting — faint backdrop behind the header card
  greetingCluster: {
    position: 'absolute',
    top: -8,
    right: 4,
    width: 90,
    height: 90,
  },
  gBlade1: {
    width: 44,
    height: 16,
    top: 18,
    right: 8,
    transform: [{ rotate: '-28deg' }],
  },
  gBlade2: {
    width: 36,
    height: 14,
    top: 34,
    right: 22,
    transform: [{ rotate: '12deg' }],
  },
  gBlade3: {
    width: 28,
    height: 11,
    top: 48,
    right: 6,
    transform: [{ rotate: '-48deg' }],
  },
  greetingClusterRight: {
    position: 'absolute',
    bottom: -4,
    left: 8,
    width: 70,
    height: 60,
  },
  gBladeR1: {
    width: 34,
    height: 13,
    top: 10,
    left: 4,
    transform: [{ rotate: '22deg' }],
  },
  gBladeR2: {
    width: 26,
    height: 10,
    top: 28,
    left: 18,
    transform: [{ rotate: '-18deg' }],
  },

  // Corner / hero — top-right accent on cards
  cornerWrap: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 72,
    height: 72,
  },
  cornerDense: {
    width: 96,
    height: 96,
  },
  cBlade1: {
    width: 40,
    height: 14,
    top: 12,
    right: 6,
    transform: [{ rotate: '-32deg' }],
  },
  cBlade2: {
    width: 30,
    height: 12,
    top: 28,
    right: 18,
    transform: [{ rotate: '8deg' }],
  },
  cBlade3: {
    width: 24,
    height: 10,
    top: 42,
    right: 4,
    transform: [{ rotate: '-50deg' }],
  },

  // Empty state — centered soft cluster
  emptyWrap: {
    position: 'absolute',
    alignSelf: 'center',
    top: '28%',
    left: '50%',
    marginLeft: -48,
    width: 96,
    height: 96,
  },
  eBlade1: {
    width: 52,
    height: 18,
    top: 22,
    left: 10,
    transform: [{ rotate: '-24deg' }],
    opacity: 0.05,
  },
  eBlade2: {
    width: 40,
    height: 15,
    top: 40,
    left: 28,
    transform: [{ rotate: '18deg' }],
    opacity: 0.045,
  },
  eBlade3: {
    width: 32,
    height: 12,
    top: 54,
    left: 8,
    transform: [{ rotate: '-40deg' }],
    opacity: 0.04,
  },

  // Profile — soft ring behind avatar
  profileWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -70,
    marginLeft: -70,
    width: 140,
    height: 140,
  },
  pBlade1: {
    width: 48,
    height: 16,
    top: 20,
    left: 46,
    transform: [{ rotate: '-20deg' }],
  },
  pBlade2: {
    width: 42,
    height: 14,
    top: 58,
    left: 8,
    transform: [{ rotate: '55deg' }],
  },
  pBlade3: {
    width: 38,
    height: 13,
    top: 58,
    right: 8,
    transform: [{ rotate: '-55deg' }],
  },
  pBlade4: {
    width: 36,
    height: 12,
    bottom: 18,
    left: 52,
    transform: [{ rotate: '12deg' }],
  },

  // Weather — very subtle top-right wash
  weatherWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 80,
  },
  wBlade1: {
    width: 46,
    height: 15,
    top: 14,
    right: 10,
    transform: [{ rotate: '-30deg' }],
    opacity: 0.04,
  },
  wBlade2: {
    width: 32,
    height: 12,
    top: 34,
    right: 28,
    transform: [{ rotate: '10deg' }],
    opacity: 0.035,
  },
});
