import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback, useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { getArrivalFreshness } from '@/features/market/market.freshness';
import { getCropDisplayParts, getCropEmoji } from '@/features/market/market.translate';
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

const MiniBadge = memo(function MiniBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'best' | 'today';
}) {
  const bg = tone === 'best' ? '#F5E6A8' : palette.green100;
  const color = tone === 'best' ? '#7A6210' : palette.green900;

  return (
    <View style={[styles.miniBadge, { backgroundColor: bg }]}>
      <Text style={[styles.miniBadgeText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});

const PricedCropRow = memo(function PricedCropRow({ item }: { item: MarketCropCardModel }) {
  const parts = useMemo(() => getCropDisplayParts(item.crop), [item.crop]);
  const emoji = useMemo(() => getCropEmoji(item.crop), [item.crop]);
  const price = item.data?.highestPrice;
  const mandi = item.data?.markets[0]?.market;
  const freshness = useMemo(() => {
    const arrival = item.data?.markets[0]?.arrivalDate;
    return arrival ? getArrivalFreshness(arrival) : null;
  }, [item.data]);

  return (
    <Pressable
      accessibilityRole="text"
      style={({ pressed }) => [styles.rowShell, pressed && styles.rowPressed]}
    >
      <View style={styles.rowTop}>
        <Text style={styles.rowEmoji}>{emoji}</Text>
        <View style={styles.cropTextBlock}>
          <Text style={styles.cropMr} numberOfLines={2}>
            {parts.marathi}
          </Text>
          <Text style={styles.cropEn} numberOfLines={2}>
            {parts.english}
          </Text>
        </View>
        <View style={styles.badgeCluster}>
          <MiniBadge label={strings.home.marketBestShort} tone="best" />
          {freshness === 'today' ? (
            <MiniBadge label={strings.market.badgeUpdatedToday} tone="today" />
          ) : null}
        </View>
      </View>

      <Text style={styles.heroPrice} numberOfLines={1}>
        {price != null ? formatPrice(price) : '—'}
      </Text>

      {mandi ? (
        <Text numberOfLines={2} style={styles.mandiName}>
          {mandi}
        </Text>
      ) : null}
    </Pressable>
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

  const cardHeader = (
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
  );

  if (favoriteCropsCount === 0) {
    return (
      <Card mode="elevated" style={[styles.card, cardSurface]}>
        <Card.Content style={styles.content}>
          {cardHeader}
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
      <Card.Content style={styles.content}>
        {cardHeader}

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
    marginBottom: spacing.lg,
  },
  content: {
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1, gap: 3, minWidth: 0 },
  divider: { marginVertical: spacing.md },
  list: { gap: spacing.md },
  rowShell: {
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    backgroundColor: palette.green50,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.green100,
  },
  rowPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  rowEmoji: {
    fontSize: 22,
    lineHeight: 28,
    marginTop: 1,
  },
  cropTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cropMr: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: palette.ink,
    letterSpacing: -0.2,
  },
  cropEn: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: palette.steel,
  },
  heroPrice: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: palette.green700,
    letterSpacing: -0.6,
  },
  mandiName: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: palette.blue800,
  },
  badgeCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
    maxWidth: '36%',
  },
  miniBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  miniBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  moreButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: palette.green50,
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
    paddingVertical: spacing.sm,
  },
  errorText: { flex: 1, minWidth: 0 },
});
