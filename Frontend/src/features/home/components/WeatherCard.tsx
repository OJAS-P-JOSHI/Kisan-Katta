import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Divider, Text } from 'react-native-paper';

import { elevation, radius, spacing, useAppTheme } from '@/theme';
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
        <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
        {value}
      </Text>
      <Text
        variant="labelSmall"
        style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
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
    gap: 4,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
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
    <Card mode="elevated" style={[styles.card, elevation.card]}>
      <View style={[styles.heroBand, { backgroundColor: theme.colors.primaryContainer }]}>
        <View style={styles.topRow}>
          <View style={styles.iconBlock}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons
                name={getWeatherIcon(weather.condition)}
                size={56}
                color={theme.colors.primary}
              />
            </View>
            <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer, marginTop: spacing.sm }}>
              {weather.condition}
            </Text>
          </View>
          <View style={styles.tempBlock}>
            <Text style={[styles.tempText, { color: theme.colors.onPrimaryContainer }]}>
              {Math.round(weather.temperatureC)}°
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.85 }}>
              Feels {Math.round(weather.feelsLikeC)}°C
            </Text>
          </View>
        </View>
      </View>

      <Card.Content style={styles.body}>
        <View style={styles.windRow}>
          <MaterialCommunityIcons name="compass-outline" size={16} color={theme.colors.primary} />
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Wind direction: {weather.windDirection}
          </Text>
        </View>

        {todayRainChance !== undefined && (
          <View style={[styles.farmerMsg, { backgroundColor: theme.colors.secondaryContainer }]}>
            <MaterialCommunityIcons name="water-outline" size={18} color={theme.colors.secondary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer, flex: 1 }}>
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
          <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.onSurfaceVariant} />
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
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
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  heroBand: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBlock: { alignItems: 'flex-start', flex: 1 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempBlock: { alignItems: 'flex-end' },
  tempText: { fontSize: 56, fontWeight: '600', lineHeight: 60, letterSpacing: -1 },
  body: { paddingTop: spacing.md, paddingBottom: spacing.lg },
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
