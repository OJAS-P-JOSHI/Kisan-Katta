import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Divider, Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '@/theme';
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
    <View style={stat.item}>
      <MaterialCommunityIcons name={icon} size={20} color={theme.colors.primary} />
      <Text variant="labelLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
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
  item: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: spacing.xs },
});

type WeatherCardProps = {
  weather: CurrentWeather;
  todayRainChance?: number;
};

export const WeatherCard = memo(function WeatherCard({ weather, todayRainChance }: WeatherCardProps) {
  const theme = useAppTheme();

  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Content>
        {/* Icon + temperature row */}
        <View style={styles.topRow}>
          <View style={styles.iconBlock}>
            <MaterialCommunityIcons
              name={getWeatherIcon(weather.condition)}
              size={72}
              color={theme.colors.primary}
            />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {weather.condition}
            </Text>
          </View>
          <View style={styles.tempBlock}>
            <Text style={[styles.tempText, { color: theme.colors.onSurface }]}>
              {Math.round(weather.temperatureC)}°
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Feels {Math.round(weather.feelsLikeC)}°C
            </Text>
          </View>
        </View>

        {/* Wind direction badge */}
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="compass-outline" size={14} color={theme.colors.onSurfaceVariant} />
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Wind: {weather.windDirection}
          </Text>
        </View>

        {/* Farmer-friendly rain advisory */}
        {todayRainChance !== undefined && (
          <View style={[styles.farmerMsg, { backgroundColor: theme.colors.secondaryContainer }]}>
            <MaterialCommunityIcons name="water" size={16} color={theme.colors.secondary} />
            <Text variant="labelMedium" style={{ color: theme.colors.onSecondaryContainer }}>
              {getRainMessage(todayRainChance)}
            </Text>
          </View>
        )}

        <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

        {/* Stats row 1 */}
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

        {/* Stats row 2 */}
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

        {/* Footer */}
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'right' }}>
          Updated: {formatUpdatedTime(weather.lastUpdated)}
        </Text>
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginBottom: spacing.md, borderRadius: radius.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBlock: { alignItems: 'flex-start', gap: spacing.xs },
  tempBlock: { alignItems: 'flex-end' },
  tempText: { fontSize: 64, fontWeight: '700', lineHeight: 72 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  farmerMsg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  divider: { marginVertical: spacing.sm },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
