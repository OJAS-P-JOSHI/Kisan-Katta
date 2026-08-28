import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { OrganicBackground } from '@/components/OrganicBackground';
import { palette } from '@/theme';

import { homeColors } from '../home.theme';

/**
 * Calmer Home-specific background — wraps OrganicBackground without changing behavior.
 */
export const HomeBackground = memo(function HomeBackground() {
  return (
    <>
      <OrganicBackground intensity="subtle" />
      <View style={styles.topFade} pointerEvents="none" />
      <View style={styles.bottomWash} pointerEvents="none" />
    </>
  );
});

const styles = StyleSheet.create({
  topFade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: homeColors.heroGradientTop,
    opacity: 0.35,
  },
  bottomWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    backgroundColor: palette.sand,
    opacity: 0.5,
  },
});
