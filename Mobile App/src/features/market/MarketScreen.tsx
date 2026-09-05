import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScenicScreenHeader, ScenicSectionHeading, scenicPadX } from '@/components/branding/ScenicScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { tabBarContentInset } from '@/components/navigation/tabBar.theme';
import { strings } from '@/constants';
import { excludeFromGovernmentMarket } from '@/features/crop';
import { mp } from '@/features/marketplace/marketplace.ui';

import { MarketCropCard } from './components/MarketCropCard';
import { useFavouriteMarketCards } from './hooks/useFavouriteMarketCards';
import { normalizeCrop } from './market.favourites.store';
import type { MarketCropCardModel } from './market.types';

const getItemKey = (item: MarketCropCardModel): string => normalizeCrop(item.crop);

export default function MarketScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const padX = scenicPadX(width) + Math.max(insets.left, 0);
  const padXRight = scenicPadX(width) + Math.max(insets.right, 0);
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);

  const {
    cards,
    favoriteCrops,
    profile,
    profileLoading,
    profileError,
    refreshing,
    refresh,
    retryCrop,
    refreshProfile,
  } = useFavouriteMarketCards();

  const handleRetry = useCallback(
    (crop: string) => {
      retryCrop(crop);
    },
    [retryCrop],
  );

  const handleToggleExpand = useCallback((crop: string) => {
    setExpandedCrop((current) => (current === crop ? null : crop));
  }, []);

  const marketEligibleCount = excludeFromGovernmentMarket(favoriteCrops).length;

  const renderItem = useCallback(
    ({ item }: { item: MarketCropCardModel }) => (
      <View style={{ paddingLeft: padX, paddingRight: padXRight }}>
        <MarketCropCard
          item={item}
          expanded={expandedCrop === item.crop}
          onToggleExpand={handleToggleExpand}
          onRetry={handleRetry}
        />
      </View>
    ),
    [expandedCrop, handleRetry, handleToggleExpand, padX, padXRight],
  );

  const listHeader = useMemo(
    () => (
      <View>
        <ScenicScreenHeader title={strings.market.title} subtitle={strings.market.subtitle} />
        <View style={[styles.sectionPad, { paddingLeft: padX, paddingRight: padXRight }]}>
          <ScenicSectionHeading icon="sprout-outline" label={strings.market.favouriteCropsLabel} />
        </View>
      </View>
    ),
    [padX, padXRight],
  );

  if (profileLoading && !profile) {
    return (
      <View style={styles.container}>
        <ScenicScreenHeader title={strings.market.title} subtitle={strings.market.subtitle} />
        <View style={styles.profileLoading}>
          <Text style={styles.mutedBody}>{strings.market.loadingFavouriteCrops}</Text>
        </View>
      </View>
    );
  }

  if (profileError && !profile) {
    return (
      <View style={styles.container}>
        <ScenicScreenHeader title={strings.market.title} subtitle={strings.market.subtitle} />
        <View style={styles.centered}>
          <EmptyState
            icon="alert-circle-outline"
            title={strings.market.errorTitle}
            message={profileError}
            actionLabel={strings.market.retry}
            onAction={() => {
              void refreshProfile();
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cards}
        keyExtractor={getItemKey}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarContentInset(insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={7}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refresh();
            }}
            colors={[mp.primaryGreen]}
            tintColor={mp.primaryGreen}
          />
        }
        ListEmptyComponent={
          <View style={{ paddingLeft: padX, paddingRight: padXRight }}>
            <EmptyState
              icon="chart-line"
              title={
                marketEligibleCount === 0
                  ? strings.market.emptyTitle
                  : strings.market.noFavouriteCropsTitle
              }
              message={strings.market.noFavouriteCropsDescription}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: mp.cream },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  listContent: {
    flexGrow: 1,
    gap: 14,
  },
  sectionPad: {
    paddingTop: 4,
    paddingBottom: 10,
  },
  profileLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mutedBody: {
    color: mp.bodyGrey,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
