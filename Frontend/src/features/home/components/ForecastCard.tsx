import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { iconSize, palette, radius, spacing, typography, useAppTheme } from '@/theme';

import type { ForecastDay } from '../weather.types';
import { formatDayShort, getWeatherIcon } from '../weather.utils';

type ForecastCardProps = {
  day: ForecastDay;
  isToday: boolean;
};

export const ForecastCard = memo(function ForecastCard({ day, isToday }: ForecastCardProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.item,
        isToday
          ? { backgroundColor: theme.colors.primaryContainer }
          : { backgroundColor: theme.colors.surfaceVariant },
      ]}
    >
      <Text
        style={[
          typography.caption,
          {
            color: isToday ? theme.colors.primary : theme.colors.onSurfaceVariant,
            fontWeight: isToday ? '600' : '500',
          },
        ]}
      >
        {isToday ? 'Today' : formatDayShort(day.date)}
      </Text>

      <View style={[styles.iconWrap, { backgroundColor: theme.colors.surface }]}>
        <MaterialCommunityIcons
          name={getWeatherIcon(day.condition)}
          size={iconSize.lg}
          color={theme.colors.primary}
        />
      </View>

      <Text style={[typography.sectionTitle, { color: palette.amber700, fontSize: 15 }]}>
        {Math.round(day.maxTempC)}°
      </Text>

      <Text style={[typography.body, { color: theme.colors.onSurfaceVariant, fontSize: 14 }]}>
        {Math.round(day.minTempC)}°
      </Text>

      <View style={styles.rainRow}>
        <MaterialCommunityIcons name="water-outline" size={iconSize.xs} color={theme.colors.primary} />
        <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
          {day.dailyChanceOfRain}%
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  item: {
    width: 74,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  rainRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
});
