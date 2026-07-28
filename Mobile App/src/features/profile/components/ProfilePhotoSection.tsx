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
};

export function ProfilePhotoSection({
  name,
  imageUri,
  uploading = false,
  disabled = false,
  onPress,
}: ProfilePhotoSectionProps) {
  const theme = useAppTheme();
  const hasImage = Boolean(imageUri);

  return (
    <View style={styles.container}>
      <ProfileAvatar
        name={name}
        imageUri={imageUri}
        uploading={uploading}
        disabled={disabled}
        onPress={onPress}
      />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
});
