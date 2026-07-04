import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';

import { elevation, radius, spacing, useAppTheme } from '@/theme';
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
      <Card mode="elevated" style={[styles.card, elevation.soft]}>
        <Card.Content style={styles.row}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color={theme.colors.error} />
          <Text variant="bodyMedium" style={{ color: theme.colors.error, flex: 1 }}>
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
      <Card
        mode="elevated"
        style={[styles.card, elevation.soft, { backgroundColor: theme.colors.primaryContainer }]}
      >
        <Card.Content style={styles.noAlertRow}>
          <View style={[styles.noAlertIcon, { backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={26} color={theme.colors.primary} />
          </View>
          <View style={styles.noAlertText}>
            <Text variant="titleSmall" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '600' }}>
              No active weather alerts
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.9 }}>
              Sky is clear – good time to work outdoors
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card mode="elevated" style={[styles.card, elevation.card]}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
            <MaterialCommunityIcons name="alert-outline" size={18} color={theme.colors.secondary} />
          </View>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
            Weather Alerts
          </Text>
        </View>

        {alerts.map((alert, index) => {
          const sv = getSeverityStyle(alert.severity, theme);
          return (
            <View key={`${alert.event}-${String(index)}`}>
              {index > 0 && (
                <Divider style={[styles.alertDivider, { backgroundColor: theme.colors.outlineVariant }]} />
              )}
              <View style={[styles.alertItem, { backgroundColor: sv.bg, borderLeftColor: sv.border }]}>
                <View style={styles.alertHeader}>
                  <View style={[styles.alertIconBadge, { backgroundColor: theme.colors.surface }]}>
                    <MaterialCommunityIcons name={sv.icon} size={18} color={sv.iconColor} />
                  </View>
                  <Text
                    variant="titleSmall"
                    style={{ color: sv.textColor, fontWeight: '600', flex: 1 }}
                    numberOfLines={1}
                  >
                    {alert.event}
                  </Text>
                  <View style={[styles.severityPill, { borderColor: sv.border }]}>
                    <Text variant="labelSmall" style={{ color: sv.textColor, fontWeight: '500' }}>
                      {alert.severity}
                    </Text>
                  </View>
                </View>
                <Text
                  variant="bodyMedium"
                  style={{ color: sv.textColor, marginTop: spacing.sm, lineHeight: 20 }}
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
  card: { marginHorizontal: spacing.md, marginBottom: spacing.md, borderRadius: radius.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  noAlertRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  noAlertIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAlertText: { flex: 1, gap: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertItem: {
    borderLeftWidth: 3,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  alertIconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityPill: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  alertDivider: { marginVertical: spacing.sm },
});
