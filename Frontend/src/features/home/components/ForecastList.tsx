import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

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
      <View style={styles.titleRow}>
        <View style={[styles.titleIcon, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons name="calendar-week" size={iconSize.sm} color={theme.colors.primary} />
        </View>
        <View>
          <Text style={[typography.sectionTitle, { color: theme.colors.onBackground }]}>
            7-Day Forecast
          </Text>
          <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
            Daily outlook for your district
          </Text>
        </View>
      </View>

      {isInitialLoading && <ForecastSkeleton />}

      {hasError && (
        <Card mode="elevated" style={[styles.errorCard, cardSurface]}>
          <Card.Content style={styles.errorRow}>
            <Text style={[typography.body, { color: theme.colors.error, flex: 1 }]}>
              {error}
            </Text>
            <Button compact mode="text" onPress={onRetry}>
              Retry
            </Button>
          </Card.Content>
        </Card>
      )}

      {!isInitialLoading && !hasError && (
        <Card mode="elevated" style={[styles.forecastCard, cardSurface]}>
          <Card.Content style={styles.forecastContent}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {days.map((day, index) => (
                <ForecastCard key={day.date} day={day} isToday={index === 0} />
              ))}
            </ScrollView>
          </Card.Content>
        </Card>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  titleIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastCard: {
    marginHorizontal: spacing.md,
  },
  forecastContent: { paddingVertical: spacing.sm, paddingHorizontal: 0 },
  scrollContent: { paddingHorizontal: spacing.sm, gap: spacing.sm },
  errorCard: { marginHorizontal: spacing.md },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
