import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '@/theme';
import type { AppTheme } from '@/theme';

import type { WeatherAlert } from '../weather.types';
import { AlertSkeleton } from './WeatherSkeleton';

type SeverityIconName = 'alert-circle' | 'alert' | 'information-outline';

type SeverityStyle = {
  bg: string;
  border: string;
  icon: SeverityIconName;
  iconColor: string;
  textColor: string;
};

function getSeverityStyle(severity: string, theme: AppTheme): SeverityStyle {
  const s = severity.toLowerCase();
  if (s === 'extreme' || s === 'severe') {
    return {
      bg: theme.colors.errorContainer,
      border: theme.colors.error,
      icon: 'alert-circle',
      iconColor: theme.colors.error,
      textColor: theme.colors.onErrorContainer,
    };
  }
  if (s === 'moderate') {
    return {
      bg: theme.colors.secondaryContainer,
      border: theme.colors.secondary,
      icon: 'alert',
      iconColor: theme.colors.secondary,
      textColor: theme.colors.onSecondaryContainer,
    };
  }
  return {
    bg: theme.colors.primaryContainer,
    border: theme.colors.primary,
    icon: 'information-outline',
    iconColor: theme.colors.primary,
    textColor: theme.colors.onPrimaryContainer,
  };
}

type WeatherAlertCardProps = {
  alerts: WeatherAlert[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export const WeatherAlertCard = memo(function WeatherAlertCard({
  alerts,
  loading,
  error,
  onRetry,
}: WeatherAlertCardProps) {
  const theme = useAppTheme();

  if (loading && alerts === null) {
    return <AlertSkeleton />;
  }

  if (error && alerts === null) {
    return (
      <Card mode="elevated" style={styles.card}>
        <Card.Content style={styles.row}>
          <Text variant="bodySmall" style={{ color: theme.colors.error, flex: 1 }}>
            {error}
          </Text>
          <Button compact mode="text" onPress={onRetry}>
            Retry
          </Button>
        </Card.Content>
      </Card>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card mode="elevated" style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]}>
        <Card.Content style={styles.noAlertRow}>
          <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
          <View style={styles.noAlertText}>
            <Text variant="titleSmall" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}>
              No active weather alerts
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
              Sky is clear – good time to work outdoors
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Content>
        <Text variant="titleSmall" style={[styles.alertsTitle, { color: theme.colors.onSurface }]}>
          ⚠️  Weather Alerts
        </Text>
        {alerts.map((alert, index) => {
          const sv = getSeverityStyle(alert.severity, theme);
          return (
            <View key={`${alert.event}-${String(index)}`}>
              {index > 0 && (
                <Divider style={[styles.alertDivider, { backgroundColor: theme.colors.outlineVariant }]} />
              )}
              <View style={[styles.alertItem, { backgroundColor: sv.bg, borderLeftColor: sv.border }]}>
                <View style={styles.alertHeader}>
                  <MaterialCommunityIcons name={sv.icon} size={20} color={sv.iconColor} />
                  <Text
                    variant="labelLarge"
                    style={{ color: sv.textColor, fontWeight: '700', flex: 1 }}
                    numberOfLines={1}
                  >
                    {alert.event}
                  </Text>
                  <Text variant="labelSmall" style={{ color: sv.textColor }}>
                    {alert.severity}
                  </Text>
                </View>
                <Text
                  variant="bodySmall"
                  style={{ color: sv.textColor, marginTop: spacing.xs }}
                  numberOfLines={3}
                >
                  {alert.headline}
                </Text>
              </View>
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginBottom: spacing.md, borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center' },
  noAlertRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  noAlertText: { flex: 1, gap: 2 },
  alertsTitle: { fontWeight: '700', marginBottom: spacing.sm },
  alertItem: { borderLeftWidth: 4, borderRadius: radius.sm, padding: spacing.sm, marginVertical: spacing.xs },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  alertDivider: { marginVertical: spacing.xs },
});
