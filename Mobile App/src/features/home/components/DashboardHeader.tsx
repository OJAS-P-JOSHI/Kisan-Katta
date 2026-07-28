import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { BrandLeaves } from '@/components/BrandLeaves';
import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

import { getGreetingByTime } from '../weather.localization';

export type DashboardHeaderProps = {
  /** Farmer's name from the authenticated profile (`GET /api/v1/profile/me`). */
  name: string;
  village?: string;
  taluka?: string;
  district?: string;
};

const LOGO_SIZE = 36;

export const DashboardHeader = memo(function DashboardHeader({
  name,
  village,
  taluka,
  district,
}: DashboardHeaderProps) {
  const theme = useAppTheme();
  const { text: greetingText, emoji: greetingEmoji } = getGreetingByTime();
  const hasLocation = !!(village || taluka || district);

  // Village-first hierarchy: village → taluka · district
  const primaryLocation = village || taluka || district || '';
  const detailParts = [taluka, district].filter(
    (part) => !!part && part !== primaryLocation,
  );
  const locationDetail = detailParts.join(' · ');

  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardSurface]}>
        <BrandLeaves variant="greeting" />

        <Image
          source={require('@/assets/branding/logo-circle.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Kisan Katta"
        />

        <View style={styles.textBlock}>
          <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
            {greetingText} {greetingEmoji}
          </Text>
          <Text
            style={[typography.largeHeading, { color: theme.colors.onBackground }]}
            numberOfLines={2}
          >
            {name}
          </Text>
          {hasLocation ? (
            <View style={styles.locationRow}>
              <View style={[styles.locationIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={iconSize.xs}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.locationTextBlock}>
                <Text
                  style={[typography.body, { color: theme.colors.onSurface, fontWeight: '500' }]}
                  numberOfLines={2}
                >
                  {primaryLocation}
                </Text>
                {locationDetail ? (
                  <Text
                    style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}
                    numberOfLines={2}
                  >
                    {locationDetail}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    position: 'relative',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
  },
  textBlock: {
    flex: 1,
    gap: 3,
    paddingRight: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  locationIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextBlock: {
    flex: 1,
    gap: 1,
  },
});
