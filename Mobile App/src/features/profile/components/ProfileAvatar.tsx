import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import { elevation, spacing, useAppTheme } from '@/theme';

import { profileStrings } from '../profile.strings';

const DEFAULT_AVATAR_SIZE = 116;
const TOUCH_TARGET = 48;

type ProfileAvatarProps = {
  name: string;
  imageUri: string | null;
  uploading?: boolean;
  disabled?: boolean;
  /** Visual diameter in dp. Defaults to 116. */
  size?: number;
  /** Presentation-only. Soft = light-green fill for onboarding. */
  tone?: 'solid' | 'soft';
  /** Presentation-only. Larger ring + shadow for the Profile tab hero. */
  featured?: boolean;
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
  size = DEFAULT_AVATAR_SIZE,
  tone = 'solid',
  featured = false,
  onPress,
}: ProfileAvatarProps) {
  const theme = useAppTheme();
  const initial = getInitial(name);
  const busy = uploading || disabled;
  const hasImage = Boolean(imageUri);
  const pulse = useMemo(() => new Animated.Value(1), []);
  const badgeSize = Math.max(featured ? 32 : 22, Math.round(size * (featured ? 0.26 : 0.28)));
  const iconGlyph = Math.round(size * 0.48);
  const soft = tone === 'soft';
  const ringPad = featured ? 6 : 4;
  const wrapSize = size + ringPad * 2;
  const fillColor = soft ? theme.colors.primaryContainer : theme.colors.primary;
  const glyphColor = soft ? theme.colors.onPrimaryContainer : theme.colors.onPrimary;

  useEffect(() => {
    if (hasImage || busy) {
      pulse.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [busy, hasImage, pulse]);

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
          styles.avatarWrap,
          { width: wrapSize, height: wrapSize, borderRadius: wrapSize / 2 },
          featured
            ? [
                styles.featuredWrap,
                {
                  borderColor: theme.colors.primaryContainer,
                  backgroundColor: theme.colors.surface,
                },
              ]
            : null,
          soft
            ? { borderWidth: 1.5, borderColor: theme.colors.primary }
            : null,
        ]}
      >
        <View
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: fillColor,
              borderColor: theme.colors.surface,
              borderWidth: featured ? 2 : soft ? 4 : 3,
            },
          ]}
        >
          <Animated.View style={[styles.avatarInner, !hasImage ? { transform: [{ scale: pulse }] } : null]}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} accessibilityIgnoresInvertColors />
            ) : initial ? (
              <Text
                variant="displaySmall"
                style={[styles.initial, { color: glyphColor, fontSize: Math.round(size * 0.38) }]}
              >
                {initial}
              </Text>
            ) : (
              <MaterialCommunityIcons name="account" size={iconGlyph} color={glyphColor} />
            )}
          </Animated.View>

          {uploading ? (
            <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
              <ActivityIndicator animating size="small" color={theme.colors.onPrimary} />
              <Text variant="labelSmall" style={{ color: theme.colors.onPrimary, marginTop: spacing.xs }}>
                {profileStrings.photo.uploading}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.cameraBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: featured || soft ? theme.colors.primary : theme.colors.surface,
              borderColor: featured || soft ? theme.colors.surface : theme.colors.primaryContainer,
              right: featured ? 2 : 0,
              bottom: featured ? 2 : 0,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="camera-outline"
            size={Math.round(badgeSize * 0.55)}
            color={featured || soft ? theme.colors.onPrimary : theme.colors.primary}
          />
        </View>
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
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  cameraBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 2,
  },
  featuredWrap: {
    borderWidth: 3,
    ...elevation.card,
  },
});
