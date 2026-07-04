import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { palette, radius, spacing, useAppTheme } from '@/theme';

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
        variant="labelLarge"
        style={{
          color: isToday ? theme.colors.primary : theme.colors.onSurfaceVariant,
          fontWeight: isToday ? '600' : '500',
        }}
      >
        {isToday ? 'Today' : formatDayShort(day.date)}
      </Text>

      <View style={[styles.iconWrap, { backgroundColor: theme.colors.surface }]}>
        <MaterialCommunityIcons
          name={getWeatherIcon(day.condition)}
          size={28}
          color={theme.colors.primary}
        />
      </View>

      <Text variant="titleSmall" style={{ color: palette.amber700, fontWeight: '600' }}>
        {Math.round(day.maxTempC)}°
      </Text>

      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {Math.round(day.minTempC)}°
      </Text>

      <View style={styles.rainRow}>
        <MaterialCommunityIcons name="water-outline" size={13} color={theme.colors.primary} />
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {day.dailyChanceOfRain}%
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  item: {
    width: 76,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  rainRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
});
