import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Searchbar, Text } from 'react-native-paper';

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
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(CATEGORY_FILTER_ALL);
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

  const handleToggleSave = useCallback(
    (listing: MarketplaceListing) => {
      void toggleSave(listing.id);
    },
    [toggleSave],
  );

  const handleEndReached = useCallback(() => {
    if (hasMore) loadMore();
  }, [hasMore, loadMore]);

  const renderItem = useCallback(
    ({ item }: { item: MarketplaceListing }) => (
      <ListingCard
        listing={item}
        isSaved={isSaved(item.id)}
        onPress={onListingPress}
        onToggleSave={handleToggleSave}
      />
    ),
    [handleToggleSave, isSaved, onListingPress],
  );

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
            message={marketplaceStrings.listings.emptyMessage}
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
