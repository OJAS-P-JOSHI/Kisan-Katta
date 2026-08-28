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
      <View style={styles.baseWash} pointerEvents="none" />
      <View style={styles.topFade} pointerEvents="none" />
    </>
  );
});

const styles = StyleSheet.create({
  baseWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.sand,
    opacity: 0.22,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: homeColors.heroGradientTop,
    opacity: 0.55,
  },
});
