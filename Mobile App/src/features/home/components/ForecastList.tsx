import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { spacing, typography, useAppTheme } from '@/theme';

import { homeRhythm, homeSurfaces, homeSpacing, homeText } from '../home.theme';

import type { ForecastDay } from '../weather.types';
import { ForecastCard } from './ForecastCard';
import { ForecastSkeleton } from './WeatherSkeleton';

type ForecastListProps = {
  days: ForecastDay[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export const ForecastList = memo(function ForecastList({
  days,
  loading,
  error,
  onRetry,
}: ForecastListProps) {
  const theme = useAppTheme();
  const isInitialLoading = loading && days.length === 0;
  const hasError = error !== null && days.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.titleBlock}>
        <Text style={[homeText.sectionUtility, { color: theme.colors.onBackground }]}>
          {strings.home.forecast.title}
        </Text>
        <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
          {strings.home.forecast.subtitle}
        </Text>
      </View>

      {isInitialLoading && <ForecastSkeleton />}

      {hasError && (
        <View style={[styles.errorCard, homeSurfaces.utility, { marginHorizontal: homeSpacing.horizontal }]}>
          <Text style={[typography.body, { color: theme.colors.error, flex: 1 }]}>
            {error}
          </Text>
          <Button compact mode="text" onPress={onRetry}>
            {strings.home.retry}
          </Button>
        </View>
      )}

      {!isInitialLoading && !hasError && (
        <View style={[styles.forecastCard, homeSurfaces.utility, { marginHorizontal: homeSpacing.horizontal }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {days.map((day, index) => (
              <ForecastCard key={day.date} day={day} isToday={index === 0} />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: homeRhythm.utility,
  },
  titleBlock: {
    paddingHorizontal: homeSpacing.horizontal,
    gap: 4,
  },
  forecastCard: {
    paddingVertical: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
});
