import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { iconSize, palette, radius, spacing, typography, useAppTheme } from '@/theme';
import type { AppTheme } from '@/theme';

import { homeColors, homeText } from '../home.theme';
import type { CurrentWeather } from '../weather.types';
import { translateCondition, translateWindDirection } from '../weather.localization';
import { formatUpdatedTime, getWeatherIcon } from '../weather.utils';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type StatItemProps = { icon: IconName; value: string; label: string; theme: AppTheme };

const StatItem = memo(function StatItem({ icon, value, label, theme }: StatItemProps) {
  return (
    <View style={stat.item}>
      <MaterialCommunityIcons name={icon} size={12} color={theme.colors.onSurfaceVariant} />
      <Text style={stat.value}>{value}</Text>
      <Text style={[stat.label, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
});

const stat = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: 2,
    minHeight: 58,
  },
  value: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    color: palette.slate,
    letterSpacing: -0.1,
  },
  label: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

type WeatherCardProps = {
  weather: CurrentWeather;
  todayRainChance?: number;
  farmingAdvice?: string;
  locationLabel?: string;
};

export const WeatherCard = memo(function WeatherCard({
  weather,
  todayRainChance,
  farmingAdvice,
  locationLabel,
}: WeatherCardProps) {
  const theme = useAppTheme();
  const { weather: w } = strings.home;

  return (
    <View style={styles.root}>
      <View style={styles.primaryRow}>
        <View style={styles.tempCol}>
          <Text style={[homeText.tempDisplay, { color: homeColors.heroAccent }]}>
            {Math.round(weather.temperatureC)}°
          </Text>
          {locationLabel ? (
            <Text
              style={[homeText.marathiCaption, styles.location, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={2}
            >
              {locationLabel}
            </Text>
          ) : null}
        </View>

        <View style={styles.conditionCol}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons
              name={getWeatherIcon(weather.condition)}
              size={40}
              color={theme.colors.primary}
            />
          </View>
          <Text style={[styles.condition, { color: theme.colors.onSurface }]} numberOfLines={2}>
            {translateCondition(weather.condition)}
          </Text>
        </View>
      </View>

      {(todayRainChance !== undefined || farmingAdvice) && (
        <View style={styles.secondaryBlock}>
          {todayRainChance !== undefined ? (
            <View style={[styles.rainChip, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons name="water-outline" size={14} color={theme.colors.primary} />
              <Text style={[styles.rainText, { color: theme.colors.primary }]}>
                {todayRainChance}%
              </Text>
            </View>
          ) : null}
          {farmingAdvice ? (
            <View style={[styles.adviceRow, { backgroundColor: palette.green50 }]}>
              <MaterialCommunityIcons name="sprout" size={iconSize.xs} color={theme.colors.primary} />
              <Text
                style={[homeText.marathiBody, typography.caption, { color: theme.colors.onSurface, flex: 1, fontSize: 13 }]}
                numberOfLines={3}
              >
                {farmingAdvice}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      <Text style={[styles.updated, { color: theme.colors.onSurfaceVariant }]}>
        {w.updated} {formatUpdatedTime(weather.lastUpdated)}
      </Text>

      <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatItem icon="water-percent" value={`${weather.humidity}%`} label={w.humidity} theme={theme} />
          <StatItem
            icon="weather-windy"
            value={`${Math.round(weather.windKph)}`}
            label={w.windSpeed}
            theme={theme}
          />
          <StatItem icon="cloud-outline" value={`${weather.cloud}%`} label={w.cloudCover} theme={theme} />
        </View>
        <View style={styles.statsRow}>
          <StatItem
            icon="water"
            value={`${weather.precipitationMm.toFixed(1)}`}
            label={w.rainfallToday}
            theme={theme}
          />
          <StatItem icon="white-balance-sunny" value={`${Math.round(weather.uv)}`} label={w.uvIndex} theme={theme} />
          <StatItem
            icon="thermometer"
            value={`${Math.round(weather.feelsLikeC)}°`}
            label={w.feelsLike}
            theme={theme}
          />
        </View>
      </View>

      <Text
        style={[typography.caption, homeText.marathiCaption, styles.windNote, { color: theme.colors.onSurfaceVariant }]}
        numberOfLines={1}
      >
        {w.windDirection}: {translateWindDirection(weather.windDirection)}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  tempCol: {
    flex: 1,
    minWidth: 0,
  },
  location: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500',
  },
  conditionCol: {
    alignItems: 'flex-end',
    maxWidth: '46%',
    gap: spacing.xs,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  condition: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    textAlign: 'right',
  },
  secondaryBlock: {
    gap: spacing.sm,
  },
  rainChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  rainText: {
    fontSize: 13,
    fontWeight: '700',
  },
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  updated: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'right',
  },
  divider: { marginVertical: 2 },
  statsGrid: {
    backgroundColor: palette.sand,
    borderRadius: radius.lg,
    paddingVertical: spacing.xs,
    gap: 2,
  },
  statsRow: { flexDirection: 'row' },
  windNote: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.85,
  },
});
