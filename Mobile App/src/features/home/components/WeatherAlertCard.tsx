import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { iconSize, palette, radius, spacing, typography, useAppTheme } from '@/theme';
import type { AppTheme } from '@/theme';

import { homeSurfaces, homeText } from '../home.theme';
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
  farmingAdvice?: string;
};

export const WeatherAlertCard = memo(function WeatherAlertCard({
  alerts,
  loading,
  error,
  onRetry,
  farmingAdvice,
}: WeatherAlertCardProps) {
  const theme = useAppTheme();

  if (loading && alerts === null) {
    return <AlertSkeleton />;
  }

  if (error && alerts === null) {
    return (
      <View style={[styles.errorRow, homeSurfaces.utility, { marginHorizontal: 0, padding: spacing.md }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={iconSize.md} color={theme.colors.error} />
        <Text style={[typography.body, { color: theme.colors.error, flex: 1 }]}>
          {error}
        </Text>
        <Button compact mode="text" onPress={onRetry}>
          {strings.home.retry}
        </Button>
      </View>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <View style={[styles.compactBar, { backgroundColor: palette.green50, borderColor: palette.mist }]}>
        <MaterialCommunityIcons name="check-circle-outline" size={iconSize.sm} color={theme.colors.primary} />
        <Text
          style={[homeText.marathiCaption, { color: theme.colors.onSurfaceVariant, flex: 1, fontSize: 12 }]}
          numberOfLines={2}
        >
          {strings.home.alerts.noneTitle}
          {farmingAdvice ? ` · ${farmingAdvice}` : ''}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.alertCard, homeSurfaces.primary, { marginHorizontal: 0 }]}>
      <Text style={[homeText.sectionPrimary, { color: theme.colors.onSurface, marginBottom: spacing.sm }]}>
        {strings.home.alerts.title}
      </Text>

      {alerts.map((alert, index) => {
        const sv = getSeverityStyle(alert.severity, theme);
        return (
          <View key={`${alert.event}-${String(index)}`}>
            {index > 0 ? <View style={[styles.alertDivider, { backgroundColor: theme.colors.outlineVariant }]} /> : null}
            <View style={[styles.alertItem, { backgroundColor: sv.bg, borderLeftColor: sv.border }]}>
              <View style={styles.alertHeader}>
                <MaterialCommunityIcons name={sv.icon} size={iconSize.sm} color={sv.iconColor} />
                <Text
                  style={[typography.sectionTitle, { color: sv.textColor, flex: 1, fontSize: 14 }]}
                  numberOfLines={1}
                >
                  {alert.event}
                </Text>
                <View style={[styles.severityPill, { borderColor: sv.border }]}>
                  <Text style={[typography.caption, { color: sv.textColor, fontWeight: '500', fontSize: 10 }]}>
                    {alert.severity}
                  </Text>
                </View>
              </View>
              <Text
                style={[typography.body, homeText.marathiBody, { color: sv.textColor, marginTop: spacing.sm, fontSize: 13 }]}
                numberOfLines={3}
              >
                {alert.headline}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  compactBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  alertCard: {
    padding: spacing.md,
  },
  alertItem: {
    borderLeftWidth: 3,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  severityPill: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  alertDivider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.sm },
});
