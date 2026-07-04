import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { elevation, palette, radius, spacing, useAppTheme } from '@/theme';

import { getGreeting } from '../weather.utils';

export type DashboardHeaderProps = {
  /** Farmer's name from the authenticated profile (`GET /api/v1/profile/me`). */
  name: string;
  village?: string;
  taluka?: string;
  district?: string;
};

export const DashboardHeader = memo(function DashboardHeader({
  name,
  village,
  taluka,
  district,
}: DashboardHeaderProps) {
  const theme = useAppTheme();
  const greeting = getGreeting();
  const hasLocation = !!(village || taluka || district);

  const locationLine = [village, taluka, district].filter(Boolean).join(' · ');

  return (
    <View style={styles.wrapper}>
      {/* Decorative organic shapes */}
      <View style={[styles.blobTop, { backgroundColor: theme.colors.primaryContainer }]} />
      <View style={[styles.blobBottom, { backgroundColor: palette.amber100 }]} />
      <View style={[styles.leafAccent, { borderColor: theme.colors.primary }]}>
        <MaterialCommunityIcons name="leaf" size={14} color={theme.colors.primary} style={styles.leafIcon} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, elevation.card]}>
        <Image
          source={require('@/assets/branding/logo-circle.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Kisan Katta"
        />

        <View style={styles.textBlock}>
          <Text variant="labelLarge" style={[styles.greeting, { color: theme.colors.onSurfaceVariant }]}>
            {greeting}
          </Text>
          <Text
            variant="headlineSmall"
            style={[styles.name, { color: theme.colors.onBackground }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {hasLocation && (
            <View style={styles.locationRow}>
              <View style={[styles.locationIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                <MaterialCommunityIcons name="map-marker-outline" size={13} color={theme.colors.primary} />
              </View>
              <Text
                variant="bodyMedium"
                style={[styles.locationText, { color: theme.colors.onSurfaceVariant }]}
                numberOfLines={2}
              >
                {locationLine}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
});

const LOGO_SIZE = 44;

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    position: 'relative',
  },
  blobTop: {
    position: 'absolute',
    top: -28,
    right: -12,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.45,
  },
  blobBottom: {
    position: 'absolute',
    bottom: -20,
    left: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    opacity: 0.35,
  },
  leafAccent: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    opacity: 0.25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafIcon: { opacity: 0.6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
  },
  textBlock: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.sm,
  },
  greeting: {
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  name: {
    fontWeight: '600',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  locationIcon: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  locationText: {
    flex: 1,
    lineHeight: 20,
  },
});
