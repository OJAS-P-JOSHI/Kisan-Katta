import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

import { assistanceStrings } from '../assistance.strings';
import type { HelpRequestAuthor } from '../assistance.types';
import { formatAuthorPlace, formatTimeAgo } from '../assistance.utils';

type AuthorIdentityProps = {
  author: HelpRequestAuthor;
  /** ISO timestamp rendered as "time posted". */
  postedAt: string;
  size?: number;
};

/**
 * Author snapshot header: profile photo, name, verified badge, village +
 * district, and time posted. Every value comes from the stored snapshot.
 */
function AuthorIdentityComponent({ author, postedAt, size = 44 }: AuthorIdentityProps) {
  const theme = useAppTheme();
  const place = formatAuthorPlace(author);

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.colors.primaryContainer,
          },
        ]}
      >
        {author.profilePhoto ? (
          <Image
            source={{ uri: author.profilePhoto }}
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
        <View style={styles.nameRow}>
          <Text
            numberOfLines={1}
            style={[typography.sectionTitle, styles.name, { color: theme.colors.onSurface }]}
          >
            {author.name}
          </Text>
          {author.verified ? (
            <MaterialCommunityIcons
              name="check-decagram"
              size={iconSize.sm}
              color={theme.colors.primary}
              accessibilityLabel={assistanceStrings.card.verified}
            />
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={iconSize.xs}
            color={theme.colors.primary}
          />
          <Text
            numberOfLines={1}
            style={[typography.caption, styles.meta, { color: theme.colors.onSurfaceVariant }]}
          >
            {place}
          </Text>
          <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>·</Text>
          <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
            {formatTimeAgo(postedAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export const AuthorIdentity = memo(AuthorIdentityComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: radius.pill },
  details: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  meta: { flexShrink: 1 },
});
