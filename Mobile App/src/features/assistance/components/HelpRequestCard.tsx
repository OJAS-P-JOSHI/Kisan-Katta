import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import { RemoteImage } from '@/components/media/RemoteImage';
import { iconSize, spacing } from '@/theme';

import { assistanceStrings } from '../assistance.strings';
import type { HelpRequest } from '../assistance.types';
import { saath, saathCard, saathImageSize, saathText } from '../assistance.ui';
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
 * Community-oriented feed card. Same data and support rules as before;
 * layout and CTA prominence are visual only.
 */
function HelpRequestCardComponent({
  request,
  supporting = false,
  onPress,
  onSupport,
  showActions = true,
}: HelpRequestCardProps) {
  const { width } = useWindowDimensions();
  const imageSize = saathImageSize(width);
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
  const showSupportCta = showSupportButton && (canSupport || request.hasSupported || supporting);
  const stackSupport = width < 430;

  const handlePress = useCallback(() => onPress(request), [onPress, request]);
  const handleSupport = useCallback(() => onSupport?.(request), [onSupport, request]);

  const supportCountLabel =
    request.supportCount > 0
      ? assistanceStrings.card.supportCount(request.supportCount)
      : assistanceStrings.card.supportCountEmpty;

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [pressed && styles.pressed]}>
      <View style={saathCard}>
        <View style={styles.cardRow}>
          <View style={[styles.imageWrap, { width: imageSize, height: imageSize }]}>
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
              <View style={[styles.imageFill, styles.imageFallback]}>
                <MaterialCommunityIcons
                  name="image-off-outline"
                  size={iconSize.xl}
                  color={saath.muted}
                />
              </View>
            )}
            {extraPhotoCount > 0 ? (
              <View style={styles.moreBadge}>
                <Text style={[saathText.meta, styles.moreText]}>
                  {assistanceStrings.images.morePhotosOverlay(extraPhotoCount)}
                </Text>
              </View>
            ) : null}
            {request.isOwner ? (
              <View style={styles.ownerBadge}>
                <Text numberOfLines={1} style={styles.ownerText}>
                  {assistanceStrings.card.myRequestBadge}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.content}>
            <View style={styles.badgeRow}>
              <HelpRequestStatusChip status={request.status} />
            </View>

            <Text
              numberOfLines={2}
              style={[saathText.cardTitle, { color: saath.heading }]}
              maxFontSizeMultiplier={1.4}
            >
              {request.title}
            </Text>

            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={iconSize.sm}
                color={saath.primary}
              />
              <Text
                numberOfLines={1}
                style={[saathText.meta, styles.metaText]}
                maxFontSizeMultiplier={1.4}
              >
                {formatAuthorPlace(request.author)}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={iconSize.sm}
                color={saath.muted}
              />
              <Text
                numberOfLines={1}
                style={[saathText.meta, styles.metaText]}
                maxFontSizeMultiplier={1.4}
              >
                {formatHelpRequestDate(request.createdAt)}
              </Text>
            </View>

            <View style={[styles.supportRow, stackSupport && styles.supportRowStack]}>
              <View style={styles.supportCountWrap}>
                <MaterialCommunityIcons
                  name="hand-heart"
                  size={iconSize.sm}
                  color={saath.primary}
                />
                <Text
                  numberOfLines={1}
                  style={[saathText.supportCount, { color: saath.primary, flexShrink: 1 }]}
                  maxFontSizeMultiplier={1.3}
                >
                  {supportCountLabel}
                </Text>
              </View>

              {showSupportCta ? (
                <Pressable
                  onPress={handleSupport}
                  disabled={!canSupport && !supporting}
                  accessibilityRole="button"
                  accessibilityLabel={
                    request.hasSupported
                      ? assistanceStrings.card.supported
                      : assistanceStrings.card.support
                  }
                  style={({ pressed }) => [
                    styles.supportBtn,
                    stackSupport && styles.supportBtnStack,
                    request.hasSupported ? styles.supportBtnDone : styles.supportBtnReady,
                    (!canSupport && !request.hasSupported) || supporting
                      ? styles.supportBtnDisabled
                      : null,
                    pressed && canSupport && styles.supportBtnPressed,
                  ]}
                >
                  {supporting ? (
                    <ActivityIndicator animating size="small" color={saath.white} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name={request.hasSupported ? 'hand-heart' : 'hand-heart-outline'}
                        size={16}
                        color={request.hasSupported ? saath.primary : saath.white}
                      />
                      <Text
                        style={[
                          saathText.supportAction,
                          {
                            color: request.hasSupported ? saath.primary : saath.white,
                          },
                        ]}
                        numberOfLines={1}
                        maxFontSizeMultiplier={1.2}
                      >
                        {request.hasSupported
                          ? assistanceStrings.card.supported
                          : assistanceStrings.card.support}
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const HelpRequestCard = memo(HelpRequestCardComponent);

const styles = StyleSheet.create({
  pressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
  cardRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  imageWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: saath.wash,
  },
  imageFill: { width: '100%', height: '100%' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  moreBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: 'rgba(26, 28, 25, 0.72)',
  },
  moreText: {
    color: saath.white,
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 14,
  },
  ownerBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    maxWidth: 72,
    backgroundColor: saath.washStrong,
  },
  ownerText: {
    color: saath.heading,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
  content: { flex: 1, minWidth: 0, gap: 4 },
  badgeRow: { alignSelf: 'flex-start' },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  metaText: {
    color: saath.body,
    flex: 1,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  supportRowStack: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  supportCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    minHeight: 32,
    flexShrink: 0,
  },
  supportBtnStack: {
    alignSelf: 'flex-start',
  },
  supportBtnReady: {
    backgroundColor: saath.primary,
  },
  supportBtnDone: {
    backgroundColor: saath.washStrong,
  },
  supportBtnDisabled: {
    opacity: 0.7,
  },
  supportBtnPressed: {
    opacity: 0.88,
  },
});
