import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { strings } from '@/constants';
import { iconSize, palette, radius, spacing, useAppTheme } from '@/theme';

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
          ? { backgroundColor: theme.colors.primaryContainer, borderColor: palette.green100 }
          : { backgroundColor: palette.green50, borderColor: palette.mist },
      ]}
    >
      <Text
        style={[
          styles.dayLabel,
          {
            color: isToday ? theme.colors.primary : theme.colors.onSurfaceVariant,
            fontWeight: isToday ? '700' : '500',
          },
        ]}
      >
        {isToday ? strings.home.forecast.today : formatDayShort(day.date)}
      </Text>

      <View style={[styles.iconWrap, { backgroundColor: theme.colors.surface }]}>
        <MaterialCommunityIcons
          name={getWeatherIcon(day.condition)}
          size={iconSize.lg}
          color={theme.colors.primary}
        />
      </View>

      <Text style={styles.maxTemp}>{Math.round(day.maxTempC)}°</Text>
      <Text style={[styles.minTemp, { color: theme.colors.onSurfaceVariant }]}>
        {Math.round(day.minTempC)}°
      </Text>

      <View style={styles.rainRow}>
        <MaterialCommunityIcons name="water-outline" size={iconSize.xs} color={theme.colors.primary} />
        <Text style={[styles.rainText, { color: theme.colors.onSurfaceVariant }]}>
          {day.dailyChanceOfRain}%
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  item: {
    width: 84,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dayLabel: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  maxTemp: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: palette.green900,
    letterSpacing: -0.3,
  },
  minTemp: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
  },
  rainRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  rainText: { fontSize: 11, lineHeight: 14, fontWeight: '500' },
});
