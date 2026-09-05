import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { getArrivalFreshness } from '@/features/market/market.freshness';
import { translateCropName } from '@/features/market/market.translate';
import type { MarketCropCardModel } from '@/features/market/market.types';
import { mp, mpCard, mpRadius } from '@/features/marketplace/marketplace.ui';
import { iconSize, spacing } from '@/theme';

import { MarketMandiRow } from './MarketMandiRow';

export type { MarketCropCardModel } from '@/features/market/market.types';
export type { MarketCropCardState } from '@/features/market/market.types';

type MarketCropCardProps = {
  item: MarketCropCardModel;
  expanded: boolean;
  onToggleExpand: (crop: string) => void;
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
  const [opacity] = useState(() => new Animated.Value(0.35));

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
      style={[{ backgroundColor: mp.produceWash, borderRadius: mpRadius.control, opacity }, style]}
    />
  );
});

const METRIC_ICONS = {
  high: 'trending-up',
  low: 'trending-down',
  avg: 'chart-bar',
  count: 'storefront-outline',
} as const;

const SummaryMetric = memo(function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'high' | 'low' | 'avg' | 'count';
}) {
  const valueColor =
    tone === 'high'
      ? mp.primaryGreen
      : tone === 'low'
        ? mp.productCta
        : tone === 'avg'
          ? mp.headingGreen
          : mp.labourTitle;

  return (
    <View style={styles.metricCard}>
      <MaterialCommunityIcons name={METRIC_ICONS[tone]} size={16} color={valueColor} />
      <Text numberOfLines={2} style={styles.metricLabel}>
        {label}
      </Text>
      <Text style={[styles.metricValue, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
});

const SoftBadge = memo(function SoftBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'gov' | 'today' | 'yesterday' | 'older';
}) {
  const bg =
    tone === 'gov'
      ? mp.labourBg
      : tone === 'today'
        ? mp.produceBg
        : tone === 'yesterday'
          ? mp.labourBg
          : mp.productBg;
  const color =
    tone === 'gov'
      ? mp.labourTitle
      : tone === 'today'
        ? mp.headingGreen
        : tone === 'yesterday'
          ? mp.labourTitle
          : mp.productTitle;

  return (
    <View style={[styles.softBadge, { backgroundColor: bg }]}>
      <Text style={[styles.softBadgeText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});

function MarketCropCardBase({ item, expanded, onToggleExpand, onRetry }: MarketCropCardProps) {
  const [fade] = useState(() => new Animated.Value(item.state === 'loading' ? 0.95 : 0));
  const [chevron] = useState(() => new Animated.Value(expanded ? 1 : 0));

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [fade, item.state, item.isRefreshing, item.data, item.error]);

  useEffect(() => {
    Animated.timing(chevron, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [chevron, expanded]);

  const iconName = useMemo(() => getCropIcon(item.crop), [item.crop]);
  const cropDisplayName = useMemo(() => translateCropName(item.crop), [item.crop]);

  const bestMarket = item.data?.markets[0] ?? null;
  const freshness = useMemo(
    () => (bestMarket ? getArrivalFreshness(bestMarket.arrivalDate) : 'older'),
    [bestMarket],
  );

  const handleRetryPress = useCallback(() => {
    onRetry(item.crop);
  }, [item.crop, onRetry]);

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(240, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity),
    );
    onToggleExpand(item.crop);
  }, [item.crop, onToggleExpand]);

  const chevronRotate = chevron.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const loadingContent = (
    <View style={styles.stateWrap} accessibilityLabel={strings.market.a11yLoading(cropDisplayName)}>
      <SkeletonBox style={styles.skeletonPrimary} />
      <SkeletonBox style={styles.skeletonPrice} />
      <View style={styles.skeletonRow}>
        <SkeletonBox style={styles.skeletonSmall} />
        <SkeletonBox style={styles.skeletonSmall} />
      </View>
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={mp.primaryGreen} />
        <Text
          numberOfLines={2}
          style={[styles.caption, styles.flexText]}
        >
          {strings.market.loadingLatestPrices}
        </Text>
      </View>
    </View>
  );

  const successContent = item.data && bestMarket ? (
    <View style={styles.stateWrap}>
      <Text style={styles.eyebrow}>{strings.market.bestPriceToday}</Text>
      <Text accessibilityRole="header" style={styles.heroPrice}>
        {formatPrice(item.data.highestPrice)}
      </Text>
      <Text style={[styles.caption, { color: mp.muted }]}>
        {strings.market.perQuintal}
      </Text>

      <View style={styles.bestMandiBlock}>
        <View style={styles.bestMandiIcon}>
          <MaterialCommunityIcons name="trophy-outline" size={16} color={mp.labourTitle} />
        </View>
        <View style={styles.bestMandiCopy}>
          <Text style={styles.bestMandiLabel}>{strings.market.bestMarketToday}</Text>
          <Text numberOfLines={2} style={styles.bestMandiName}>
            {bestMarket.market}
          </Text>
          <Text style={styles.caption}>
            {strings.market.highestInDistrict(item.data.district || bestMarket.district)}
          </Text>
        </View>
      </View>

      <View style={styles.metaBadges}>
        <SoftBadge label={strings.market.governmentBadgeShort} tone="gov" />
        <SoftBadge
          label={
            freshness === 'today'
              ? strings.market.badgeUpdatedToday
              : freshness === 'yesterday'
                ? strings.market.badgeYesterday
                : strings.market.badgeOlderData
          }
          tone={freshness === 'today' ? 'today' : freshness === 'yesterday' ? 'yesterday' : 'older'}
        />
        <Text style={styles.caption}>
          {strings.market.marketsAvailable(item.data.marketCount)}
        </Text>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryMetric
          label={strings.market.summaryHighest}
          value={formatPrice(item.data.highestPrice)}
          tone="high"
        />
        <SummaryMetric
          label={strings.market.summaryLowest}
          value={formatPrice(item.data.lowestPrice)}
          tone="low"
        />
        <SummaryMetric
          label={strings.market.summaryAverage}
          value={formatPrice(item.data.averageModalPrice)}
          tone="avg"
        />
        <SummaryMetric
          label={strings.market.summaryMarkets}
          value={String(item.data.marketCount)}
          tone="count"
        />
      </View>

      <Pressable
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={
          expanded
            ? strings.market.a11yCollapse(cropDisplayName)
            : strings.market.a11yExpand(cropDisplayName)
        }
        style={({ pressed }) => [styles.expandButton, pressed && styles.expandPressed]}
        hitSlop={8}
      >
        <Text style={[styles.expandLabel, { color: mp.primaryGreen }]}>
          {expanded ? strings.market.hideMarkets : strings.market.viewAllMarkets}
        </Text>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <MaterialCommunityIcons name="chevron-down" size={iconSize.md} color={mp.primaryGreen} />
        </Animated.View>
      </Pressable>

      {expanded ? (
        <View style={styles.expandedList}>
          {item.data.markets.map((market, index) => (
            <MarketMandiRow
              key={`${market.market}-${market.arrivalDate}-${index}`}
              market={market}
              isBest={index === 0}
              isLowest={index === item.data!.markets.length - 1 && item.data!.markets.length > 1}
              showDivider={false}
            />
          ))}
        </View>
      ) : null}
    </View>
  ) : null;

  const emptyContent = (
    <View style={styles.stateWrap} accessibilityLabel={strings.market.a11yNoData(cropDisplayName)}>
      <Text style={styles.bodyText}>
        {strings.market.cardNoDataTitle}
      </Text>
      <Text style={styles.caption}>
        {strings.market.cardNoDataDescription}
      </Text>
      <Text style={styles.caption}>
        {strings.market.cardNoDataSecondary}
      </Text>
    </View>
  );

  const errorContent = (
    <View style={styles.stateWrap} accessibilityLabel={strings.market.a11yError(cropDisplayName)}>
      <Text style={styles.bodyText}>
        {strings.market.cardErrorTitle}
      </Text>
      <Text style={styles.caption}>
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
      <View style={[styles.card, mpCard]}>
        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <View style={styles.cropHeader}>
              <View style={styles.cropIconWrap}>
                <MaterialCommunityIcons name={iconName} size={iconSize.md} color={mp.primaryGreen} />
              </View>
              <Text
                numberOfLines={2}
                style={styles.cropTitle}
                accessibilityRole="header"
              >
                {cropDisplayName}
              </Text>
            </View>
            {item.isRefreshing ? (
              <View style={styles.refreshingTag} accessibilityLabel={strings.market.cardRefreshing}>
                <ActivityIndicator size={12} color={mp.primaryGreen} />
              </View>
            ) : null}
          </View>

          {item.state === 'loading' ? loadingContent : null}
          {item.state === 'success' ? successContent : null}
          {item.state === 'empty' ? emptyContent : null}
          {item.state === 'error' ? errorContent : null}

          <Text numberOfLines={1} style={styles.updatedRow}>
            {strings.market.cardLastUpdated}: {formatLastUpdated(item.lastUpdatedAt)}
          </Text>
        </View>
      </View>
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
    prev.expanded === next.expanded &&
    prev.onRetry === next.onRetry &&
    prev.onToggleExpand === next.onToggleExpand
  );
};

export const MarketCropCard = memo(MarketCropCardBase, areEqual);

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  cardContent: {
    padding: 14,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  cropIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mp.produceWash,
    flexShrink: 0,
  },
  cropTitle: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: mp.headingGreen,
  },
  flexText: {
    flex: 1,
    minWidth: 0,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: mp.muted,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: mp.headingGreen,
  },
  refreshingTag: {
    paddingTop: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  stateWrap: {
    gap: spacing.md,
  },
  skeletonPrimary: { height: 18, width: '70%' },
  skeletonPrice: { height: 36, width: '48%' },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  skeletonSmall: { height: 16, width: '36%' },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: mp.muted,
    letterSpacing: 0.2,
  },
  heroPrice: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: mp.primaryGreen,
  },
  bestMandiBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: mpRadius.tile,
    backgroundColor: mp.labourBg,
  },
  bestMandiIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mp.labourWash,
    flexShrink: 0,
  },
  bestMandiCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  bestMandiLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: mp.labourTitle,
  },
  bestMandiName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: mp.labourTitle,
  },
  metaBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  softBadge: {
    borderRadius: mpRadius.chip,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  softBadgeText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '47%',
    flexGrow: 1,
    borderRadius: mpRadius.tile,
    backgroundColor: mp.produceBg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: mp.muted,
  },
  metricValue: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  expandButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: mpRadius.chip,
    backgroundColor: mp.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 106, 44, 0.18)',
  },
  expandPressed: {
    opacity: 0.75,
  },
  expandLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  expandedList: {
    gap: 0,
  },
  updatedRow: {
    marginTop: spacing.xs,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: mp.muted,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    borderRadius: mpRadius.control,
  },
  retryButtonContent: {
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
});
