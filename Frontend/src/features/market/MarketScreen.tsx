import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Divider, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { radius, spacing, useAppTheme } from '@/theme';

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
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
        <Card.Content>
          <View style={styles.headerRow}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {item.commodity}
            </Text>
            <Chip compact mode="outlined" style={styles.gradeChip} textStyle={styles.gradeChipText}>
              {item.grade}
            </Chip>
          </View>

          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text
              variant="bodyMedium"
              numberOfLines={1}
              style={[styles.locationText, { color: theme.colors.onSurfaceVariant }]}
            >
              {item.market}, {item.district}
            </Text>
          </View>

          <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

          <View style={styles.priceRow}>
            <View style={styles.modalPriceBlock}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {strings.market.modalPriceLabel}
              </Text>
              <Text variant="headlineSmall" style={[styles.modalPrice, { color: theme.colors.primary }]}>
                {formatPrice(item.modalPrice)}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {strings.market.perQuintal}
              </Text>
            </View>
            <View style={styles.minMaxBlock}>
              <View style={styles.minMaxItem}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {strings.market.minPriceLabel}
                </Text>
                <Text variant="titleSmall">{formatPrice(item.minPrice)}</Text>
              </View>
              <View style={styles.minMaxItem}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {strings.market.maxPriceLabel}
                </Text>
                <Text variant="titleSmall">{formatPrice(item.maxPrice)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.variety}
            </Text>
            <View style={styles.footerDate}>
              <MaterialCommunityIcons name="calendar-outline" size={14} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
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
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {strings.market.loadingMessage}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          {strings.market.errorTitle}
        </Text>
        <Text variant="bodyMedium" style={[styles.centeredText, { color: theme.colors.onSurfaceVariant }]}>
          {error}
        </Text>
        <Button mode="contained" onPress={fetchPrices} style={styles.retryButton}>
          {strings.market.retry}
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="text-search" size={48} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {strings.market.emptyTitle}
            </Text>
            <Text variant="bodyMedium" style={[styles.centeredText, { color: theme.colors.onSurfaceVariant }]}>
              {strings.home.cropsComing}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  centeredText: { textAlign: 'center' },
  retryButton: { marginTop: spacing.sm },
  listContent: { padding: spacing.md, paddingTop: spacing.sm, gap: spacing.md, flexGrow: 1 },
  card: { borderRadius: radius.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gradeChip: { height: 28 },
  gradeChipText: { fontSize: 11, lineHeight: 14, marginVertical: 0 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  locationText: { flex: 1 },
  divider: { marginVertical: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalPriceBlock: { flex: 1 },
  modalPrice: { fontWeight: '700' },
  minMaxBlock: { flexDirection: 'row', gap: spacing.lg },
  minMaxItem: { alignItems: 'flex-end' },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  footerDate: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.sm,
    flexGrow: 1,
  },
});
