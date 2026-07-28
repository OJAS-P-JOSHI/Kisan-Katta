import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { strings } from '@/constants';
import { getArrivalFreshness } from '@/features/market/market.freshness';
import type { MarketPrice } from '@/features/market/market.types';
import { palette, radius, spacing, typography, useAppTheme } from '@/theme';

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
  const theme = useAppTheme();
  const freshness = useMemo(() => getArrivalFreshness(market.arrivalDate), [market.arrivalDate]);

  const freshnessLabel =
    freshness === 'today'
      ? strings.market.badgeUpdatedToday
      : freshness === 'yesterday'
        ? strings.market.badgeYesterday
        : strings.market.badgeOlderData;

  const freshnessBg =
    freshness === 'today'
      ? palette.green100
      : freshness === 'yesterday'
        ? palette.blue100
        : palette.amber100;
  const freshnessColor =
    freshness === 'today'
      ? palette.green900
      : freshness === 'yesterday'
        ? palette.blue800
        : palette.orange800;

  const priceColor = isBest
    ? palette.green700
    : isLowest
      ? palette.orange800
      : palette.green900;

  return (
    <Pressable
      accessibilityRole="text"
      accessibilityLabel={`${market.market}, ${formatPrice(market.modalPrice)}, ${freshnessLabel}`}
      style={({ pressed }) => [
        styles.row,
        isBest && styles.bestRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.left}>
        <Text numberOfLines={2} style={[styles.marketName, { color: theme.colors.onSurface }]}>
          {market.market}
        </Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: freshnessBg }]}>
            <Text style={[styles.badgeText, { color: freshnessColor }]}>{freshnessLabel}</Text>
          </View>
          {isBest ? (
            <View style={[styles.badge, { backgroundColor: palette.green100 }]}>
              <Text style={[styles.badgeText, { color: palette.green900 }]}>
                {strings.market.badgeBestPrice}
              </Text>
            </View>
          ) : null}
          {isLowest && !isBest ? (
            <View style={[styles.badge, { backgroundColor: palette.amber100 }]}>
              <Text style={[styles.badgeText, { color: palette.orange800 }]}>
                {strings.market.badgeLow}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
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
    borderRadius: radius.md,
    backgroundColor: palette.sand,
    marginBottom: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.mist,
    minHeight: 64,
  },
  bestRow: {
    backgroundColor: palette.green50,
    borderLeftWidth: 3,
    borderLeftColor: palette.green700,
    borderColor: palette.green100,
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
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
  },
  price: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 0,
  },
});
