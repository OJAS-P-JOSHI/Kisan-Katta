import { useCallback, useEffect, useMemo } from 'react';

import { useMyProfile } from '@/features/profile/hooks/useMyProfile';

import type { MarketCropCardModel } from '../market.types';
import {
  dedupeFavoriteCrops,
  resolveGovDistrict,
  selectFavouriteCardsLoading,
  selectFavouriteCardsSettled,
  selectPricedFavouriteCards,
  useFavouriteMarketStore,
} from '../market.favourites.store';

export type UseFavouriteMarketCardsReturn = {
  cards: MarketCropCardModel[];
  /** Favourite crops that currently have a valid market price. */
  pricedCards: MarketCropCardModel[];
  favoriteCrops: string[];
  profileLoading: boolean;
  profileError: string | null;
  profile: ReturnType<typeof useMyProfile>['data'];
  /** True while profile or any crop card is still in the initial loading state. */
  loading: boolean;
  /** True once every favourite crop has left the loading state. */
  settled: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  retryCrop: (crop: string) => void;
  refreshProfile: () => Promise<void>;
};

/**
 * Shared Market favourites source of truth for Market + Home.
 * Dedupes in-flight fetches across screens; does not add a second API/cache.
 */
export function useFavouriteMarketCards(): UseFavouriteMarketCardsReturn {
  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useMyProfile();

  const cards = useFavouriteMarketStore((s) => s.cards);
  const refreshing = useFavouriteMarketStore((s) => s.refreshing);
  const syncDataset = useFavouriteMarketStore((s) => s.syncDataset);
  const refreshAll = useFavouriteMarketStore((s) => s.refreshAll);
  const retryCropAction = useFavouriteMarketStore((s) => s.retryCrop);

  const favoriteCrops = useMemo(
    () => dedupeFavoriteCrops(profile?.favoriteCrops ?? []),
    [profile?.favoriteCrops],
  );

  const district = profile?.district?.trim() ?? '';
  const districtResolution = useMemo(
    () => (district ? resolveGovDistrict(district) : null),
    [district],
  );

  const datasetKey = useMemo(
    () =>
      `${districtResolution?.apiDistrict ?? ''}::${favoriteCrops.map((crop) => crop.trim().toLowerCase()).join('|')}`,
    [districtResolution?.apiDistrict, favoriteCrops],
  );

  useEffect(() => {
    if (profileLoading && !profile) return;
    syncDataset({ datasetKey, favoriteCrops, districtResolution });
  }, [datasetKey, districtResolution, favoriteCrops, profile, profileLoading, syncDataset]);

  const pricedCards = useMemo(() => selectPricedFavouriteCards(cards), [cards]);
  const hasFavorites = favoriteCrops.length > 0;
  const loading =
    (profileLoading && !profile) || selectFavouriteCardsLoading(cards, hasFavorites);
  const settled = !profileLoading && selectFavouriteCardsSettled(cards, hasFavorites);

  const refresh = useCallback(async () => {
    await refreshProfile();
    if (!districtResolution || !favoriteCrops.length) return;
    await refreshAll(favoriteCrops, districtResolution);
  }, [districtResolution, favoriteCrops, refreshAll, refreshProfile]);

  const retryCrop = useCallback(
    (crop: string) => {
      if (!districtResolution) return;
      retryCropAction(crop, districtResolution);
    },
    [districtResolution, retryCropAction],
  );

  return {
    cards,
    pricedCards,
    favoriteCrops,
    profileLoading,
    profileError,
    profile,
    loading,
    settled,
    refreshing,
    refresh,
    retryCrop,
    refreshProfile,
  };
}
