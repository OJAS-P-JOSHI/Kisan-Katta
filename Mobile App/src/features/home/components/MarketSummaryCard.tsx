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
  const bg = tone === 'best' ? '#F3E8B8' : palette.green100;
  const color = tone === 'best' ? '#6B5410' : palette.green900;

  return (
    <View style={[styles.miniBadge, { backgroundColor: bg }]}>
      <Text style={[styles.miniBadgeText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});

const PricedCropRow = memo(function PricedCropRow({
  item,
  isLast,
  index,
}: {
  item: MarketCropCardModel;
  isLast: boolean;
  index: number;
}) {
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
      <View style={styles.rowMain}>
        <View style={styles.rankCol}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
        <View style={styles.emojiCircle}>
          <Text style={styles.rowEmoji}>{emoji}</Text>
        </View>
        <View style={styles.cropTextBlock}>
          <Text style={styles.cropMr} numberOfLines={2}>
            {parts.marathi}
          </Text>
          <Text style={styles.cropEn} numberOfLines={1}>
            {parts.english}
          </Text>
          {mandi ? (
            <View style={styles.mandiRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={10} color={homeColors.marketMandi} />
              <Text numberOfLines={1} style={styles.mandiName}>
                {mandi}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.priceCol}>
          <Text style={[homeText.priceHero, styles.heroPrice]} numberOfLines={1}>
            {price != null ? formatPrice(price) : '—'}
          </Text>
          <Text style={styles.perUnit}>/ क्विंटल</Text>
          <View style={styles.badgeCluster}>
            <MiniBadge label={strings.home.marketBestShort} tone="best" />
            {freshness === 'today' ? (
              <MiniBadge label={strings.market.badgeUpdatedToday} tone="today" />
            ) : null}
          </View>
        </View>
      </View>
      {!isLast ? <View style={styles.rowDivider} /> : null}
    </Pressable>
  );
});

function SectionHeader() {
  const theme = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionIcon, { backgroundColor: homeColors.heroAccentSoft }]}>
          <MaterialCommunityIcons name="chart-box-outline" size={iconSize.sm} color={homeColors.marketAccent} />
        </View>
        <View style={styles.sectionText}>
          <Text style={[homeText.sectionEyebrow, { color: homeColors.heroAccentMuted }]}>
            {strings.home.marketSubtitle}
          </Text>
          <Text style={[homeText.sectionHero, { color: theme.colors.onBackground }]} numberOfLines={2}>
            {strings.home.marketTitle}
          </Text>
        </View>
      </View>
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
          <View style={homeSurfaces.marketAccentBar} />
          <Text style={[typography.body, homeText.marathiBody, styles.bodyPad, { color: theme.colors.onSurfaceVariant }]}>
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
        <View style={[styles.cardBody, homeSurfaces.marketHero]}>
          <View style={homeSurfaces.marketAccentBar} />
          <View style={[styles.bodyPad, styles.errorInner]}>
            <MaterialCommunityIcons name="chart-line" size={iconSize.md} color={theme.colors.error} />
            <Text style={[typography.body, styles.errorText, { color: theme.colors.onSurfaceVariant }]}>
              {error}
            </Text>
            <Button compact mode="text" onPress={onRetry}>
              {strings.home.retry}
            </Button>
          </View>
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
        <View style={homeSurfaces.marketAccentBar} />
        {showEmpty ? (
          <View style={[styles.emptyBlock, styles.bodyPad]}>
            <Text style={[typography.body, { color: theme.colors.onSurface }]}>
              {strings.home.marketNoPricesMr}
            </Text>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
              {strings.home.marketNoPricesEn}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleCards.map((item, index) => (
              <PricedCropRow
                key={item.crop}
                item={item}
                index={index}
                isLast={index === visibleCards.length - 1 && hiddenCount === 0}
              />
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
  },
  sectionHeader: {
    paddingHorizontal: homeSpacing.horizontal,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cardBody: {
    gap: 0,
    overflow: 'hidden',
  },
  bodyPad: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  list: {},
  rowShell: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: 0,
  },
  rowPressed: {
    opacity: 0.92,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingBottom: spacing.sm + 2,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: homeColors.divider,
    marginLeft: 56,
  },
  rankCol: {
    width: 14,
    paddingTop: 10,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 10,
    fontWeight: '700',
    color: homeColors.inkMuted,
    lineHeight: 12,
  },
  emojiCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: homeColors.sandInset,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rowEmoji: {
    fontSize: 17,
    lineHeight: 20,
  },
  cropTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 1,
    paddingTop: 2,
  },
  cropMr: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: palette.ink,
    letterSpacing: -0.15,
  },
  cropEn: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
    color: palette.steel,
  },
  mandiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
    minWidth: 0,
  },
  mandiName: {
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: homeColors.marketMandi,
  },
  priceCol: {
    alignItems: 'flex-end',
    gap: 2,
    maxWidth: '38%',
    minWidth: 84,
  },
  heroPrice: {
    color: homeColors.marketPrice,
    textAlign: 'right',
  },
  perUnit: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '600',
    color: homeColors.inkMuted,
    letterSpacing: 0.2,
  },
  badgeCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  miniBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  miniBadgeText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
  },
  moreButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: homeColors.heroAccentSoft,
  },
  morePressed: { opacity: 0.7 },
  moreText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBlock: { gap: spacing.xs },
  errorInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: { flex: 1, minWidth: 0 },
});
