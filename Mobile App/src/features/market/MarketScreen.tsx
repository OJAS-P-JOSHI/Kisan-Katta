import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { EmptyState } from '@/components/EmptyState';
import { OrganicBackground } from '@/components/OrganicBackground';
import { strings } from '@/constants';
import { spacing, typography, useAppTheme } from '@/theme';

import { MarketCropCard, type MarketCropCardModel } from './components/MarketCropCard';
import { useFavouriteMarketCards } from './hooks/useFavouriteMarketCards';
import { normalizeCrop } from './market.favourites.store';

const getItemKey = (item: MarketCropCardModel): string => normalizeCrop(item.crop);

export default function MarketScreen() {
  const theme = useAppTheme();
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

  const renderItem = useCallback(
    ({ item }: { item: MarketCropCardModel }) => (
      <MarketCropCard item={item} onRetry={handleRetry} />
    ),
    [handleRetry],
  );

  if (profileLoading && !profile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <OrganicBackground intensity="subtle" />
        <View style={styles.profileLoading}>
          <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
            {strings.market.loadingFavouriteCrops}
          </Text>
        </View>
      </View>
    );
  }

  if (profileError && !profile) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
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
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <OrganicBackground intensity="subtle" />
      <FlatList
        data={cards}
        keyExtractor={getItemKey}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
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
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="chart-line"
            title={favoriteCrops.length === 0 ? strings.market.emptyTitle : strings.market.noFavouriteCropsTitle}
            message={strings.market.noFavouriteCropsDescription}
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
  profileLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
});
