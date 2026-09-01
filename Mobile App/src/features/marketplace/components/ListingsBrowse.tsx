import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { ActivityIndicator, Snackbar, Text } from 'react-native-paper';

import { useAuth } from '@/features/auth/context/AuthContext';
import { spacing } from '@/theme';

import { CategoryChips } from './CategoryChips';
import { ListingCard } from './ListingCard';
import { ListingEmptyView, ListingErrorView, ListingLoadingView } from './ListingStateViews';
import {
  CATEGORY_FILTER_ALL,
  LABOUR_CATEGORIES,
  PRODUCT_CATEGORIES,
  SEARCH_DEBOUNCE_MS,
  type CategoryFilter,
} from '../marketplace.constants';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePaginatedListings } from '../hooks/usePaginatedListings';
import { useSavedListingIds } from '../hooks/useSavedListingIds';
import { marketplaceStrings } from '../marketplace.strings';
import { mp, mpPage, mpSearchInput, mpSearchPill } from '../marketplace.ui';
import type { ListingType, MarketplaceCategory, MarketplaceListing } from '../marketplace.types';
import { isListingOwner } from '../marketplace.utils';

type ListingsBrowseProps = {
  listingType: ListingType;
  initialSearch?: string;
  onListingPress: (listing: MarketplaceListing) => void;
};

const browseCategoriesForType = (listingType: ListingType): readonly string[] => {
  if (listingType === 'labour') return LABOUR_CATEGORIES;
  if (listingType === 'product') return PRODUCT_CATEGORIES;
  return ['Produce'];
};

export function ListingsBrowse({
  listingType,
  initialSearch = '',
  onListingPress,
}: ListingsBrowseProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchFocused, setSearchFocused] = useState(false);
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
    <View style={mpPage}>
      <View style={styles.searchWrap}>
        <View style={[mpSearchPill, searchFocused ? styles.searchFocus : null]}>
          <View style={styles.searchSide}>
            <MaterialCommunityIcons name="magnify" size={22} color={mp.primaryGreen} />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={marketplaceStrings.home.searchPlaceholder}
            placeholderTextColor={mp.muted}
            returnKeyType="search"
            accessibilityLabel={marketplaceStrings.home.searchA11y}
            maxFontSizeMultiplier={1.5}
            style={[mpSearchInput, styles.searchInput]}
            underlineColorAndroid="transparent"
          />
        </View>
      </View>

      <CategoryChips
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        categories={browseCategoriesForType(listingType)}
      />

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[mp.primaryGreen]} />
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
              <ActivityIndicator animating color={mp.primaryGreen} />
              <Text variant="bodySmall" style={{ color: mp.bodyGrey }}>
                {marketplaceStrings.listings.loadMore}
              </Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          error ? (
            <Text variant="bodySmall" style={{ color: '#BA1A1A', marginBottom: spacing.sm }}>
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
  searchWrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 2 },
  searchFocus: {
    borderColor: mp.searchBorderFocus,
    backgroundColor: mp.searchWashFocus,
  },
  searchSide: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    fontSize: 14,
    lineHeight: 20,
  },
  listContent: { padding: 16, paddingTop: 8, gap: 12, flexGrow: 1 },
  footer: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs },
});
