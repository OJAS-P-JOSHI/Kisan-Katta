import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '@/theme';

import { profileStrings } from '../profile.strings';

const AVATAR_SIZE = 116;
const TOUCH_TARGET = 48;

type ProfileAvatarProps = {
  name: string;
  imageUri: string | null;
  uploading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase();
}

/**
 * Large circular profile photo. Tap opens camera / gallery / remove actions.
 * Shows Cloudinary image, local preview, or a green initial avatar.
 */
export function ProfileAvatar({
  name,
  imageUri,
  uploading = false,
  disabled = false,
  onPress,
}: ProfileAvatarProps) {
  const theme = useAppTheme();
  const initial = getInitial(name);
  const busy = uploading || disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={profileStrings.photo.changePhotoA11y}
      hitSlop={spacing.sm}
      style={({ pressed }) => [
        styles.pressable,
        pressed && !busy ? styles.pressed : null,
        busy ? styles.disabled : null,
      ]}
    >
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.surface,
          },
        ]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} accessibilityIgnoresInvertColors />
        ) : initial ? (
          <Text variant="displaySmall" style={[styles.initial, { color: theme.colors.onPrimary }]}>
            {initial}
          </Text>
        ) : (
          <MaterialCommunityIcons name="account" size={56} color={theme.colors.onPrimary} />
        )}

        {uploading ? (
          <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
            <ActivityIndicator animating size="small" color={theme.colors.onPrimary} />
            <Text variant="labelSmall" style={{ color: theme.colors.onPrimary, marginTop: spacing.xs }}>
              {profileStrings.photo.uploading}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.9,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initial: {
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
