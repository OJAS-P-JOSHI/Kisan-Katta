import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { strings } from '@/constants';
import { iconSize, spacing, useAppTheme } from '@/theme';

import { homeColors, homeText } from '../home.theme';
import { getGreetingByTime } from '../weather.localization';

export type DashboardHeaderProps = {
  name: string;
  village?: string;
  taluka?: string;
  district?: string;
};

const LOGO_SIZE = 44;

export const DashboardHeader = memo(function DashboardHeader({
  name,
  village,
  taluka,
  district,
}: DashboardHeaderProps) {
  const theme = useAppTheme();
  const { text: greetingText, emoji: greetingEmoji } = getGreetingByTime();
  const hasLocation = !!(village || taluka || district);

  const primaryLocation = village || taluka || district || '';
  const detailParts = [taluka, district].filter(
    (part) => !!part && part !== primaryLocation,
  );
  const locationDetail = detailParts.join(' · ');

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <View style={styles.brandBlock}>
          <Image
            source={require('@/assets/branding/logo-circle.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Kissan Agrisathi"
          />
          <Text style={[homeText.heroBrand, { color: homeColors.heroAccent }]}>
            {strings.app.name}
          </Text>
        </View>
        <Text style={[homeText.heroGreeting, { color: theme.colors.onSurfaceVariant }]}>
          {greetingText} {greetingEmoji}
        </Text>
      </View>

      <Text
        style={[homeText.heroName, styles.farmerName, { color: theme.colors.onBackground }]}
        numberOfLines={2}
      >
        {name}
      </Text>

      {hasLocation ? (
        <View style={styles.locationRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={iconSize.sm}
            color={theme.colors.primary}
          />
          <View style={styles.locationTextBlock}>
            <Text
              style={[homeText.marathiBody, styles.locationPrimary, { color: theme.colors.onSurface }]}
              numberOfLines={2}
            >
              {primaryLocation}
            </Text>
            {locationDetail ? (
              <Text
                style={[homeText.marathiCaption, { color: theme.colors.onSurfaceVariant, fontSize: 12 }]}
                numberOfLines={2}
              >
                {locationDetail}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
    minWidth: 0,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
  },
  farmerName: {
    marginTop: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: homeColors.sandLine,
  },
  locationTextBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  locationPrimary: {
    fontWeight: '600',
    fontSize: 15,
  },
});
