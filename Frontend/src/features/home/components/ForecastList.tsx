import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { spacing, useAppTheme } from '@/theme';

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
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
        7-Day Forecast
      </Text>

      {isInitialLoading && <ForecastSkeleton />}

      {hasError && (
        <View style={styles.errorRow}>
          <Text variant="bodySmall" style={{ color: theme.colors.error, flex: 1 }}>
            {error}
          </Text>
          <Button compact mode="text" onPress={onRetry}>
            Retry
          </Button>
        </View>
      )}

      {!isInitialLoading && !hasError && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {days.map((day, index) => (
            <ForecastCard key={day.date} day={day} isToday={index === 0} />
          ))}
        </ScrollView>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  title: {
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  scrollContent: { paddingHorizontal: spacing.md, gap: spacing.sm },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
});
