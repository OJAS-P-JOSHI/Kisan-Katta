import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

import { RemoteImage } from '@/components/media/RemoteImage';
import { iconSize, radius, spacing, typography } from '@/theme';

import { getCategoryLabel, marketplaceStrings } from '../marketplace.strings';
import { listingTypeAccent, listingTypeWash, mp, mpCard } from '../marketplace.ui';
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
  const { width } = useWindowDimensions();
  const imageSize = width < 360 ? 84 : 96;
  const imageUrl = getListingImageUrl(listing.images);
  const imageCount = getListingImageUrls(listing.images).length;
  const extraImageCount = imageCount > 1 ? imageCount - 1 : 0;
  const title = getListingDisplayTitle(listing);
  const isOwner = isListingOwner(listing.sellerId, currentUserId);
  const showSaveButton = !!onToggleSave && !isOwner;
  const isLabour = listing.listingType === 'labour';
  const accent = listingTypeAccent[listing.listingType];
  const wash = listingTypeWash[listing.listingType];

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

  const dateLine = isLabour
    ? listing.availableFrom
      ? `${marketplaceStrings.detail.availableFrom}: ${formatHarvestDateDisplay(listing.availableFrom)}`
      : null
    : listing.harvestDate
      ? `${marketplaceStrings.detail.harvestDate}: ${formatHarvestDateDisplay(listing.harvestDate)}`
      : null;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.card, mpCard]}>
        <View style={[styles.accent, { backgroundColor: accent }]} />
        <View style={styles.cardRow}>
          <View style={[styles.imageWrap, { width: imageSize, height: imageSize }]}>
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
              <View style={[styles.imageFill, styles.imageFallback, { backgroundColor: wash }]}>
                <MaterialCommunityIcons name={placeholderIcon} size={iconSize.xl} color={accent} />
              </View>
            )}
            {extraImageCount > 0 ? (
              <View style={styles.moreBadge}>
                <Text style={[typography.caption, styles.moreText]}>
                  {marketplaceStrings.images.morePhotosOverlay(extraImageCount)}
                </Text>
              </View>
            ) : null}
            {isOwner ? (
              <View style={styles.ownerBadge}>
                <Text numberOfLines={1} style={styles.ownerText} maxFontSizeMultiplier={1.3}>
                  {marketplaceStrings.myListings.myListingBadge}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text
                numberOfLines={2}
                maxFontSizeMultiplier={1.5}
                style={[typography.sectionTitle, styles.title, { color: mp.headingGreen }]}
              >
                {title}
              </Text>
              {showSaveButton ? (
                <IconButton
                  icon={isSaved ? 'heart' : 'heart-outline'}
                  size={22}
                  iconColor={isSaved ? mp.primaryGreen : mp.muted}
                  onPress={handleToggleSave}
                  style={styles.saveButton}
                  hitSlop={8}
                  accessibilityLabel={
                    isSaved ? marketplaceStrings.unsaveA11y : marketplaceStrings.saveA11y
                  }
                />
              ) : null}
            </View>

            {showStatus ? (
              <View style={styles.badgeRow}>
                <ListingStatusBadge status={listing.status} listingType={listing.listingType} />
              </View>
            ) : null}

            {showBrand && listing.brand ? (
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.5}
                style={[typography.caption, { color: mp.bodyGrey }]}
              >
                {listing.brand}
              </Text>
            ) : null}

            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.4}
              style={[typography.sectionTitle, styles.price]}
            >
              {priceText}
            </Text>

            {quantityText ? (
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.5}
                style={[typography.caption, { color: mp.bodyGrey }]}
              >
                {quantityText}
              </Text>
            ) : null}

            {dateLine ? (
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.5}
                style={[typography.caption, { color: mp.bodyGrey }]}
              >
                {dateLine}
              </Text>
            ) : null}

            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="map-marker-outline" size={iconSize.sm} color={mp.primaryGreen} />
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.5}
                style={[typography.caption, { color: mp.bodyGrey, flex: 1 }]}
              >
                {locationText}
              </Text>
            </View>

            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.4}
              style={[typography.caption, { color: mp.muted }]}
            >
              {getCategoryLabel(listing.category)} · {formatListingDate(listing.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const ListingCard = memo(ListingCardComponent);

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardRow: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
    gap: spacing.md,
    minWidth: 0,
  },
  imageWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    flexShrink: 0,
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
    backgroundColor: 'rgba(253, 249, 243, 0.94)',
  },
  moreText: { color: mp.headingGreen, fontWeight: '700' },
  ownerBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    right: spacing.xs,
    borderRadius: radius.sm,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: mp.produceBg,
    maxWidth: '100%',
  },
  ownerText: {
    color: mp.primaryGreen,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
  },
  content: { flex: 1, minWidth: 0, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', minWidth: 0 },
  title: { flex: 1, minWidth: 0, paddingRight: 4 },
  badgeRow: { alignSelf: 'flex-start' },
  saveButton: { margin: 0, marginTop: -8, marginRight: -8, width: 44, height: 44 },
  price: { marginTop: 2, color: mp.primaryGreen, fontWeight: '700' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minWidth: 0 },
});
