import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
  type ViewStyle,
} from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { getArrivalFreshness } from '@/features/market/market.freshness';
import { translateCropName } from '@/features/market/market.translate';
import type { MarketCropCardModel } from '@/features/market/market.types';
import {
  cardSurface,
  iconSize,
  palette,
  radius,
  spacing,
  typography,
  useAppTheme,
} from '@/theme';

import { MarketMandiRow } from './MarketMandiRow';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
      ? palette.green700
      : tone === 'low'
        ? palette.orange800
        : tone === 'avg'
          ? palette.green700
          : palette.blue800;

  return (
    <View style={styles.metricCard}>
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
      ? palette.blue100
      : tone === 'today'
        ? palette.green100
        : tone === 'yesterday'
          ? palette.blue100
          : palette.amber100;
  const color =
    tone === 'gov'
      ? palette.blue800
      : tone === 'today'
        ? palette.green900
        : tone === 'yesterday'
          ? palette.blue800
          : palette.orange800;

  return (
    <View style={[styles.softBadge, { backgroundColor: bg }]}>
      <Text style={[styles.softBadgeText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});

function MarketCropCardBase({ item, expanded, onToggleExpand, onRetry }: MarketCropCardProps) {
  const theme = useAppTheme();
  const fade = useRef(new Animated.Value(item.state === 'loading' ? 0.95 : 0)).current;
  const chevron = useRef(new Animated.Value(expanded ? 1 : 0)).current;

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

  const successContent = item.data && bestMarket ? (
    <View style={styles.stateWrap}>
      <Text style={styles.eyebrow}>{strings.market.bestPriceToday}</Text>
      <Text accessibilityRole="header" style={styles.heroPrice}>
        {formatPrice(item.data.highestPrice)}
      </Text>
      <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
        {strings.market.perQuintal}
      </Text>

      <View style={styles.bestMandiBlock}>
        <Text style={styles.bestMandiLabel}>{strings.market.bestMarketToday}</Text>
        <Text numberOfLines={2} style={styles.bestMandiName}>
          {bestMarket.market}
        </Text>
        <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
          {strings.market.highestInDistrict(item.data.district || bestMarket.district)}
        </Text>
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
        <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
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
        <Text style={[styles.expandLabel, { color: theme.colors.primary }]}>
          {expanded ? strings.market.hideMarkets : strings.market.viewAllMarkets}
        </Text>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <MaterialCommunityIcons name="chevron-down" size={iconSize.md} color={theme.colors.primary} />
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
              <View style={[styles.cropIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
                <MaterialCommunityIcons name={iconName} size={iconSize.md} color={theme.colors.primary} />
              </View>
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
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: palette.steel,
    letterSpacing: 0.2,
  },
  heroPrice: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: palette.green700,
  },
  bestMandiBlock: {
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: palette.blue100,
  },
  bestMandiLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: palette.blue800,
  },
  bestMandiName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    color: palette.blue800,
  },
  metaBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  softBadge: {
    borderRadius: radius.pill,
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
    minWidth: 132,
    flexGrow: 1,
    borderRadius: radius.md,
    backgroundColor: palette.green50,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.mist,
  },
  metricLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: palette.steel,
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
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: palette.green50,
  },
  expandPressed: {
    opacity: 0.75,
  },
  expandLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  expandedList: {
    gap: 0,
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
