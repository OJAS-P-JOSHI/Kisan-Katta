import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Card, SegmentedButtons, Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '@/theme';

import { ListingEmptyView, ListingErrorView, ListingLoadingView } from '../components/ListingStateViews';
import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { archiveListing, getMyListings, updateListing } from '../marketplace.service';
import { marketplaceStrings } from '../marketplace.strings';
import type { ListingStatus, MarketplaceListing } from '../marketplace.types';
import { formatListingDate, formatPrice, getListingDisplayTitle } from '../marketplace.utils';

type StatusFilter = ListingStatus;

export default function MyListingsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    try {
      setError(null);
      const result = await getMyListings();
      setListings(result.listings);
    } catch (err) {
      setError(getMarketplaceErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    fetchListings().finally(() => setLoading(false));
  }, [fetchListings]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchListings().finally(() => setRefreshing(false));
  }, [fetchListings]);

  const filteredListings = useMemo(
    () => listings.filter((listing) => listing.status === statusFilter),
    [listings, statusFilter],
  );

  const handleArchive = useCallback(
    async (listingId: string) => {
      setActionId(listingId);
      try {
        await archiveListing(listingId);
        setListings((prev) =>
          prev.map((item) => (item.id === listingId ? { ...item, status: 'ARCHIVED' } : item)),
        );
      } catch (err) {
        setError(getMarketplaceErrorMessage(err));
      } finally {
        setActionId(null);
      }
    },
    [],
  );

  const handleMarkSold = useCallback(async (listingId: string) => {
    setActionId(listingId);
    try {
      await updateListing(listingId, { status: 'SOLD' });
      setListings((prev) =>
        prev.map((item) => (item.id === listingId ? { ...item, status: 'SOLD' } : item)),
      );
    } catch (err) {
      setError(getMarketplaceErrorMessage(err));
    } finally {
      setActionId(null);
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: MarketplaceListing }) => (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium">{getListingDisplayTitle(item)}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
            {formatPrice(item.price)}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {item.district} · {formatListingDate(item.createdAt)}
          </Text>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              compact
              onPress={() => router.push(`/marketplace-edit/${item.id}` as Href)}
              style={styles.actionButton}
            >
              {marketplaceStrings.myListings.edit}
            </Button>
            {item.status === 'ACTIVE' ? (
              <Button
                mode="outlined"
                compact
                onPress={() => handleMarkSold(item.id)}
                loading={actionId === item.id}
                disabled={actionId === item.id}
                style={styles.actionButton}
              >
                {marketplaceStrings.myListings.markSold}
              </Button>
            ) : null}
            {item.status !== 'ARCHIVED' ? (
              <Button
                mode="text"
                compact
                textColor={theme.colors.error}
                onPress={() => handleArchive(item.id)}
                loading={actionId === item.id}
                disabled={actionId === item.id}
              >
                {marketplaceStrings.myListings.archive}
              </Button>
            ) : null}
          </View>
        </Card.Content>
      </Card>
    ),
    [actionId, handleArchive, handleMarkSold, router, theme.colors],
  );

  if (loading) {
    return <ListingLoadingView />;
  }

  if (error && listings.length === 0) {
    return (
      <ListingErrorView
        title={marketplaceStrings.listings.errorTitle}
        message={error}
        onRetry={fetchListings}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SegmentedButtons
        value={statusFilter}
        onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        buttons={[
          { value: 'ACTIVE', label: marketplaceStrings.myListings.active },
          { value: 'SOLD', label: marketplaceStrings.myListings.sold },
          { value: 'ARCHIVED', label: marketplaceStrings.myListings.archived },
        ]}
        style={styles.segmented}
      />

      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.primary]} />
        }
        ListEmptyComponent={
          <ListingEmptyView
            title={marketplaceStrings.myListings.emptyTitle}
            message={marketplaceStrings.myListings.emptyMessage}
          />
        }
        ListHeaderComponent={
          error ? (
            <View style={styles.inlineError}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={theme.colors.error} />
              <Text variant="bodySmall" style={{ color: theme.colors.error, flex: 1 }}>
                {error}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  segmented: { margin: spacing.md, marginBottom: spacing.sm },
  listContent: { padding: spacing.md, paddingTop: 0, gap: spacing.md, flexGrow: 1 },
  card: { borderRadius: radius.lg },
  cardContent: { gap: spacing.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  actionButton: { borderRadius: radius.sm },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
});
