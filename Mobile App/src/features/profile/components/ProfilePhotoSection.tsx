import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { spacing, typography, useAppTheme } from '@/theme';

import { profileStrings } from '../profile.strings';
import { ProfileAvatar } from './ProfileAvatar';

type ProfilePhotoSectionProps = {
  name: string;
  imageUri: string | null;
  uploading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  /** Presentation-only. Complete Profile onboarding chrome. */
  variant?: 'default' | 'onboarding';
  size?: number;
};

export function ProfilePhotoSection({
  name,
  imageUri,
  uploading = false,
  disabled = false,
  onPress,
  variant = 'default',
  size,
}: ProfilePhotoSectionProps) {
  const theme = useAppTheme();
  const hasImage = Boolean(imageUri);
  const onboarding = variant === 'onboarding';

  return (
    <View style={[styles.container, onboarding ? styles.onboardingContainer : null]}>
      <ProfileAvatar
        name={name}
        imageUri={imageUri}
        uploading={uploading}
        disabled={disabled}
        onPress={onPress}
        size={size}
        tone={onboarding ? 'soft' : 'solid'}
      />
      {onboarding ? null : (
        <>
          <Text style={[typography.sectionTitle, { color: theme.colors.onBackground }]}>
            {profileStrings.photo.title}
          </Text>
          <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
            {profileStrings.photo.optional}
          </Text>
          {!hasImage ? (
            <Text style={[typography.caption, { color: theme.colors.primary, marginTop: spacing.xs }]}>
              {profileStrings.photo.tapToUpload}
            </Text>
          ) : null}
          <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant, marginTop: spacing.xs }]}>
            {profileStrings.photo.helper}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  onboardingContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
