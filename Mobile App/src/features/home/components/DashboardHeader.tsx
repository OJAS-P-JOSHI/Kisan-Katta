import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { BrandLeaves } from '@/components/BrandLeaves';
import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

import { getGreeting } from '../weather.utils';

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
  const greeting = getGreeting();
  const hasLocation = !!(village || taluka || district);

  const primaryLocation = district || taluka || village || '';
  const detailParts = [village, taluka].filter(
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
          <Text style={[typography.caption, styles.greeting, { color: theme.colors.onSurfaceVariant }]}>
            {greeting} 👋
          </Text>
          <Text
            style={[typography.largeHeading, { color: theme.colors.onBackground }]}
            numberOfLines={1}
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
                  numberOfLines={1}
                >
                  {primaryLocation}
                </Text>
                {locationDetail ? (
                  <Text
                    style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}
                    numberOfLines={1}
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
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    position: 'relative',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
  },
  textBlock: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.xs,
  },
  greeting: {
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  locationIcon: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextBlock: {
    flex: 1,
    gap: 1,
  },
});
