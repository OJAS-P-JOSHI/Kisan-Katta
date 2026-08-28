import { memo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { homeRhythm } from '../home.theme';

type WeatherSectionProps = {
  children: ReactNode;
};

/** Weather zone inside the hero shell — no redundant section chrome. */
export const WeatherSection = memo(function WeatherSection({ children }: WeatherSectionProps) {
  return <View style={styles.zone}>{children}</View>;
});

const styles = StyleSheet.create({
  zone: {
    gap: homeRhythm.heroInner,
    paddingHorizontal: spacing.lg,
  },
});
