import { create } from 'zustand';

import { strings } from '@/constants';

import { getMarketErrorMessage } from './market.errors';
import type { MarketCropCardModel } from './components/MarketCropCard';
import { getMarketPricesForCrop } from './market.service';
import type { MarketPrice } from './market.types';

const STATE = 'Maharashtra';
const REQUEST_LIMIT = 100;

export const normalizeCrop = (value: string): string => value.trim().toLowerCase();

const normalizeDistrict = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const GOV_DISTRICT_ALIASES: Record<string, string> = {
  'chhatrapati sambhajinagar': 'Aurangabad',
  dharashiv: 'Osmanabad',
};

export const resolveGovDistrict = (
  district: string,
): { apiDistrict: string; candidates: string[] } => {
  const normalized = normalizeDistrict(district);
  const apiDistrict = GOV_DISTRICT_ALIASES[normalized] ?? district.trim();
  const candidates = Array.from(new Set([apiDistrict, district.trim()]));
  return { apiDistrict, candidates };
};

export const dedupeFavoriteCrops = (crops: readonly string[]): string[] => {
  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const crop of crops) {
    const trimmed = crop.trim();
    if (!trimmed) continue;
    const key = normalizeCrop(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(trimmed);
  }
  return deduped;
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

type DistrictResolution = { apiDistrict: string; candidates: string[] };

type FavouriteMarketState = {
  cards: MarketCropCardModel[];
  datasetKey: string | null;
  refreshing: boolean;
  syncDataset: (args: {
    datasetKey: string;
    favoriteCrops: string[];
    districtResolution: DistrictResolution | null;
  }) => void;
  loadCrop: (
    crop: string,
    mode: 'initial' | 'refresh' | 'retry',
    districtResolution: DistrictResolution,
  ) => Promise<void>;
  refreshAll: (
    favoriteCrops: string[],
    districtResolution: DistrictResolution,
  ) => Promise<void>;
  retryCrop: (crop: string, districtResolution: DistrictResolution) => void;
};

const requestVersionRef = { current: 0 };
const inFlightRef = { current: new Map<string, number>() };
const refreshInFlightRef = { current: false };

export const useFavouriteMarketStore = create<FavouriteMarketState>((set, get) => ({
  cards: [],
  datasetKey: null,
  refreshing: false,

  syncDataset: ({ datasetKey, favoriteCrops, districtResolution }) => {
    if (get().datasetKey === datasetKey) return;

    requestVersionRef.current += 1;
    inFlightRef.current.clear();
    set({ datasetKey });

    if (!favoriteCrops.length) {
      set({ cards: [] });
      return;
    }

    if (!districtResolution) {
      set({
        cards: favoriteCrops.map((crop) => ({
          crop,
          state: 'error' as const,
          data: null,
          error: strings.market.errorMessage,
          isRefreshing: false,
          lastUpdatedAt: Date.now(),
        })),
      });
      return;
    }

    set({ cards: createInitialCards(favoriteCrops) });
    favoriteCrops.forEach((crop) => {
      void get().loadCrop(crop, 'initial', districtResolution);
    });
  },

  loadCrop: async (crop, mode, districtResolution) => {
    const alreadyInFlight = inFlightRef.current.has(crop);
    if (alreadyInFlight && mode !== 'initial') {
      return;
    }

    const requestVersion = requestVersionRef.current;
    const token = (inFlightRef.current.get(crop) ?? 0) + 1;
    inFlightRef.current.set(crop, token);

    const updateCard = (updater: (current: MarketCropCardModel) => MarketCropCardModel) => {
      set((state) => ({
        cards: state.cards.map((card) => (card.crop === crop ? updater(card) : card)),
      }));
    };

    if (mode === 'refresh') {
      updateCard((current) => ({
        ...current,
        isRefreshing: true,
        error: null,
      }));
    } else if (mode === 'retry') {
      updateCard((current) => ({
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

      updateCard((current) => ({
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

      updateCard((current) => ({
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

  refreshAll: async (favoriteCrops, districtResolution) => {
    if (!favoriteCrops.length || refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    set({ refreshing: true });
    try {
      requestVersionRef.current += 1;
      inFlightRef.current.clear();
      set((state) => ({
        cards: state.cards.map((card) => ({
          ...card,
          isRefreshing: true,
          error: null,
        })),
      }));

      await Promise.allSettled(
        favoriteCrops.map((crop) => get().loadCrop(crop, 'refresh', districtResolution)),
      );
    } finally {
      set({ refreshing: false });
      refreshInFlightRef.current = false;
    }
  },

  retryCrop: (crop, districtResolution) => {
    void get().loadCrop(crop, 'retry', districtResolution);
  },
}));

/** Crops with a successful market price record — Home summary source of truth filter. */
export const selectPricedFavouriteCards = (
  cards: readonly MarketCropCardModel[],
): MarketCropCardModel[] => cards.filter((card) => card.state === 'success' && card.data !== null);

export const selectFavouriteCardsLoading = (
  cards: readonly MarketCropCardModel[],
  hasFavorites: boolean,
): boolean => {
  if (!hasFavorites) return false;
  if (cards.length === 0) return true;
  return cards.some((card) => card.state === 'loading');
};

export const selectFavouriteCardsSettled = (
  cards: readonly MarketCropCardModel[],
  hasFavorites: boolean,
): boolean => {
  if (!hasFavorites) return true;
  if (cards.length === 0) return false;
  return cards.every((card) => card.state !== 'loading');
};
