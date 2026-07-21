import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { palette, useAppTheme } from '@/theme';

type OrganicBackgroundProps = {
  /** Slightly stronger wash for hero-forward screens like Home. */
  intensity?: 'subtle' | 'soft';
};

/**
 * Shared soft organic hill wash used across authenticated screens
 * so Home, Marketplace, Market, Profile, and Farmer Price feel connected.
 */
export const OrganicBackground = memo(function OrganicBackground({
  intensity = 'soft',
}: OrganicBackgroundProps) {
  const theme = useAppTheme();
  const primaryOpacity = intensity === 'subtle' ? 0.28 : 0.38;
  const mistOpacity = intensity === 'subtle' ? 0.35 : 0.45;

  return (
    <View style={styles.layer} pointerEvents="none">
      <View
        style={[
          styles.hillLarge,
          { backgroundColor: theme.colors.primaryContainer, opacity: primaryOpacity },
        ]}
      />
      <View style={[styles.hillSmall, { backgroundColor: palette.mist, opacity: mistOpacity }]} />
      <View style={[styles.accentOrb, { backgroundColor: palette.amber100 }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  hillLarge: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  hillSmall: {
    position: 'absolute',
    top: 100,
    left: -80,
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  accentOrb: {
    position: 'absolute',
    bottom: 160,
    right: -36,
    width: 96,
    height: 96,
    borderRadius: 48,
    opacity: 0.22,
  },
});
