import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Divider, Text } from 'react-native-paper';

import { BrandLeaves } from '@/components/BrandLeaves';
import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';
import type { AppTheme } from '@/theme';

import type { CurrentWeather } from '../weather.types';
import {
  formatUpdatedTime,
  getHumidityLabel,
  getRainMessage,
  getUVLabel,
  getWeatherIcon,
} from '../weather.utils';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type StatItemProps = { icon: IconName; value: string; label: string; theme: AppTheme };

const StatItem = memo(function StatItem({ icon, value, label, theme }: StatItemProps) {
  return (
    <View style={[stat.item, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={[stat.iconWrap, { backgroundColor: theme.colors.surface }]}>
        <MaterialCommunityIcons name={icon} size={iconSize.sm} color={theme.colors.primary} />
      </View>
      <Text style={[typography.sectionTitle, { color: theme.colors.onSurface, fontSize: 14 }]}>
        {value}
      </Text>
      <Text
        style={[typography.caption, { color: theme.colors.onSurfaceVariant, textAlign: 'center' }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
});

const stat = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

type WeatherCardProps = {
  weather: CurrentWeather;
  todayRainChance?: number;
};

export const WeatherCard = memo(function WeatherCard({ weather, todayRainChance }: WeatherCardProps) {
  const theme = useAppTheme();

  return (
    <Card mode="elevated" style={[styles.card, cardSurface]}>
      <View style={[styles.heroBand, { backgroundColor: theme.colors.primaryContainer }]}>
        <BrandLeaves variant="weather" />
        <View style={styles.topRow}>
          <View style={styles.iconBlock}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons
                name={getWeatherIcon(weather.condition)}
                size={48}
                color={theme.colors.primary}
              />
            </View>
            <Text
              style={[
                typography.sectionTitle,
                { color: theme.colors.onPrimaryContainer, marginTop: spacing.sm },
              ]}
            >
              {weather.condition}
            </Text>
          </View>
          <View style={styles.tempBlock}>
            <Text style={[styles.tempText, { color: theme.colors.onPrimaryContainer }]}>
              {Math.round(weather.temperatureC)}°
            </Text>
            <Text style={[typography.body, { color: theme.colors.onPrimaryContainer, opacity: 0.85 }]}>
              Feels {Math.round(weather.feelsLikeC)}°C
            </Text>
          </View>
        </View>
      </View>

      <Card.Content style={styles.body}>
        <View style={styles.windRow}>
          <MaterialCommunityIcons name="compass-outline" size={iconSize.sm} color={theme.colors.primary} />
          <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant, fontWeight: '500' }]}>
            Wind direction: {weather.windDirection}
          </Text>
        </View>

        {todayRainChance !== undefined && (
          <View style={[styles.farmerMsg, { backgroundColor: theme.colors.secondaryContainer }]}>
            <MaterialCommunityIcons name="water-outline" size={iconSize.sm} color={theme.colors.secondary} />
            <Text style={[typography.body, { color: theme.colors.onSecondaryContainer, flex: 1 }]}>
              {getRainMessage(todayRainChance)}
            </Text>
          </View>
        )}

        <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

        <View style={styles.statsRow}>
          <StatItem
            icon="water-percent"
            value={`${weather.humidity}%`}
            label={getHumidityLabel(weather.humidity)}
            theme={theme}
          />
          <StatItem
            icon="weather-windy"
            value={`${Math.round(weather.windKph)} km/h`}
            label="Wind speed"
            theme={theme}
          />
          <StatItem
            icon="cloud-outline"
            value={`${weather.cloud}%`}
            label="Cloud cover"
            theme={theme}
          />
        </View>

        <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
          <StatItem
            icon="water"
            value={`${weather.precipitationMm.toFixed(1)} mm`}
            label="Rainfall today"
            theme={theme}
          />
          <StatItem
            icon="white-balance-sunny"
            value={`UV ${Math.round(weather.uv)}`}
            label={getUVLabel(weather.uv)}
            theme={theme}
          />
          <StatItem
            icon="thermometer"
            value={`${Math.round(weather.feelsLikeC)}°C`}
            label="Feels like"
            theme={theme}
          />
        </View>

        <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

        <View style={styles.footerRow}>
          <MaterialCommunityIcons name="clock-outline" size={iconSize.xs} color={theme.colors.onSurfaceVariant} />
          <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
            Updated {formatUpdatedTime(weather.lastUpdated)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  heroBand: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBlock: { alignItems: 'flex-start', flex: 1 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempBlock: { alignItems: 'flex-end' },
  tempText: {
    fontSize: 58,
    fontWeight: '600',
    lineHeight: 62,
    letterSpacing: -1.5,
  },
  body: { paddingTop: spacing.md, paddingBottom: spacing.md },
  windRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  farmerMsg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  divider: { marginVertical: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
});
