import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { translateCropName } from '@/features/market/market.translate';
import type { MarketCropCardModel } from '@/features/market/components/MarketCropCard';
import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

import { MarketSummarySkeleton } from './MarketSummarySkeleton';

type MarketSummaryCardProps = {
  pricedCards: MarketCropCardModel[];
  favoriteCropsCount: number;
  loading: boolean;
  settled: boolean;
  error: string | null;
  onRetry: () => void;
};

const formatPrice = (value: number): string => `₹${value.toLocaleString('en-IN')}`;

const PricedCropRow = memo(function PricedCropRow({ item }: { item: MarketCropCardModel }) {
  const theme = useAppTheme();
  const label = useMemo(() => translateCropName(item.crop), [item.crop]);
  const price = item.data?.modalPrice;

  return (
    <View style={styles.row}>
      <Text
        numberOfLines={2}
        style={[typography.body, styles.cropName, { color: theme.colors.onSurface }]}
      >
        {label}
      </Text>
      <Text style={[typography.sectionTitle, { color: theme.colors.primary }]}>
        {price != null ? formatPrice(price) : '—'}
      </Text>
    </View>
  );
});

/**
 * Home market summary — renders only favourite crops that have a valid market price.
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
            {pricedCards.map((item) => (
              <PricedCropRow key={item.crop} item={item} />
            ))}
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
  divider: { marginVertical: spacing.sm },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cropName: { flex: 1, minWidth: 0 },
  emptyBlock: { gap: spacing.xs },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: { flex: 1, minWidth: 0 },
});
