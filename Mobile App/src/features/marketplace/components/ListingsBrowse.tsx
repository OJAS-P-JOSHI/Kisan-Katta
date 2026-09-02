import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { ActivityIndicator, Snackbar, Text } from 'react-native-paper';

import { useAuth } from '@/features/auth/context/AuthContext';
import { useDistricts } from '@/features/location/hooks/useDistricts';
import { useMyProfile } from '@/features/profile/hooks/useMyProfile';
import { spacing } from '@/theme';

import {
  BrowseFilterSheet,
  type BrowseFilterValue,
  type DistrictFilterValue,
} from './BrowseFilterSheet';
import { CategoryChips } from './CategoryChips';
import { ListingCard } from './ListingCard';
import { ListingEmptyView, ListingErrorView, ListingLoadingView } from './ListingStateViews';
import { ListingTypeChips, type ListingTypeFilter } from './ListingTypeChips';
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
import type { ListingSortOption, ListingType, MarketplaceCategory, MarketplaceListing } from '../marketplace.types';
import { isListingOwner } from '../marketplace.utils';

type ListingsBrowseProps = {
  listingType?: ListingType;
  initialSearch?: string;
  onListingPress: (listing: MarketplaceListing) => void;
};

const browseCategoriesForType = (listingType: ListingType): readonly string[] => {
  if (listingType === 'labour') return LABOUR_CATEGORIES;
  if (listingType === 'product') return PRODUCT_CATEGORIES;
  return ['Produce'];
};

const resolveDistrictQuery = (
  filter: DistrictFilterValue,
  profileDistrict?: string,
): string | undefined => {
  if (filter.mode === 'all') return undefined;
  if (filter.mode === 'my') return profileDistrict?.trim() || undefined;
  return filter.district.trim() || undefined;
};

const districtPillLabel = (filter: DistrictFilterValue, profileDistrict?: string): string => {
  const copy = marketplaceStrings.filters;
  if (filter.mode === 'named') return filter.district;
  if (filter.mode === 'all' || !profileDistrict) return copy.allDistricts;
  return copy.myDistrict;
};

const sortPillLabel = (sort: ListingSortOption, listingType?: ListingType): string => {
  const copy = marketplaceStrings.filters;
  if (sort === 'newest') return copy.sortNewest;
  if (sort === 'price_low_to_high') {
    return listingType === 'labour' ? copy.sortRateLow : copy.sortPriceLow;
  }
  return listingType === 'labour' ? copy.sortRateHigh : copy.sortPriceHigh;
};

export function ListingsBrowse({
  listingType: lockedListingType,
  initialSearch = '',
  onListingPress,
}: ListingsBrowseProps) {
  const { user } = useAuth();
  const { data: profile, loading: profileLoading } = useMyProfile();
  const { data: districts } = useDistricts();
  const profileDistrict = profile?.district?.trim() || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(CATEGORY_FILTER_ALL);
  const [typeFilter, setTypeFilter] = useState<ListingTypeFilter>('all');
  const [filters, setFilters] = useState<BrowseFilterValue>({
    district: { mode: 'my' },
    sort: 'newest',
  });
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const { isSaved, toggleSave } = useSavedListingIds();
  const saveInFlightRef = useRef(new Set<string>());

  const activeListingType = lockedListingType ?? (typeFilter === 'all' ? undefined : typeFilter);

  const categoryParam =
    selectedCategory === CATEGORY_FILTER_ALL
      ? undefined
      : (selectedCategory as MarketplaceCategory);

  const districtParam = resolveDistrictQuery(filters.district, profileDistrict || undefined);

  const { listings, loading, refreshing, loadingMore, error, hasMore, refresh, loadMore } =
    usePaginatedListings(
      {
        listingType: activeListingType,
        search: debouncedSearch.trim() || undefined,
        category: activeListingType ? categoryParam : undefined,
        district: districtParam,
        sort: filters.sort,
      },
      { enabled: !profileLoading },
    );

  const hasFocusedOnce = useRef(false);
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }
      void refreshRef.current();
    }, []),
  );

  const handleTypeSelect = useCallback((next: ListingTypeFilter) => {
    setTypeFilter(next);
    setSelectedCategory(CATEGORY_FILTER_ALL);
  }, [setSelectedCategory, setTypeFilter]);

  const handleToggleSave = useCallback(
    async (listing: MarketplaceListing) => {
      if (isListingOwner(listing.sellerId, user?.userId)) return;
      if (saveInFlightRef.current.has(listing.id)) return;

      saveInFlightRef.current.add(listing.id);
      const wasSaved = isSaved(listing.id);
      try {
        const errorMessage = await toggleSave(listing.id);
        if (errorMessage) {
          setSnackbar(errorMessage);
          return;
        }
        setSnackbar(
          wasSaved ? marketplaceStrings.lifecycle.unsaved : marketplaceStrings.lifecycle.saved,
        );
      } finally {
        saveInFlightRef.current.delete(listing.id);
      }
    },
    [isSaved, toggleSave, user?.userId],
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

  const showCategoryChips = !!activeListingType && activeListingType !== 'produce';
  const emptyMessage = debouncedSearch.trim()
    ? marketplaceStrings.listings.searchEmptyMessage
    : marketplaceStrings.listings.emptyMessage;

  const districtLabel = useMemo(
    () => districtPillLabel(filters.district, profileDistrict || undefined),
    [filters.district, profileDistrict],
  );
  const sortLabel = sortPillLabel(filters.sort, activeListingType);

  const listHeader = (
    <>
      {error && listings.length > 0 ? (
        <Pressable onPress={() => loadMore()} style={styles.inlineError}>
          <Text variant="bodySmall" style={{ color: '#BA1A1A', flex: 1 }}>
            {error}
          </Text>
          <Text variant="bodySmall" style={{ color: mp.primaryGreen, fontWeight: '700' }}>
            {marketplaceStrings.listings.retry}
          </Text>
        </Pressable>
      ) : null}
    </>
  );

  const chrome = (
    <>
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

      <View style={styles.filterPills}>
        <Pressable
          onPress={() => setFilterSheetVisible(true)}
          style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={marketplaceStrings.filters.districtA11y}
        >
          <Text style={styles.pillText} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            📍 {districtLabel}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={mp.primaryGreen} />
        </Pressable>
        <Pressable
          onPress={() => setFilterSheetVisible(true)}
          style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={marketplaceStrings.filters.sortA11y}
        >
          <Text style={styles.pillText} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            ↕ {sortLabel}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={mp.primaryGreen} />
        </Pressable>
      </View>

      {lockedListingType ? null : (
        <ListingTypeChips selected={typeFilter} onSelect={handleTypeSelect} />
      )}

      {lockedListingType ? (
        <CategoryChips
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          categories={browseCategoriesForType(lockedListingType)}
        />
      ) : showCategoryChips && activeListingType ? (
        <CategoryChips
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          categories={browseCategoriesForType(activeListingType)}
        />
      ) : null}
    </>
  );

  if ((loading || profileLoading) && listings.length === 0 && !error) {
    return (
      <View style={mpPage}>
        {chrome}
        <ListingLoadingView />
        {filterSheetVisible ? (
          <BrowseFilterSheet
            visible
            value={filters}
            profileDistrict={profileDistrict || undefined}
            districts={districts}
            listingType={activeListingType}
            onDismiss={() => setFilterSheetVisible(false)}
            onApply={(next) => {
              setFilters(next);
              setFilterSheetVisible(false);
            }}
          />
        ) : null}
      </View>
    );
  }

  if (error && listings.length === 0) {
    return (
      <View style={mpPage}>
        {chrome}
        <ListingErrorView
          title={marketplaceStrings.listings.errorTitle}
          message={error}
          onRetry={refresh}
        />
        {filterSheetVisible ? (
          <BrowseFilterSheet
            visible
            value={filters}
            profileDistrict={profileDistrict || undefined}
            districts={districts}
            listingType={activeListingType}
            onDismiss={() => setFilterSheetVisible(false)}
            onApply={(next) => {
              setFilters(next);
              setFilterSheetVisible(false);
            }}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={mpPage}>
      {chrome}

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
          loading ? (
            <ListingLoadingView />
          ) : (
            <ListingEmptyView
              title={marketplaceStrings.listings.emptyTitle}
              message={emptyMessage}
            />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator animating color={mp.primaryGreen} />
              <Text variant="bodySmall" style={{ color: mp.bodyGrey }}>
                {marketplaceStrings.listings.loadMore}
              </Text>
            </View>
          ) : error && listings.length > 0 && hasMore ? (
            <Pressable onPress={loadMore} style={styles.footerRetry}>
              <Text variant="bodySmall" style={{ color: mp.primaryGreen, fontWeight: '700' }}>
                {marketplaceStrings.listings.loadMoreRetry}
              </Text>
            </Pressable>
          ) : null
        }
        ListHeaderComponent={listHeader}
      />

      {filterSheetVisible ? (
        <BrowseFilterSheet
          visible
          value={filters}
          profileDistrict={profileDistrict || undefined}
          districts={districts}
          listingType={activeListingType}
          onDismiss={() => setFilterSheetVisible(false)}
          onApply={(next) => {
            setFilters(next);
            setFilterSheetVisible(false);
          }}
        />
      ) : null}

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
  filterPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mp.searchBorder,
    backgroundColor: mp.white,
  },
  pillText: {
    color: mp.primaryGreen,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    flexShrink: 1,
  },
  pressed: { opacity: 0.85 },
  listContent: { padding: 16, paddingTop: 8, gap: 12, flexGrow: 1 },
  footer: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs },
  footerRetry: { alignItems: 'center', paddingVertical: spacing.md },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
});
