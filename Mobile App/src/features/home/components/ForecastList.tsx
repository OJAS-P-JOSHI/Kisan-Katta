import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { iconSize, spacing, typography, radius, useAppTheme } from '@/theme';

import { homeColors, homeRhythm, homeSpacing, homeText } from '../home.theme';

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
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: homeColors.utilityMuted }]}>
            <MaterialCommunityIcons name="calendar-week" size={iconSize.sm} color={theme.colors.primary} />
          </View>
          <View style={styles.titleText}>
            <Text style={[homeText.sectionUtility, { color: theme.colors.onBackground }]}>
              {strings.home.forecast.title}
            </Text>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant, fontSize: 11 }]} numberOfLines={2}>
              {strings.home.forecast.subtitle}
            </Text>
          </View>
        </View>
      </View>

      {isInitialLoading && <ForecastSkeleton />}

      {hasError && (
        <View style={[styles.errorCard, { marginHorizontal: homeSpacing.horizontal }]}>
          <Text style={[typography.body, { color: theme.colors.error, flex: 1, fontSize: 13 }]}>
            {error}
          </Text>
          <Button compact mode="text" onPress={onRetry}>
            {strings.home.retry}
          </Button>
        </View>
      )}

      {!isInitialLoading && !hasError && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scroll}
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
  container: {
    gap: homeRhythm.utility,
  },
  titleBlock: {
    paddingHorizontal: homeSpacing.horizontal,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  scroll: {
    marginHorizontal: homeSpacing.horizontal,
  },
  scrollContent: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
    gap: spacing.sm,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: homeColors.utilityMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: homeColors.divider,
  },
});
