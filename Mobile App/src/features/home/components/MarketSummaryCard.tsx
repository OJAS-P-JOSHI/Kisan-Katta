import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback, useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { getArrivalFreshness } from '@/features/market/market.freshness';
import { getCropDisplayParts, getCropEmoji } from '@/features/market/market.translate';
import type { MarketCropCardModel } from '@/features/market/market.types';
import { iconSize, palette, radius, spacing, typography, useAppTheme } from '@/theme';

import { homeColors, homeRhythm, homeSurfaces, homeSpacing, homeText } from '../home.theme';
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
      style={({ pressed }) => [styles.rowShell, homeSurfaces.marketRow, pressed && styles.rowPressed]}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowEmoji}>{emoji}</Text>
        <View style={styles.cropTextBlock}>
          <Text style={styles.cropMr} numberOfLines={2}>
            {parts.marathi}
          </Text>
          <Text style={styles.cropEn} numberOfLines={1}>
            {parts.english}
          </Text>
          {mandi ? (
            <Text numberOfLines={2} style={styles.mandiName}>
              {mandi}
            </Text>
          ) : null}
        </View>
        <View style={styles.priceCol}>
          <Text style={[homeText.priceHero, styles.heroPrice]} numberOfLines={1}>
            {price != null ? formatPrice(price) : '—'}
          </Text>
          <View style={styles.badgeCluster}>
            <MiniBadge label={strings.home.marketBestShort} tone="best" />
            {freshness === 'today' ? (
              <MiniBadge label={strings.market.badgeUpdatedToday} tone="today" />
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
});

function SectionHeader() {
  const theme = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[homeText.sectionEyebrow, { color: homeColors.heroAccentMuted }]}>
        {strings.home.marketSubtitle}
      </Text>
      <Text style={[homeText.sectionHero, { color: theme.colors.onBackground }]} numberOfLines={2}>
        {strings.home.marketTitle}
      </Text>
    </View>
  );
}

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
    return (
      <View style={styles.wrap}>
        <SectionHeader />
        <MarketSummarySkeleton />
      </View>
    );
  }

  if (favoriteCropsCount === 0) {
    return (
      <View style={styles.wrap}>
        <SectionHeader />
        <View style={[styles.cardBody, homeSurfaces.marketHero]}>
          <Text style={[typography.body, homeText.marathiBody, { color: theme.colors.onSurfaceVariant }]}>
            {strings.home.marketNoFavourites}
          </Text>
        </View>
      </View>
    );
  }

  if (error && pricedCards.length === 0 && settled) {
    return (
      <View style={styles.wrap}>
        <SectionHeader />
        <View style={[styles.cardBody, homeSurfaces.marketHero, styles.errorRow]}>
          <MaterialCommunityIcons name="chart-line" size={iconSize.md} color={theme.colors.error} />
          <Text style={[typography.body, styles.errorText, { color: theme.colors.onSurfaceVariant }]}>
            {error}
          </Text>
          <Button compact mode="text" onPress={onRetry}>
            {strings.home.retry}
          </Button>
        </View>
      </View>
    );
  }

  const showEmpty =
    settled && favoriteCropsCount > 0 && pricedCards.length === 0 && !loading;

  return (
    <View style={styles.wrap}>
      <SectionHeader />
      <View style={[styles.cardBody, homeSurfaces.marketHero]}>
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
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: homeRhythm.utility,
    marginBottom: homeRhythm.block - homeSpacing.sectionGapTight,
  },
  sectionHeader: {
    paddingHorizontal: homeSpacing.horizontal,
    gap: 4,
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  list: { gap: spacing.sm },
  rowShell: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowPressed: {
    opacity: 0.92,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  rowEmoji: {
    fontSize: 24,
    lineHeight: 30,
    marginTop: 2,
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
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: palette.steel,
  },
  mandiName: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: palette.blue800,
  },
  priceCol: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    maxWidth: '42%',
    minWidth: 88,
  },
  heroPrice: {
    color: palette.green700,
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
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  miniBadgeText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
  },
  moreButton: {
    minHeight: 44,
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
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: { flex: 1, minWidth: 0 },
});
