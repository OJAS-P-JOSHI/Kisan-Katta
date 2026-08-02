import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';

import { RemoteImage } from '@/components/media/RemoteImage';
import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

import { assistanceStrings } from '../assistance.strings';
import type { HelpRequest } from '../assistance.types';
import {
  formatAuthorPlace,
  formatHelpRequestDate,
  getPrimaryProofPhotoUrl,
  getProofPhotoUrls,
} from '../assistance.utils';
import { HelpRequestStatusChip } from './HelpRequestStatusChip';

type HelpRequestCardProps = {
  request: HelpRequest;
  supporting?: boolean;
  onPress: (request: HelpRequest) => void;
  onSupport?: (request: HelpRequest) => void;
  /** Hidden on "My requests", where every row belongs to the viewer. */
  showActions?: boolean;
};

/**
 * Feed card — same horizontal layout, elevation, press feedback, and
 * typography as Marketplace `ListingCard`.
 */
function HelpRequestCardComponent({
  request,
  supporting = false,
  onPress,
  onSupport,
  showActions = true,
}: HelpRequestCardProps) {
  const theme = useAppTheme();
  const imageUrl = getPrimaryProofPhotoUrl(request.images);
  const photoCount = getProofPhotoUrls(request.images).length;
  const extraPhotoCount = photoCount > 1 ? photoCount - 1 : 0;
  const canSupport =
    showActions &&
    request.status === 'OPEN' &&
    !request.isOwner &&
    !request.hasSupported &&
    !supporting;
  const showSupportButton = showActions && !!onSupport && !request.isOwner;

  const handlePress = useCallback(() => onPress(request), [onPress, request]);
  const handleSupport = useCallback(() => onSupport?.(request), [onSupport, request]);

  const supportCountLabel =
    request.supportCount > 0
      ? assistanceStrings.card.supportCount(request.supportCount)
      : assistanceStrings.card.supportCountEmpty;

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [pressed && styles.pressed]}>
      <Card style={[styles.card, cardSurface, { backgroundColor: theme.colors.surface }]} mode="elevated">
        <View style={styles.cardRow}>
          <View style={styles.imageWrap}>
            {imageUrl ? (
              <RemoteImage
                uri={imageUrl}
                displayWidth={600}
                style={styles.image}
                containerStyle={styles.imageFill}
                resizeMode="cover"
                accessibilityLabel={request.title}
              />
            ) : (
              <View
                style={[
                  styles.imageFill,
                  styles.imageFallback,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <MaterialCommunityIcons
                  name="image-off-outline"
                  size={iconSize.xl}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
            )}
            {extraPhotoCount > 0 ? (
              <View style={[styles.moreBadge, { backgroundColor: theme.colors.surface }]}>
                <Text style={[typography.caption, { color: theme.colors.onSurface, fontWeight: '700' }]}>
                  {assistanceStrings.images.morePhotosOverlay(extraPhotoCount)}
                </Text>
              </View>
            ) : null}
            {request.isOwner ? (
              <View style={[styles.ownerBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text
                  numberOfLines={1}
                  style={[typography.caption, { color: theme.colors.onPrimaryContainer, fontSize: 9 }]}
                >
                  {assistanceStrings.card.myRequestBadge}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text
                numberOfLines={2}
                style={[typography.sectionTitle, { color: theme.colors.onSurface, flex: 1 }]}
              >
                {request.title}
              </Text>
              {showSupportButton ? (
                <IconButton
                  icon={request.hasSupported ? 'hand-heart' : 'hand-heart-outline'}
                  size={22}
                  iconColor={
                    request.hasSupported || canSupport
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                  onPress={handleSupport}
                  disabled={!canSupport && !request.hasSupported}
                  style={styles.actionButton}
                  hitSlop={8}
                  accessibilityLabel={
                    request.hasSupported
                      ? assistanceStrings.card.supported
                      : assistanceStrings.card.support
                  }
                />
              ) : null}
            </View>

            <View style={styles.badgeRow}>
              <HelpRequestStatusChip status={request.status} />
            </View>

            <Text style={[typography.sectionTitle, styles.supportCount, { color: theme.colors.primary }]}>
              {supportCountLabel}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={iconSize.sm}
                  color={theme.colors.primary}
                />
                <Text
                  numberOfLines={1}
                  style={[typography.caption, { color: theme.colors.onSurfaceVariant, flex: 1 }]}
                >
                  {formatAuthorPlace(request.author)}
                </Text>
              </View>
            </View>

            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
              {formatHelpRequestDate(request.createdAt)}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export const HelpRequestCard = memo(HelpRequestCardComponent);

const styles = StyleSheet.create({
  card: {},
  pressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
  cardRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.md },
  imageWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  imageFill: { width: '100%', height: '100%' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  moreBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  ownerBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    maxWidth: 80,
  },
  content: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  badgeRow: { alignSelf: 'flex-start' },
  actionButton: { margin: 0, width: 40, height: 40 },
  supportCount: { marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
});
