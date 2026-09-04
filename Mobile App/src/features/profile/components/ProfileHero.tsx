import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { iconSize, spacing, typography } from '@/theme';

import { profileUi } from '../profile.ui';
import { ProfileAvatar } from './ProfileAvatar';

type ProfileHeroProps = {
  name: string;
  imageUri: string | null;
  uploading: boolean;
  onPhotoPress: () => void;
  district: string | null;
  cropSummary: string | null;
  mobile: string | null;
  avatarSize: number;
  nameSize: number;
};

export function ProfileHero({
  name,
  imageUri,
  uploading,
  onPhotoPress,
  district,
  cropSummary,
  mobile,
  avatarSize,
  nameSize,
}: ProfileHeroProps) {
  const stage = avatarSize + 36;

  return (
    <View style={styles.hero}>
      <View style={[styles.avatarStage, { width: stage, height: stage }]}>
        <ProfileAvatar
          name={name}
          imageUri={imageUri}
          uploading={uploading}
          onPress={onPhotoPress}
          size={avatarSize}
          featured
        />
      </View>

      {name ? (
        <Text
          style={[
            typography.largeHeading,
            styles.name,
            { fontSize: nameSize, lineHeight: nameSize + 6, color: profileUi.heading },
          ]}
          maxFontSizeMultiplier={1.3}
        >
          {name}
        </Text>
      ) : null}

      {district ? (
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="map-marker" size={iconSize.sm} color={profileUi.primary} />
          <Text
            style={[typography.body, styles.metaText, { color: profileUi.body }]}
            numberOfLines={2}
            maxFontSizeMultiplier={1.3}
          >
            {district}
          </Text>
        </View>
      ) : null}

      {cropSummary ? (
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="sprout" size={iconSize.sm} color={profileUi.primary} />
          <Text
            style={[typography.body, styles.metaText, { color: profileUi.body }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
          >
            {cropSummary}
          </Text>
        </View>
      ) : null}

      {mobile ? (
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="phone-outline" size={iconSize.sm} color={profileUi.muted} />
          <Text
            style={[typography.caption, styles.phone, { color: profileUi.muted }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
          >
            {mobile}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatarStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
    overflow: 'visible',
  },
  name: {
    textAlign: 'center',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    maxWidth: '100%',
  },
  metaText: {
    flexShrink: 1,
    textAlign: 'center',
    fontWeight: '500',
  },
  phone: {
    flexShrink: 1,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
