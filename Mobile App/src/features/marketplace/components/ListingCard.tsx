import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';

import { RemoteImage } from '@/components/media/RemoteImage';
import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

import { getCategoryLabel, marketplaceStrings } from '../marketplace.strings';
import type { MarketplaceListing } from '../marketplace.types';
import {
  formatHarvestDateDisplay,
  formatLabourRate,
  formatListingDate,
  formatPrice,
  getListingDisplayTitle,
  getListingImageUrl,
  getListingImageUrls,
  getLabourGroupLabel,
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
  const imageCount = getListingImageUrls(listing.images).length;
  const extraImageCount = imageCount > 1 ? imageCount - 1 : 0;
  const title = getListingDisplayTitle(listing);
  const isOwner = isListingOwner(listing.sellerId, currentUserId);
  const showSaveButton = !!onToggleSave && !isOwner;
  const isLabour = listing.listingType === 'labour';

  const handlePress = useCallback(() => onPress(listing), [listing, onPress]);
  const handleToggleSave = useCallback(() => {
    onToggleSave?.(listing);
  }, [listing, onToggleSave]);

  const quantityText = isLabour
    ? listing.availableWorkers != null
      ? `${listing.availableWorkers} · ${
          getLabourGroupLabel(listing.availableWorkers) === 'Individual'
            ? marketplaceStrings.detail.individual
            : marketplaceStrings.detail.group
        }`
      : null
    : listing.quantity != null && listing.unit
      ? `${listing.quantity} ${listing.unit}`
      : listing.stock != null
        ? `${listing.stock} ${marketplaceStrings.detail.inStock}`
        : null;

  const priceText = isLabour
    ? formatLabourRate(listing.price, listing.rateType)
    : formatPrice(listing.price);

  const locationText = isLabour
    ? [listing.village, listing.district].filter(Boolean).join(', ') || listing.district
    : listing.district;

  const placeholderIcon =
    listing.listingType === 'produce'
      ? 'sprout'
      : listing.listingType === 'labour'
        ? 'account-hard-hat'
        : 'package-variant';

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
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
                accessibilityLabel={title}
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
                  name={placeholderIcon}
                  size={iconSize.xl}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
            )}
            {extraImageCount > 0 ? (
              <View style={[styles.moreBadge, { backgroundColor: theme.colors.surface }]}>
                <Text style={[typography.caption, { color: theme.colors.onSurface, fontWeight: '700' }]}>
                  {marketplaceStrings.images.morePhotosOverlay(extraImageCount)}
                </Text>
              </View>
            ) : null}
            {isOwner ? (
              <View style={[styles.ownerBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text
                  numberOfLines={1}
                  style={[typography.caption, { color: theme.colors.onPrimaryContainer, fontSize: 9 }]}
                >
                  {marketplaceStrings.myListings.myListingBadge}
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
                {title}
              </Text>
              {showSaveButton ? (
                <IconButton
                  icon={isSaved ? 'heart' : 'heart-outline'}
                  size={22}
                  iconColor={isSaved ? theme.colors.error : theme.colors.onSurfaceVariant}
                  onPress={handleToggleSave}
                  style={styles.saveButton}
                  hitSlop={8}
                />
              ) : null}
            </View>

            {showStatus ? (
              <View style={styles.badgeRow}>
                <ListingStatusBadge status={listing.status} listingType={listing.listingType} />
              </View>
            ) : null}

            {showBrand && listing.brand ? (
              <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                {listing.brand}
              </Text>
            ) : null}

            <Text style={[typography.sectionTitle, styles.price, { color: theme.colors.primary }]}>
              {priceText}
            </Text>

            {quantityText ? (
              <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                {quantityText}
              </Text>
            ) : null}

            {isLabour && listing.availableFrom ? (
              <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                {marketplaceStrings.detail.availableFrom}:{' '}
                {formatHarvestDateDisplay(listing.availableFrom)}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="map-marker-outline" size={iconSize.sm} color={theme.colors.primary} />
                <Text
                  numberOfLines={1}
                  style={[typography.caption, { color: theme.colors.onSurfaceVariant, flex: 1 }]}
                >
                  {locationText}
                </Text>
              </View>
            </View>

            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
              {getCategoryLabel(listing.category)} · {formatListingDate(listing.createdAt)}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export const ListingCard = memo(ListingCardComponent);

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
  saveButton: { margin: 0, width: 40, height: 40 },
  price: { marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
});
