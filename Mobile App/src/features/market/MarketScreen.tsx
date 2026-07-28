import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { EmptyState } from '@/components/EmptyState';
import { OrganicBackground } from '@/components/OrganicBackground';
import { strings } from '@/constants';
import { useMyProfile } from '@/features/profile/hooks/useMyProfile';
import { spacing, typography, useAppTheme } from '@/theme';

import { getMarketErrorMessage } from './market.errors';
import { MarketCropCard, type MarketCropCardModel } from './components/MarketCropCard';
import { getMarketPricesForCrop } from './market.service';
import type { MarketPrice } from './market.types';

const STATE = 'Maharashtra';
const REQUEST_LIMIT = 100;
const getItemKey = (item: MarketCropCardModel): string => normalizeCrop(item.crop);
const normalizeCrop = (value: string): string => value.trim().toLowerCase();
const normalizeDistrict = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ');

const GOV_DISTRICT_ALIASES: Record<string, string> = {
  'chhatrapati sambhajinagar': 'Aurangabad',
  dharashiv: 'Osmanabad',
};

const resolveGovDistrict = (district: string): { apiDistrict: string; candidates: string[] } => {
  const normalized = normalizeDistrict(district);
  const apiDistrict = GOV_DISTRICT_ALIASES[normalized] ?? district.trim();
  const candidates = Array.from(new Set([apiDistrict, district.trim()]));
  return { apiDistrict, candidates };
};

const findTopRecordForCrop = (
  records: MarketPrice[],
  crop: string,
  districtCandidates: string[],
): MarketPrice | null => {
  const cropKey = normalizeCrop(crop);
  return (
    records.find((record) => {
      if (normalizeCrop(record.commodity) !== cropKey) return false;
      return districtCandidates.some(
        (district) => normalizeDistrict(record.district) === normalizeDistrict(district),
      );
    }) ?? null
  );
};

const createInitialCards = (crops: string[]): MarketCropCardModel[] =>
  crops.map((crop) => ({
    crop,
    state: 'loading',
    data: null,
    error: null,
    isRefreshing: false,
    lastUpdatedAt: null,
  }));

export default function MarketScreen() {
  const theme = useAppTheme();
  const { data: profile, loading: profileLoading, error: profileError, refresh: refreshProfile } = useMyProfile();
  const [cards, setCards] = useState<MarketCropCardModel[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const requestVersionRef = useRef(0);
  const inFlightRef = useRef(new Map<string, number>());
  const isMountedRef = useRef(true);
  const refreshInFlightRef = useRef(false);
  const previousDatasetKeyRef = useRef<string | null>(null);

  const favoriteCrops = useMemo(() => {
    const deduped: string[] = [];
    const seen = new Set<string>();
    for (const crop of profile?.favoriteCrops ?? []) {
      const trimmed = crop.trim();
      if (!trimmed) continue;
      const key = normalizeCrop(trimmed);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(trimmed);
    }
    return deduped;
  }, [profile?.favoriteCrops]);
  const district = profile?.district?.trim() ?? '';
  const districtResolution = useMemo(
    () => (district ? resolveGovDistrict(district) : null),
    [district],
  );
  const datasetKey = useMemo(
    () =>
      `${districtResolution?.apiDistrict ?? ''}::${favoriteCrops.map((crop) => normalizeCrop(crop)).join('|')}`,
    [districtResolution?.apiDistrict, favoriteCrops],
  );

  const updateCard = useCallback((crop: string, updater: (current: MarketCropCardModel) => MarketCropCardModel) => {
    if (!isMountedRef.current) return;
    setCards((current) =>
      current.map((card) => (card.crop === crop ? updater(card) : card)),
    );
  }, []);

  const loadCrop = useCallback(
    async (crop: string, mode: 'initial' | 'refresh' | 'retry'): Promise<void> => {
      if (!districtResolution) return;
      const alreadyInFlight = inFlightRef.current.has(crop);
      if (alreadyInFlight && mode !== 'initial') {
        return;
      }
      const requestVersion = requestVersionRef.current;
      const token = (inFlightRef.current.get(crop) ?? 0) + 1;
      inFlightRef.current.set(crop, token);

      if (mode === 'refresh') {
        updateCard(crop, (current) => ({
          ...current,
          isRefreshing: true,
          error: null,
        }));
      } else if (mode === 'retry') {
        updateCard(crop, (current) => ({
          ...current,
          state: 'loading',
          error: null,
          isRefreshing: false,
        }));
      }

      try {
        const records = await getMarketPricesForCrop({
          state: STATE,
          district: districtResolution.apiDistrict,
          commodity: crop,
          limit: REQUEST_LIMIT,
          offset: 0,
        });
        const topRecord = findTopRecordForCrop(records, crop, districtResolution.candidates);
        const isLatestRequest =
          requestVersionRef.current === requestVersion && inFlightRef.current.get(crop) === token;
        if (!isLatestRequest) return;

        updateCard(crop, (current) => ({
          ...current,
          state: topRecord ? 'success' : 'empty',
          data: topRecord,
          error: null,
          isRefreshing: false,
          lastUpdatedAt: Date.now(),
        }));
      } catch (error) {
        const isLatestRequest =
          requestVersionRef.current === requestVersion && inFlightRef.current.get(crop) === token;
        if (!isLatestRequest) return;

        updateCard(crop, (current) => ({
          ...current,
          state: 'error',
          data: null,
          error: getMarketErrorMessage(error),
          isRefreshing: false,
          lastUpdatedAt: Date.now(),
        }));
      } finally {
        if (inFlightRef.current.get(crop) === token) {
          inFlightRef.current.delete(crop);
        }
      }
    },
    [districtResolution, updateCard],
  );

  const triggerCropLoads = useCallback(
    (crops: string[], mode: 'initial' | 'refresh') => {
      crops.forEach((crop) => {
        void loadCrop(crop, mode);
      });
    },
    [loadCrop],
  );

  useEffect(() => {
    if (!isMountedRef.current) return;
    const datasetChanged = previousDatasetKeyRef.current !== datasetKey;
    previousDatasetKeyRef.current = datasetKey;

    if (!datasetChanged) return;

    requestVersionRef.current += 1;
    inFlightRef.current.clear();
    if (!favoriteCrops.length) {
      setCards([]);
      return;
    }
    if (!districtResolution) {
      setCards(
        favoriteCrops.map((crop) => ({
          crop,
          state: 'error',
          data: null,
          error: strings.market.errorMessage,
          isRefreshing: false,
          lastUpdatedAt: Date.now(),
        })),
      );
      return;
    }
    setCards(createInitialCards(favoriteCrops));
    triggerCropLoads(favoriteCrops, 'initial');
  }, [datasetKey, districtResolution, favoriteCrops, triggerCropLoads]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      requestVersionRef.current += 1;
      inFlightRef.current.clear();
      refreshInFlightRef.current = false;
    };
  }, []);

  const handleRetry = useCallback((crop: string) => {
    void loadCrop(crop, 'retry');
  }, [loadCrop]);

  const handleRefresh = useCallback(async () => {
    if (!favoriteCrops.length || refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    setRefreshing(true);
    try {
      requestVersionRef.current += 1;
      inFlightRef.current.clear();
      setCards((current) =>
        current.map((card) => ({
          ...card,
          isRefreshing: true,
          error: null,
        })),
      );

      await Promise.allSettled(
        favoriteCrops.map((crop) => loadCrop(crop, 'refresh')),
      );
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
      refreshInFlightRef.current = false;
    }
  }, [favoriteCrops, loadCrop]);

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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.primary]} />
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
