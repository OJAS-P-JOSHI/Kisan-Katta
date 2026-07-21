import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Chip, Divider, Text } from 'react-native-paper';

import { EmptyState } from '@/components/EmptyState';
import { OrganicBackground } from '@/components/OrganicBackground';
import { strings } from '@/constants';
import {
  cardSurface,
  iconSize,
  spacing,
  typography,
  useAppTheme,
} from '@/theme';

import { getMarketErrorMessage } from './market.errors';
import { getFavouriteMarketPrices } from './market.service';
import type { MarketPrice } from './market.types';

const formatPrice = (value: number): string => `\u20B9${value.toLocaleString('en-IN')}`;

const getItemKey = (item: MarketPrice, index: number): string =>
  `${item.commodity}-${item.market}-${item.variety}-${item.arrivalDate}-${index}`;

export default function MarketScreen() {
  const theme = useAppTheme();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setError(null);
      const data = await getFavouriteMarketPrices();
      setPrices(data);
    } catch (err) {
      setError(getMarketErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    fetchPrices().finally(() => setLoading(false));
  }, [fetchPrices]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPrices().finally(() => setRefreshing(false));
  }, [fetchPrices]);

  const renderItem = useCallback(
    ({ item }: { item: MarketPrice }) => (
      <Card style={[styles.card, cardSurface, { backgroundColor: theme.colors.surface }]} mode="elevated">
        <Card.Content>
          <View style={styles.headerRow}>
            <Text style={[typography.sectionTitle, { color: theme.colors.onSurface, flex: 1 }]}>
              {item.commodity}
            </Text>
            <Chip compact mode="outlined" style={styles.gradeChip} textStyle={styles.gradeChipText}>
              {item.grade}
            </Chip>
          </View>

          <View style={styles.locationRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={iconSize.sm}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              numberOfLines={1}
              style={[typography.body, styles.locationText, { color: theme.colors.onSurfaceVariant }]}
            >
              {item.market}, {item.district}
            </Text>
          </View>

          <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

          <View style={styles.priceRow}>
            <View style={styles.modalPriceBlock}>
              <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                {strings.market.modalPriceLabel}
              </Text>
              <Text style={[typography.mediumHeading, { color: theme.colors.primary }]}>
                {formatPrice(item.modalPrice)}
              </Text>
              <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                {strings.market.perQuintal}
              </Text>
            </View>
            <View style={styles.minMaxBlock}>
              <View style={styles.minMaxItem}>
                <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                  {strings.market.minPriceLabel}
                </Text>
                <Text style={[typography.sectionTitle, { fontSize: 15 }]}>
                  {formatPrice(item.minPrice)}
                </Text>
              </View>
              <View style={styles.minMaxItem}>
                <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                  {strings.market.maxPriceLabel}
                </Text>
                <Text style={[typography.sectionTitle, { fontSize: 15 }]}>
                  {formatPrice(item.maxPrice)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
              {item.variety}
            </Text>
            <View style={styles.footerDate}>
              <MaterialCommunityIcons
                name="calendar-outline"
                size={iconSize.xs}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                {item.arrivalDate}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    ),
    [theme],
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating size="large" color={theme.colors.primary} />
        <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
          {strings.market.loadingMessage}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title={strings.market.errorTitle}
          message={error}
          actionLabel={strings.market.retry}
          onAction={fetchPrices}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <OrganicBackground intensity="subtle" />
      <FlatList
        data={prices}
        keyExtractor={getItemKey}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="chart-line"
            title={strings.market.emptyTitle}
            message={strings.home.cropsComing}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
    flexGrow: 1,
  },
  card: {},
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  gradeChip: { height: 28 },
  gradeChipText: { fontSize: 11, lineHeight: 14, marginVertical: 0 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  locationText: { flex: 1 },
  divider: { marginVertical: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalPriceBlock: { flex: 1 },
  minMaxBlock: { flexDirection: 'row', gap: spacing.lg },
  minMaxItem: { alignItems: 'flex-end' },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  footerDate: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
