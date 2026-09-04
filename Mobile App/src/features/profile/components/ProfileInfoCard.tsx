import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { iconSize, radius, spacing, typography } from '@/theme';

import { profileStrings } from '../profile.strings';
import { profileCard, profileUi } from '../profile.ui';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type InfoRowProps = {
  icon: IconName;
  label: string;
  value?: string;
  last?: boolean;
  children?: ReactNode;
};

function InfoRow({ icon, label, value, last = false, children }: InfoRowProps) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={iconSize.md} color={profileUi.primary} />
      </View>
      <View style={styles.rowText}>
        <Text
          style={[typography.caption, styles.label, { color: profileUi.muted }]}
          maxFontSizeMultiplier={1.3}
        >
          {label}
        </Text>
        {children ?? (
          <Text
            style={[typography.body, styles.value, { color: profileUi.heading }]}
            maxFontSizeMultiplier={1.35}
          >
            {value ?? ''}
          </Text>
        )}
      </View>
    </View>
  );
}

type ProfileInfoCardProps = {
  district: string;
  taluka: string;
  village: string;
  cropLabels: string[];
};

export function ProfileInfoCard({ district, taluka, village, cropLabels }: ProfileInfoCardProps) {
  return (
    <View style={profileCard}>
      <View style={styles.summary}>
        <View style={styles.summaryIcon}>
          <MaterialCommunityIcons name="sprout-outline" size={iconSize.md} color={profileUi.primary} />
        </View>
        <View style={styles.summaryText}>
          <Text
            style={[typography.sectionTitle, { color: profileUi.heading }]}
            maxFontSizeMultiplier={1.3}
          >
            {profileStrings.summary.title}
          </Text>
          <Text
            style={[typography.caption, { color: profileUi.muted }]}
            maxFontSizeMultiplier={1.35}
          >
            {profileStrings.summary.subtitle}
          </Text>
        </View>
      </View>

      <InfoRow icon="map-marker-outline" label={profileStrings.labels.district} value={district} />
      <InfoRow icon="map-outline" label={profileStrings.labels.taluka} value={taluka} />
      <InfoRow icon="home-outline" label={profileStrings.labels.village} value={village} />
      <InfoRow icon="sprout-outline" label={profileStrings.labels.favoriteCrops} last>
        {cropLabels.length > 0 ? (
          <View style={styles.chipWrap}>
            {cropLabels.map((label, index) => (
              <View key={`${label}-${index}`} style={styles.chip}>
                <Text
                  style={[typography.caption, styles.chipLabel, { color: profileUi.heading }]}
                  maxFontSizeMultiplier={1.3}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </InfoRow>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: profileUi.wash,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: profileUi.line,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: profileUi.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: profileUi.line,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: profileUi.wash,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  value: {
    fontWeight: '500',
    flexShrink: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  chip: {
    maxWidth: '100%',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: profileUi.wash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: profileUi.line,
  },
  chipLabel: {
    fontWeight: '600',
  },
});
