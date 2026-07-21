import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Card, SegmentedButtons, Snackbar, Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '@/theme';

import { ListingLifecycleDialogs } from '../components/ListingLifecycleDialogs';
import { ListingEmptyView, ListingErrorView, ListingLoadingView } from '../components/ListingStateViews';
import { ListingStatusBadge } from '../components/ListingStatusBadge';
import { useListingLifecycleActions } from '../hooks/useListingLifecycleActions';
import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { getMyListings } from '../marketplace.service';
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
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    try {
      setError(null);
      const result = await getMyListings();
      setListings(result.listings);
    } catch (err) {
      setError(getMarketplaceErrorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchListings().finally(() => setLoading(false));
    }, [fetchListings]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchListings().finally(() => setRefreshing(false));
  }, [fetchListings]);

  const filteredListings = useMemo(
    () => listings.filter((listing) => listing.status === statusFilter),
    [listings, statusFilter],
  );

  const {
    dialog,
    loading: lifecycleLoading,
    openMarkSoldDialog,
    openArchiveDialog,
    closeDialog,
    confirmMarkSold,
    confirmArchive,
  } = useListingLifecycleActions({
    onMarkedSold: fetchListings,
    onArchived: fetchListings,
  });

  const handleConfirmMarkSold = useCallback(async () => {
    const message = await confirmMarkSold();
    if (message) setSnackbar(message);
  }, [confirmMarkSold]);

  const handleConfirmArchive = useCallback(async () => {
    const message = await confirmArchive();
    if (message) setSnackbar(message);
  }, [confirmArchive]);

  const renderItem = useCallback(
    ({ item }: { item: MarketplaceListing }) => (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
        <Card.Content style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text variant="titleMedium" style={{ flex: 1 }}>
              {getListingDisplayTitle(item)}
            </Text>
            <ListingStatusBadge status={item.status} />
          </View>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
            {formatPrice(item.price)}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {item.district} · {formatListingDate(item.createdAt)}
          </Text>

          {item.status === 'ACTIVE' ? (
            <View style={styles.actions}>
              <Button
                mode="outlined"
                compact
                onPress={() => router.push(`/marketplace-edit/${item.id}` as Href)}
                style={styles.actionButton}
                disabled={lifecycleLoading}
              >
                {marketplaceStrings.myListings.edit}
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() => openMarkSoldDialog(item.id)}
                style={styles.actionButton}
                disabled={lifecycleLoading}
              >
                {marketplaceStrings.myListings.markSold}
              </Button>
              <Button
                mode="text"
                compact
                textColor={theme.colors.error}
                onPress={() => openArchiveDialog(item.id)}
                disabled={lifecycleLoading}
              >
                {marketplaceStrings.myListings.archive}
              </Button>
            </View>
          ) : null}

          {item.status === 'SOLD' ? (
            <View style={styles.actions}>
              <Button
                mode="outlined"
                compact
                onPress={() => router.push(`/marketplace-edit/${item.id}` as Href)}
                style={styles.actionButton}
              >
                {marketplaceStrings.myListings.edit}
              </Button>
            </View>
          ) : null}
        </Card.Content>
      </Card>
    ),
    [lifecycleLoading, openArchiveDialog, openMarkSoldDialog, router, theme.colors.error],
  );

  if (loading && listings.length === 0) {
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

      <ListingLifecycleDialogs
        dialog={dialog}
        loading={lifecycleLoading}
        onDismiss={closeDialog}
        onConfirmMarkSold={handleConfirmMarkSold}
        onConfirmArchive={handleConfirmArchive}
      />

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  segmented: { margin: spacing.md, marginBottom: spacing.sm },
  listContent: { padding: spacing.md, paddingTop: 0, gap: spacing.md, flexGrow: 1 },
  card: { borderRadius: radius.lg },
  cardContent: { gap: spacing.xs },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  actionButton: { borderRadius: radius.sm },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
});
