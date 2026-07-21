import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';

import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';
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
      <Card mode="elevated" style={[styles.card, cardSurface]}>
        <Card.Content style={styles.row}>
          <MaterialCommunityIcons name="alert-circle-outline" size={iconSize.md} color={theme.colors.error} />
          <Text style={[typography.body, { color: theme.colors.error, flex: 1 }]}>
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
        style={[styles.card, cardSurface, { backgroundColor: theme.colors.primaryContainer }]}
      >
        <Card.Content style={styles.noAlertRow}>
          <View style={[styles.noAlertIcon, { backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={iconSize.lg} color={theme.colors.primary} />
          </View>
          <View style={styles.noAlertText}>
            <Text style={[typography.sectionTitle, { color: theme.colors.onPrimaryContainer }]}>
              No active weather alerts
            </Text>
            <Text style={[typography.caption, { color: theme.colors.onPrimaryContainer, opacity: 0.9 }]}>
              Sky is clear – good time to work outdoors
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card mode="elevated" style={[styles.card, cardSurface]}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
            <MaterialCommunityIcons name="alert-outline" size={iconSize.sm} color={theme.colors.secondary} />
          </View>
          <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]}>
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
                    <MaterialCommunityIcons name={sv.icon} size={iconSize.sm} color={sv.iconColor} />
                  </View>
                  <Text
                    style={[typography.sectionTitle, { color: sv.textColor, flex: 1, fontSize: 15 }]}
                    numberOfLines={1}
                  >
                    {alert.event}
                  </Text>
                  <View style={[styles.severityPill, { borderColor: sv.border }]}>
                    <Text style={[typography.caption, { color: sv.textColor, fontWeight: '500' }]}>
                      {alert.severity}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[typography.body, { color: sv.textColor, marginTop: spacing.sm }]}
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
  card: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  noAlertRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  noAlertIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAlertText: { flex: 1, gap: 3 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 28,
    height: 28,
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
    width: 30,
    height: 30,
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
