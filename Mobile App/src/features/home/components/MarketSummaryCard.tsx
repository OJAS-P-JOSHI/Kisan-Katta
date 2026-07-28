import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';

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

import { MarketSummarySkeleton } from './MarketSummarySkeleton';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HOME_VISIBLE_CROP_COUNT = 4;

type MarketSummaryCardProps = {
  pricedCards: MarketCropCardModel[];
  favoriteCropsCount: number;
  loading: boolean;
  settled: boolean;
  error: string | null;
  onRetry: () => void;
};

const formatPrice = (value: number): string => `₹${value.toLocaleString('en-IN')}`;

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

const MiniBadge = memo(function MiniBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'best' | 'today' | 'gov' | 'neutral';
}) {
  const bg =
    tone === 'best'
      ? palette.green100
      : tone === 'today'
        ? palette.green50
        : tone === 'gov'
          ? palette.blue100
          : palette.mist;
  const color =
    tone === 'best'
      ? palette.green900
      : tone === 'today'
        ? palette.green700
        : tone === 'gov'
          ? palette.blue800
          : palette.slate;

  return (
    <View style={[styles.miniBadge, { backgroundColor: bg }]}>
      <Text style={[styles.miniBadgeText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});

const PricedCropRow = memo(function PricedCropRow({ item }: { item: MarketCropCardModel }) {
  const theme = useAppTheme();
  const label = useMemo(() => translateCropName(item.crop), [item.crop]);
  const iconName = useMemo(() => getCropIcon(item.crop), [item.crop]);
  const price = item.data?.highestPrice;
  const mandi = item.data?.markets[0]?.market;
  const freshness = useMemo(() => {
    const arrival = item.data?.markets[0]?.arrivalDate;
    return arrival ? getArrivalFreshness(arrival) : null;
  }, [item.data]);

  return (
    <View style={[styles.rowShell, { backgroundColor: palette.green50 }]}>
      <View style={styles.rowLeft}>
        <View style={[styles.cropIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons name={iconName} size={iconSize.sm} color={theme.colors.primary} />
        </View>
        <Text numberOfLines={2} style={[styles.cropName, { color: theme.colors.onSurface }]}>
          {label}
        </Text>
      </View>

      <Text style={styles.heroPrice} numberOfLines={1}>
        {price != null ? formatPrice(price) : '—'}
      </Text>

      <View style={styles.rowRight}>
        {mandi ? (
          <Text numberOfLines={2} style={styles.mandiName}>
            {mandi}
          </Text>
        ) : null}
        <View style={styles.badgeCluster}>
          <MiniBadge label={strings.home.marketBestShort} tone="best" />
          {freshness === 'today' ? (
            <MiniBadge label={strings.market.badgeUpdatedToday} tone="today" />
          ) : null}
        </View>
      </View>
    </View>
  );
});

/**
 * Home market summary — presentation only.
 * Data comes from the shared Market favourites store (no Home-specific API).
 */
export const MarketSummaryCard = memo(function MarketSummaryCard({
  pricedCards,
  favoriteCropsCount,
  loading,
  settled,
  error,
  onRetry,
}: MarketSummaryCardProps) {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);

  const hiddenCount = Math.max(0, pricedCards.length - HOME_VISIBLE_CROP_COUNT);
  const visibleCards =
    expanded || hiddenCount === 0 ? pricedCards : pricedCards.slice(0, HOME_VISIBLE_CROP_COUNT);

  const handleToggleMore = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((value) => !value);
  }, []);

  if (loading && pricedCards.length === 0) {
    return <MarketSummarySkeleton />;
  }

  if (favoriteCropsCount === 0) {
    return (
      <Card mode="elevated" style={[styles.card, cardSurface]}>
        <Card.Content>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons name="chart-line" size={iconSize.md} color={theme.colors.primary} />
            </View>
            <View style={styles.titleBlock}>
              <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>
                {strings.home.marketTitle}
              </Text>
              <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
                {strings.home.marketSubtitle}
              </Text>
            </View>
          </View>
          <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
          <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
            {strings.home.marketNoFavourites}
          </Text>
        </Card.Content>
      </Card>
    );
  }

  if (error && pricedCards.length === 0 && settled) {
    return (
      <Card mode="elevated" style={[styles.card, cardSurface]}>
        <Card.Content style={styles.errorContent}>
          <MaterialCommunityIcons name="chart-line" size={iconSize.md} color={theme.colors.error} />
          <Text style={[typography.body, styles.errorText, { color: theme.colors.onSurfaceVariant }]}>
            {error}
          </Text>
          <Button compact mode="text" onPress={onRetry}>
            {strings.home.retry}
          </Button>
        </Card.Content>
      </Card>
    );
  }

  const showEmpty =
    settled && favoriteCropsCount > 0 && pricedCards.length === 0 && !loading;

  return (
    <Card mode="elevated" style={[styles.card, cardSurface]}>
      <Card.Content>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="chart-line" size={iconSize.md} color={theme.colors.primary} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>
              {strings.home.marketTitle}
            </Text>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
              {strings.home.marketSubtitle}
            </Text>
          </View>
        </View>

        <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

        {showEmpty ? (
          <View style={styles.emptyBlock}>
            <Text style={[typography.body, { color: theme.colors.onSurface }]}>
              {strings.home.marketNoPricesMr}
            </Text>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
              {strings.home.marketNoPricesEn}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleCards.map((item) => (
              <PricedCropRow key={item.crop} item={item} />
            ))}
            {hiddenCount > 0 ? (
              <Pressable
                onPress={handleToggleMore}
                accessibilityRole="button"
                accessibilityLabel={
                  expanded ? strings.home.marketShowLess : strings.home.marketMoreCrops(hiddenCount)
                }
                style={({ pressed }) => [styles.moreButton, pressed && styles.morePressed]}
                hitSlop={8}
              >
                <Text style={[styles.moreText, { color: theme.colors.primary }]}>
                  {expanded ? strings.home.marketShowLess : strings.home.marketMoreCrops(hiddenCount)}
                </Text>
                <MaterialCommunityIcons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={iconSize.sm}
                  color={theme.colors.primary}
                />
              </Pressable>
            ) : null}
          </View>
        )}
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1, gap: 2, minWidth: 0 },
  divider: { marginVertical: spacing.md },
  list: { gap: spacing.sm },
  rowShell: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.mist,
  },
  rowLeft: {
    flex: 1.15,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cropIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropName: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  heroPrice: {
    flexShrink: 0,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    color: palette.green700,
    letterSpacing: -0.3,
    minWidth: 72,
    textAlign: 'center',
  },
  rowRight: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
    gap: 4,
  },
  mandiName: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: palette.blue800,
    textAlign: 'right',
  },
  badgeCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
  },
  miniBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  miniBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
  },
  moreButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  morePressed: { opacity: 0.7 },
  moreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyBlock: { gap: spacing.xs },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: { flex: 1, minWidth: 0 },
});
