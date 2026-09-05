import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { strings } from '@/constants';
import { getArrivalFreshness } from '@/features/market/market.freshness';
import type { MarketPrice } from '@/features/market/market.types';
import { mp, mpRadius } from '@/features/marketplace/marketplace.ui';
import { spacing } from '@/theme';

type MarketMandiRowProps = {
  market: MarketPrice;
  isBest: boolean;
  isLowest: boolean;
  showDivider: boolean;
};

const formatPrice = (value: number): string => `₹${value.toLocaleString('en-IN')}`;

export const MarketMandiRow = memo(function MarketMandiRow({
  market,
  isBest,
  isLowest,
}: MarketMandiRowProps) {
  const freshness = useMemo(() => getArrivalFreshness(market.arrivalDate), [market.arrivalDate]);

  const freshnessLabel =
    freshness === 'today'
      ? strings.market.badgeUpdatedToday
      : freshness === 'yesterday'
        ? strings.market.badgeYesterday
        : strings.market.badgeOlderData;

  const freshnessBg =
    freshness === 'today' ? mp.produceBg : freshness === 'yesterday' ? mp.labourBg : mp.productBg;
  const freshnessColor =
    freshness === 'today'
      ? mp.headingGreen
      : freshness === 'yesterday'
        ? mp.labourTitle
        : mp.productTitle;

  const priceColor = isBest ? mp.primaryGreen : isLowest ? mp.productCta : mp.headingGreen;

  return (
    <Pressable
      accessibilityRole="text"
      accessibilityLabel={`${market.market}, ${formatPrice(market.modalPrice)}, ${freshnessLabel}`}
      style={({ pressed }) => [styles.row, isBest && styles.bestRow, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <Text numberOfLines={2} style={styles.marketName}>
          {market.market}
        </Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: freshnessBg }]}>
            <Text style={[styles.badgeText, { color: freshnessColor }]}>{freshnessLabel}</Text>
          </View>
          {isBest ? (
            <View style={[styles.badge, { backgroundColor: mp.produceBg }]}>
              <Text style={[styles.badgeText, { color: mp.headingGreen }]}>
                {strings.market.badgeBestPrice}
              </Text>
            </View>
          ) : null}
          {isLowest && !isBest ? (
            <View style={[styles.badge, { backgroundColor: mp.productBg }]}>
              <Text style={[styles.badgeText, { color: mp.productTitle }]}>
                {strings.market.badgeLow}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.caption}>
          {strings.market.minMaxInline(formatPrice(market.minPrice), formatPrice(market.maxPrice))}
        </Text>
      </View>
      <Text style={[styles.price, { color: priceColor }]}>{formatPrice(market.modalPrice)}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: mpRadius.tile,
    backgroundColor: mp.cream,
    marginBottom: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mp.cardLine,
    minHeight: 64,
  },
  bestRow: {
    backgroundColor: mp.produceBg,
    borderLeftWidth: 3,
    borderLeftColor: mp.primaryGreen,
    borderColor: mp.produceWash,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.995 }],
  },
  left: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  marketName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: mp.headingGreen,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    borderRadius: mpRadius.chip,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: mp.muted,
  },
  price: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 0,
  },
});
