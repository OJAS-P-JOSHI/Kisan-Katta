import { memo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandLeaves } from '@/components/BrandLeaves';
import { radius, spacing } from '@/theme';

import { homeColors, homeRhythm, homeSurfaces } from '../home.theme';

type HomeHeroShellProps = {
  children: ReactNode;
};

/** Unified hero composition for header + weather — visual grouping only. */
export const HomeHeroShell = memo(function HomeHeroShell({ children }: HomeHeroShellProps) {
  return (
    <View style={homeSurfaces.heroShell}>
      <View style={styles.washTop} pointerEvents="none" />
      <View style={styles.washMid} pointerEvents="none" />
      <BrandLeaves variant="greeting" />
      <View style={styles.inner}>{children}</View>
    </View>
  );
});

const styles = StyleSheet.create({
  washTop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: homeColors.heroGradientMid,
    opacity: 0.5,
  },
  washMid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    backgroundColor: homeColors.heroGradientTop,
    opacity: 0.85,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
  },
  inner: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: homeRhythm.heroInner,
  },
});
