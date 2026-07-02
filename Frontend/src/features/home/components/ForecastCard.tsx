import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

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
    <Card mode="elevated" style={styles.card}>
      <Card.Content style={styles.content}>
        <Text
          variant="labelMedium"
          style={{
            color: isToday ? theme.colors.primary : theme.colors.onSurfaceVariant,
            fontWeight: isToday ? '700' : '400',
          }}
        >
          {isToday ? 'Today' : formatDayShort(day.date)}
        </Text>

        <MaterialCommunityIcons
          name={getWeatherIcon(day.condition)}
          size={32}
          color={theme.colors.primary}
        />

        <Text variant="labelLarge" style={{ color: palette.amber700, fontWeight: '700' }}>
          {Math.round(day.maxTempC)}°
        </Text>

        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {Math.round(day.minTempC)}°
        </Text>

        <View style={styles.rainRow}>
          <MaterialCommunityIcons name="water" size={12} color={theme.colors.primary} />
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {day.dailyChanceOfRain}%
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { width: 78, borderRadius: radius.md },
  content: { alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs, paddingVertical: spacing.sm },
  rainRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
