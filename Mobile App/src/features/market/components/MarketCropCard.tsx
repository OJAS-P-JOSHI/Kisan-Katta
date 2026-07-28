import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Divider, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { cardSurface, iconSize, palette, radius, spacing, typography, useAppTheme } from '@/theme';

import { translateCropName } from '../market.translate';
import type { MarketPrice } from '../market.types';

export type MarketCropCardState = 'loading' | 'success' | 'empty' | 'error';

export type MarketCropCardModel = {
  crop: string;
  state: MarketCropCardState;
  data: MarketPrice | null;
  error: string | null;
  isRefreshing: boolean;
  lastUpdatedAt: number | null;
};

type MarketCropCardProps = {
  item: MarketCropCardModel;
  onRetry: (crop: string) => void;
};

const formatPrice = (value: number): string => `₹${value.toLocaleString('en-IN')}`;

const formatLastUpdated = (timestamp: number | null): string => {
  if (!timestamp) return strings.market.cardJustNow;
  return new Date(timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getCropIcon = (crop: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const value = crop.toLowerCase();
  if (value.includes('onion')) return 'food-apple-outline';
  if (value.includes('tomato')) return 'fruit-cherries';
  if (value.includes('banana')) return 'food-apple-outline';
  if (value.includes('wheat') || value.includes('gram') || value.includes('grain')) return 'barley';
  if (value.includes('turmeric')) return 'leaf-circle-outline';
  if (value.includes('cotton')) return 'flower-pollen-outline';
  return 'sprout';
};

const SkeletonBox = memo(function SkeletonBox({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 850, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 850, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ backgroundColor: palette.mist, borderRadius: radius.md, opacity }, style]}
    />
  );
});

function MarketCropCardBase({ item, onRetry }: MarketCropCardProps) {
  const theme = useAppTheme();
  const fade = useRef(new Animated.Value(item.state === 'loading' ? 0.95 : 0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [fade, item.state, item.isRefreshing, item.data, item.error]);

  const iconName = useMemo(() => getCropIcon(item.crop), [item.crop]);
  const cropDisplayName = useMemo(() => translateCropName(item.crop), [item.crop]);
  const handleRetryPress = useCallback(() => {
    onRetry(item.crop);
  }, [item.crop, onRetry]);

  const loadingContent = (
    <View style={styles.stateWrap} accessibilityLabel={strings.market.a11yLoading(cropDisplayName)}>
      <SkeletonBox style={styles.skeletonPrimary} />
      <View style={styles.skeletonRow}>
        <SkeletonBox style={styles.skeletonSmall} />
        <SkeletonBox style={styles.skeletonSmall} />
      </View>
      <SkeletonBox style={styles.skeletonMeta} />
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text
          numberOfLines={2}
          style={[typography.caption, styles.flexText, { color: theme.colors.onSurfaceVariant }]}
        >
          {strings.market.loadingLatestPrices}
        </Text>
      </View>
    </View>
  );

  const successContent = item.data ? (
    <View style={styles.stateWrap}>
      <View style={styles.locationRow}>
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={iconSize.sm}
          color={theme.colors.onSurfaceVariant}
        />
        <Text
          numberOfLines={2}
          style={[typography.body, styles.flexText, { color: theme.colors.onSurfaceVariant }]}
        >
          {item.data.market}, {item.data.district}
        </Text>
      </View>

      <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

      <View style={styles.modalPriceBlock}>
        <Text
          numberOfLines={2}
          style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}
        >
          {strings.market.modalPriceLabel}
        </Text>
        <Text style={[typography.mediumHeading, { color: theme.colors.primary }]}>
          {formatPrice(item.data.modalPrice)}
        </Text>
        <Text
          numberOfLines={1}
          style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}
        >
          {strings.market.perQuintal}
        </Text>
      </View>

      <View style={styles.minMaxRow}>
        <View style={styles.minMaxItem}>
          <Text
            numberOfLines={2}
            style={[typography.caption, styles.priceLabel, { color: theme.colors.onSurfaceVariant }]}
          >
            {strings.market.minPriceLabel}
          </Text>
          <Text style={[typography.sectionTitle, styles.priceValue]}>
            {formatPrice(item.data.minPrice)}
          </Text>
        </View>
        <View style={styles.minMaxItem}>
          <Text
            numberOfLines={2}
            style={[typography.caption, styles.priceLabel, { color: theme.colors.onSurfaceVariant }]}
          >
            {strings.market.maxPriceLabel}
          </Text>
          <Text style={[typography.sectionTitle, styles.priceValue]}>
            {formatPrice(item.data.maxPrice)}
          </Text>
        </View>
      </View>

      <View style={styles.metaBlock}>
        <Text
          numberOfLines={2}
          style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}
        >
          {strings.market.arrivalDateLabel}: {item.data.arrivalDate}
        </Text>
        <Chip compact mode="flat" style={styles.sourceChip} textStyle={styles.sourceChipText}>
          {strings.market.governmentSourceShort}
        </Chip>
      </View>
    </View>
  ) : null;

  const emptyContent = (
    <View style={styles.stateWrap} accessibilityLabel={strings.market.a11yNoData(cropDisplayName)}>
      <Text style={[typography.body, { color: theme.colors.onSurface }]}>
        {strings.market.cardNoDataTitle}
      </Text>
      <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
        {strings.market.cardNoDataDescription}
      </Text>
      <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
        {strings.market.cardNoDataSecondary}
      </Text>
    </View>
  );

  const errorContent = (
    <View style={styles.stateWrap} accessibilityLabel={strings.market.a11yError(cropDisplayName)}>
      <Text style={[typography.body, { color: theme.colors.onSurface }]}>
        {strings.market.cardErrorTitle}
      </Text>
      <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
        {item.error || strings.market.cardErrorDescription}
      </Text>
      <Button
        mode="contained-tonal"
        onPress={handleRetryPress}
        accessibilityLabel={strings.market.a11yRetry(cropDisplayName)}
        style={styles.retryButton}
        contentStyle={styles.retryButtonContent}
      >
        {strings.market.retry}
      </Button>
    </View>
  );

  return (
    <Animated.View style={{ opacity: fade }} accessible accessibilityLiveRegion="polite">
      <Card style={[styles.card, cardSurface, { backgroundColor: theme.colors.surface }]} mode="elevated">
        <Card.Content style={styles.cardContent}>
          <View style={styles.headerRow}>
            <View style={styles.cropHeader}>
              <MaterialCommunityIcons name={iconName} size={iconSize.md} color={theme.colors.primary} />
              <Text
                numberOfLines={2}
                style={[typography.sectionTitle, styles.cropTitle, { color: theme.colors.onSurface }]}
                accessibilityRole="header"
              >
                {cropDisplayName}
              </Text>
            </View>
            {item.isRefreshing ? (
              <View style={styles.refreshingTag} accessibilityLabel={strings.market.cardRefreshing}>
                <ActivityIndicator size={12} color={theme.colors.primary} />
              </View>
            ) : null}
          </View>

          {item.state === 'loading' ? loadingContent : null}
          {item.state === 'success' ? successContent : null}
          {item.state === 'empty' ? emptyContent : null}
          {item.state === 'error' ? errorContent : null}

          <Text
            numberOfLines={1}
            style={[typography.caption, styles.updatedRow, { color: theme.colors.onSurfaceVariant }]}
          >
            {strings.market.cardLastUpdated}: {formatLastUpdated(item.lastUpdatedAt)}
          </Text>
        </Card.Content>
      </Card>
    </Animated.View>
  );
}

const areEqual = (prev: MarketCropCardProps, next: MarketCropCardProps): boolean => {
  const p = prev.item;
  const n = next.item;
  return (
    p.crop === n.crop &&
    p.state === n.state &&
    p.data === n.data &&
    p.error === n.error &&
    p.isRefreshing === n.isRefreshing &&
    p.lastUpdatedAt === n.lastUpdatedAt &&
    prev.onRetry === next.onRetry
  );
};

export const MarketCropCard = memo(MarketCropCardBase, areEqual);

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  cardContent: {
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  cropTitle: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  flexText: {
    flex: 1,
    minWidth: 0,
  },
  refreshingTag: {
    paddingTop: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  stateWrap: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  skeletonPrimary: { height: 20, width: '82%' },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  skeletonSmall: { height: 16, width: '36%' },
  skeletonMeta: { height: 14, width: '58%' },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  modalPriceBlock: {
    gap: 2,
  },
  minMaxRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  minMaxItem: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  priceLabel: {
    flexShrink: 1,
  },
  priceValue: {
    fontSize: 15,
  },
  metaBlock: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  sourceChip: {
    borderRadius: radius.pill,
    maxWidth: '100%',
    alignSelf: 'flex-start',
  },
  sourceChipText: {
    fontSize: 11,
    lineHeight: 14,
  },
  updatedRow: {
    marginTop: spacing.xs,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  retryButtonContent: {
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
});
