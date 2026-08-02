import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { useMyProfile } from '@/features/profile/hooks/useMyProfile';
import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

import { assistanceStrings } from '../assistance.strings';

const AVATAR_SIZE = 48;

/**
 * Read-only preview of the profile fields the server snapshots onto the
 * request. The farmer never types their name, place, or photo.
 */
export function AuthorAutoFillCard() {
  const theme = useAppTheme();
  const { data: profile, loading } = useMyProfile();

  const place = profile
    ? [profile.village, profile.taluka, profile.district]
        .filter((part) => !!part && part.length > 0)
        .join(' · ')
    : '';

  return (
    <Card
      style={[cardSurface, { backgroundColor: theme.colors.surface }]}
      mode="elevated"
    >
      <View style={styles.content}>
        <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
          {assistanceStrings.create.authorPreviewTitle}
        </Text>

        {loading && !profile ? (
          <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
            {assistanceStrings.create.authorLoading}
          </Text>
        ) : (
          <View style={styles.row}>
            <View
              style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}
            >
              {profile?.profileImage?.url ? (
                <Image
                  source={{ uri: profile.profileImage.url }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <MaterialCommunityIcons
                  name="account"
                  size={iconSize.lg}
                  color={theme.colors.onPrimaryContainer}
                />
              )}
            </View>

            <View style={styles.details}>
              <Text
                numberOfLines={1}
                style={[typography.sectionTitle, { color: theme.colors.onSurface }]}
              >
                {profile?.name ?? ''}
              </Text>
              {place ? (
                <Text
                  numberOfLines={2}
                  style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}
                >
                  {place}
                </Text>
              ) : (
                <Text style={[typography.caption, { color: theme.colors.error }]}>
                  {assistanceStrings.validation.profileRequired}
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  details: { flex: 1, gap: 2 },
});
