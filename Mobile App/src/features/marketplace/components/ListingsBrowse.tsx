import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Searchbar, Snackbar, Text } from 'react-native-paper';

import { useAuth } from '@/features/auth/context/AuthContext';
import { spacing, useAppTheme } from '@/theme';

import { CategoryChips } from './CategoryChips';
import { ListingCard } from './ListingCard';
import { ListingEmptyView, ListingErrorView, ListingLoadingView } from './ListingStateViews';
import {
  CATEGORY_FILTER_ALL,
  SEARCH_DEBOUNCE_MS,
  type CategoryFilter,
} from '../marketplace.constants';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePaginatedListings } from '../hooks/usePaginatedListings';
import { useSavedListingIds } from '../hooks/useSavedListingIds';
import { marketplaceStrings } from '../marketplace.strings';
import type { ListingType, MarketplaceCategory, MarketplaceListing } from '../marketplace.types';
import { isListingOwner } from '../marketplace.utils';

type ListingsBrowseProps = {
  listingType: ListingType;
  initialSearch?: string;
  onListingPress: (listing: MarketplaceListing) => void;
};

export function ListingsBrowse({
  listingType,
  initialSearch = '',
  onListingPress,
}: ListingsBrowseProps) {
  const theme = useAppTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(CATEGORY_FILTER_ALL);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const { isSaved, toggleSave } = useSavedListingIds();

  const categoryParam =
    selectedCategory === CATEGORY_FILTER_ALL
      ? undefined
      : (selectedCategory as MarketplaceCategory);

  const { listings, loading, refreshing, loadingMore, error, hasMore, refresh, loadMore } =
    usePaginatedListings({
      listingType,
      search: debouncedSearch.trim() || undefined,
      category: categoryParam,
    });

  const hasFocusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }
      void refresh();
    }, [refresh]),
  );

  const handleToggleSave = useCallback(
    async (listing: MarketplaceListing) => {
      if (isListingOwner(listing.sellerId, user?.userId)) return;

      const errorMessage = await toggleSave(listing.id);
      if (errorMessage) {
        setSnackbar(errorMessage);
      }
    },
    [toggleSave, user?.userId],
  );

  const handleEndReached = useCallback(() => {
    if (hasMore) loadMore();
  }, [hasMore, loadMore]);

  const renderItem = useCallback(
    ({ item }: { item: MarketplaceListing }) => (
      <ListingCard
        listing={item}
        currentUserId={user?.userId}
        isSaved={isSaved(item.id)}
        onPress={onListingPress}
        onToggleSave={handleToggleSave}
      />
    ),
    [handleToggleSave, isSaved, onListingPress, user?.userId],
  );

  const emptyMessage = debouncedSearch.trim()
    ? marketplaceStrings.listings.searchEmptyMessage
    : marketplaceStrings.listings.emptyMessage;

  if (loading) {
    return <ListingLoadingView />;
  }

  if (error && listings.length === 0) {
    return (
      <ListingErrorView
        title={marketplaceStrings.listings.errorTitle}
        message={error}
        onRetry={refresh}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.searchWrap}>
        <Searchbar
          placeholder={marketplaceStrings.home.searchPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
          inputStyle={styles.searchInput}
          icon={() => (
            <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.onSurfaceVariant} />
          )}
        />
      </View>

      <CategoryChips selected={selectedCategory} onSelect={setSelectedCategory} />

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[theme.colors.primary]} />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <ListingEmptyView
            title={marketplaceStrings.listings.emptyTitle}
            message={emptyMessage}
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
        ListHeaderComponent={
          error ? (
            <Text variant="bodySmall" style={{ color: theme.colors.error, marginBottom: spacing.sm }}>
              {error}
            </Text>
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
  searchWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  searchbar: { borderRadius: 12, elevation: 0 },
  searchInput: { minHeight: 0 },
  listContent: { padding: spacing.md, paddingTop: spacing.sm, gap: spacing.md, flexGrow: 1 },
  footer: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs },
});
