import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Card, Chip, IconButton, Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '@/theme';

import type { MarketplaceListing } from '../marketplace.types';
import {
  formatListingDate,
  formatPrice,
  getListingDisplayTitle,
  getListingImageUrl,
  isListingOwner,
} from '../marketplace.utils';
import { ListingStatusBadge } from './ListingStatusBadge';

type ListingCardProps = {
  listing: MarketplaceListing;
  currentUserId?: string | null;
  isSaved?: boolean;
  onPress: (listing: MarketplaceListing) => void;
  onToggleSave?: (listing: MarketplaceListing) => void;
  showBrand?: boolean;
  showStatus?: boolean;
};

function ListingCardComponent({
  listing,
  currentUserId,
  isSaved = false,
  onPress,
  onToggleSave,
  showBrand = listing.listingType === 'product',
  showStatus = true,
}: ListingCardProps) {
  const theme = useAppTheme();
  const imageUrl = getListingImageUrl(listing.images);
  const title = getListingDisplayTitle(listing);
  const isOwner = isListingOwner(listing.sellerId, currentUserId);
  const showSaveButton = !!onToggleSave && !isOwner;

  const handlePress = useCallback(() => onPress(listing), [listing, onPress]);
  const handleToggleSave = useCallback(() => {
    onToggleSave?.(listing);
  }, [listing, onToggleSave]);

  return (
    <Pressable onPress={handlePress}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
        <View style={styles.cardRow}>
          <View style={[styles.imageWrap, { backgroundColor: theme.colors.surfaceVariant }]}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
            ) : (
              <MaterialCommunityIcons
                name={listing.listingType === 'produce' ? 'barley' : 'package-variant'}
                size={32}
                color={theme.colors.onSurfaceVariant}
              />
            )}
            {isOwner ? (
              <View style={[styles.ownerBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text
                  variant="labelSmall"
                  numberOfLines={1}
                  style={{ color: theme.colors.onPrimaryContainer, fontSize: 9 }}
                >
                  My Listing
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text variant="titleMedium" numberOfLines={1} style={{ color: theme.colors.onSurface, flex: 1 }}>
                {title}
              </Text>
              {showSaveButton ? (
                <IconButton
                  icon={isSaved ? 'heart' : 'heart-outline'}
                  size={20}
                  iconColor={isSaved ? theme.colors.error : theme.colors.onSurfaceVariant}
                  onPress={handleToggleSave}
                  style={styles.saveButton}
                />
              ) : null}
            </View>

            {showStatus ? (
              <View style={styles.badgeRow}>
                <ListingStatusBadge status={listing.status} />
              </View>
            ) : null}

            {showBrand && listing.brand ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {listing.brand}
              </Text>
            ) : null}

            <Text variant="titleSmall" style={{ color: theme.colors.primary, marginTop: spacing.xs }}>
              {formatPrice(listing.price)}
              {listing.quantity != null && listing.unit
                ? ` · ${listing.quantity} ${listing.unit}`
                : listing.stock != null
                  ? ` · ${listing.stock} in stock`
                  : ''}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {listing.district}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="calendar-outline" size={14} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {formatListingDate(listing.createdAt)}
                </Text>
              </View>
            </View>

            <Chip compact mode="outlined" style={styles.categoryChip} textStyle={styles.categoryChipText}>
              {listing.category}
            </Chip>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export const ListingCard = memo(ListingCardComponent);

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg },
  cardRow: { flexDirection: 'row', padding: spacing.sm, gap: spacing.sm },
  imageWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  ownerBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    maxWidth: 72,
  },
  content: { flex: 1, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  badgeRow: { marginTop: spacing.xs },
  saveButton: { margin: 0 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  categoryChip: { alignSelf: 'flex-start', marginTop: spacing.xs, height: 24 },
  categoryChipText: { fontSize: 10, lineHeight: 12, marginVertical: 0 },
});
