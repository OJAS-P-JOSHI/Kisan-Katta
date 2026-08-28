import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { strings } from '@/constants';
import { iconSize, palette, radius, spacing, useAppTheme } from '@/theme';

import { homeColors } from '../home.theme';
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
          ? styles.itemToday
          : styles.itemDefault,
      ]}
    >
      {isToday ? <View style={[styles.todayMarker, { backgroundColor: theme.colors.primary }]} /> : null}
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

      <MaterialCommunityIcons
        name={getWeatherIcon(day.condition)}
        size={isToday ? iconSize.md : iconSize.sm}
        color={isToday ? theme.colors.primary : homeColors.inkMuted}
      />

      <Text style={[styles.maxTemp, isToday && styles.maxTempToday]}>
        {Math.round(day.maxTempC)}°
      </Text>
      <Text style={[styles.minTemp, { color: theme.colors.onSurfaceVariant }]}>
        {Math.round(day.minTempC)}°
      </Text>

      <View style={styles.rainRow}>
        <MaterialCommunityIcons name="water-outline" size={10} color={theme.colors.primary} />
        <Text style={[styles.rainText, { color: theme.colors.onSurfaceVariant }]}>
          {day.dailyChanceOfRain}%
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  item: {
    width: 68,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: homeColors.divider,
    backgroundColor: palette.white,
    overflow: 'hidden',
  },
  itemToday: {
    borderColor: 'rgba(46, 125, 50, 0.2)',
    backgroundColor: homeColors.heroAccentSoft,
  },
  itemDefault: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  todayMarker: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  dayLabel: {
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.15,
  },
  maxTemp: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
    color: palette.green900,
    letterSpacing: -0.2,
  },
  maxTempToday: {
    fontSize: 16,
  },
  minTemp: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    marginTop: -2,
  },
  rainRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 1 },
  rainText: { fontSize: 9, lineHeight: 11, fontWeight: '600' },
});
