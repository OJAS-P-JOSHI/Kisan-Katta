import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Divider, Text } from 'react-native-paper';

import { BrandLeaves } from '@/components/BrandLeaves';
import { strings } from '@/constants';
import { cardSurface, iconSize, palette, radius, spacing, typography, useAppTheme } from '@/theme';
import type { AppTheme } from '@/theme';

import type { CurrentWeather } from '../weather.types';
import { translateCondition, translateWindDirection } from '../weather.localization';
import { formatUpdatedTime, getWeatherIcon } from '../weather.utils';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type StatItemProps = { icon: IconName; value: string; label: string; theme: AppTheme };

const StatItem = memo(function StatItem({ icon, value, label, theme }: StatItemProps) {
  return (
    <View style={[stat.item, { backgroundColor: palette.green50 }]}>
      <View style={[stat.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialCommunityIcons name={icon} size={iconSize.sm} color={theme.colors.primary} />
      </View>
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
    gap: 6,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    minHeight: 96,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: palette.green900,
    letterSpacing: -0.2,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

type WeatherCardProps = {
  weather: CurrentWeather;
  todayRainChance?: number;
  farmingAdvice?: string;
};

export const WeatherCard = memo(function WeatherCard({
  weather,
  farmingAdvice,
}: WeatherCardProps) {
  const theme = useAppTheme();
  const { weather: w } = strings.home;

  return (
    <Card mode="elevated" style={[styles.card, cardSurface]}>
      <View style={[styles.heroBand, { backgroundColor: theme.colors.primaryContainer }]}>
        <View style={styles.heroWash} />
        <BrandLeaves variant="weather" />
        <View style={styles.topRow}>
          <View style={styles.iconBlock}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons
                name={getWeatherIcon(weather.condition)}
                size={56}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.condition} numberOfLines={2}>
              {translateCondition(weather.condition)}
            </Text>
          </View>
          <View style={styles.tempBlock}>
            <Text style={styles.tempText}>{Math.round(weather.temperatureC)}°</Text>
            <Text style={styles.feelsLike} numberOfLines={2}>
              {w.feelsLikeShort} {Math.round(weather.feelsLikeC)}°C
            </Text>
          </View>
        </View>
      </View>

      <Card.Content style={styles.body}>
        <View style={styles.windRow}>
          <View style={[styles.windIcon, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="compass-outline" size={iconSize.sm} color={theme.colors.primary} />
          </View>
          <Text
            style={[typography.caption, { color: theme.colors.onSurfaceVariant, fontWeight: '500', flex: 1 }]}
            numberOfLines={2}
          >
            {w.windDirection}: {translateWindDirection(weather.windDirection)}
          </Text>
        </View>

        {farmingAdvice ? (
          <View style={[styles.farmerMsg, { backgroundColor: theme.colors.secondaryContainer }]}>
            <MaterialCommunityIcons name="water-outline" size={iconSize.sm} color={theme.colors.secondary} />
            <Text style={[typography.body, { color: theme.colors.onSecondaryContainer, flex: 1 }]}>
              {farmingAdvice}
            </Text>
          </View>
        ) : null}

        <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

        <View style={styles.statsRow}>
          <StatItem icon="water-percent" value={`${weather.humidity}%`} label={w.humidity} theme={theme} />
          <StatItem
            icon="weather-windy"
            value={`${Math.round(weather.windKph)} km/h`}
            label={w.windSpeed}
            theme={theme}
          />
          <StatItem icon="cloud-outline" value={`${weather.cloud}%`} label={w.cloudCover} theme={theme} />
        </View>

        <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
          <StatItem
            icon="water"
            value={`${weather.precipitationMm.toFixed(1)} mm`}
            label={w.rainfallToday}
            theme={theme}
          />
          <StatItem
            icon="white-balance-sunny"
            value={`UV ${Math.round(weather.uv)}`}
            label={w.uvIndex}
            theme={theme}
          />
          <StatItem
            icon="thermometer"
            value={`${Math.round(weather.feelsLikeC)}°C`}
            label={w.feelsLike}
            theme={theme}
          />
        </View>

        <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

        <View style={styles.footerRow}>
          <MaterialCommunityIcons name="clock-outline" size={iconSize.xs} color={theme.colors.onSurfaceVariant} />
          <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
            {w.updated} {formatUpdatedTime(weather.lastUpdated)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  heroBand: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg + 4,
    paddingBottom: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  heroWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  iconBlock: { alignItems: 'flex-start', flex: 1, minWidth: 0 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  condition: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: palette.green900,
  },
  tempBlock: { alignItems: 'flex-end', maxWidth: '46%' },
  tempText: {
    fontSize: 64,
    fontWeight: '700',
    lineHeight: 68,
    letterSpacing: -1.8,
    color: palette.green900,
  },
  feelsLike: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: palette.green900,
    opacity: 0.75,
    textAlign: 'right',
  },
  body: { paddingTop: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  windRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  windIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerMsg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  divider: { marginVertical: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
});
