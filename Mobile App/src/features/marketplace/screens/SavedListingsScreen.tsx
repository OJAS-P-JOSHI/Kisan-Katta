import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Snackbar, Text } from 'react-native-paper';

import { useAuth } from '@/features/auth/context/AuthContext';
import { spacing, useAppTheme } from '@/theme';

import { ListingCard } from '../components/ListingCard';
import { ListingEmptyView, ListingErrorView, ListingLoadingView } from '../components/ListingStateViews';
import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { getSavedListings, unsaveListing } from '../marketplace.service';
import { marketplaceStrings } from '../marketplace.strings';
import type { MarketplaceListing } from '../marketplace.types';
import { isListingOwner } from '../marketplace.utils';

export default function SavedListingsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);

  const fetchPage = useCallback(async (pageToLoad: number, replace: boolean) => {
    try {
      setError(null);
      const result = await getSavedListings(pageToLoad);
      setListings((prev) => (replace ? result.listings : [...prev, ...result.listings]));
      setPage(pageToLoad);
      setHasMore(pageToLoad < result.pagination.totalPages);
    } catch (err) {
      setError(getMarketplaceErrorMessage(err));
      if (replace) setListings([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchPage(1, true).finally(() => setLoading(false));
    }, [fetchPage]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPage(1, true).finally(() => setRefreshing(false));
  }, [fetchPage]);

  const handleLoadMore = useCallback(() => {
    if (loadingMoreRef.current || loading || refreshing || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    fetchPage(page + 1, false).finally(() => {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    });
  }, [fetchPage, hasMore, loading, page, refreshing]);

  const handleListingPress = useCallback(
    (listing: MarketplaceListing) => {
      router.push(`/marketplace-listing/${listing.id}` as Href);
    },
    [router],
  );

  const handleToggleSave = useCallback(async (listing: MarketplaceListing) => {
    if (isListingOwner(listing.sellerId, user?.userId)) return;

    setListings((prev) => prev.filter((item) => item.id !== listing.id));

    try {
      await unsaveListing(listing.id);
    } catch {
      setListings((prev) => [listing, ...prev]);
      setSnackbar(marketplaceStrings.lifecycle.unableSave);
    }
  }, [user?.userId]);

  const renderItem = useCallback(
    ({ item }: { item: MarketplaceListing }) => (
      <ListingCard
        listing={item}
        currentUserId={user?.userId}
        isSaved
        onPress={handleListingPress}
        onToggleSave={isListingOwner(item.sellerId, user?.userId) ? undefined : handleToggleSave}
      />
    ),
    [handleListingPress, handleToggleSave, user?.userId],
  );

  if (loading && listings.length === 0) {
    return <ListingLoadingView />;
  }

  if (error && listings.length === 0) {
    return (
      <ListingErrorView
        title={marketplaceStrings.listings.errorTitle}
        message={error}
        onRetry={() => fetchPage(1, true)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.primary]} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <ListingEmptyView
            title={marketplaceStrings.saved.emptyTitle}
            message={marketplaceStrings.saved.emptyMessage}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator animating color={theme.colors.primary} />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {marketplaceStrings.listings.loadMore}
              </Text>
            </View>
          ) : null
        }
      />

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: spacing.md, gap: spacing.md, flexGrow: 1 },
  footer: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs },
});
