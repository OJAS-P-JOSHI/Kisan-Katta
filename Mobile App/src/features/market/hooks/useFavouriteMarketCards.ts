import { useCallback, useEffect, useMemo } from 'react';

import { excludeFromGovernmentMarket } from '@/features/crop';
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
  /** All profile favourites (includes Milk for Home chips). */
  favoriteCrops: string[];
  profileLoading: boolean;
  profileError: string | null;
  profile: ReturnType<typeof useMyProfile>['data'];
  /** True while profile or any crop card is still in the initial loading state. */
  loading: boolean;
  /** True once every market-eligible favourite crop has left the loading state. */
  settled: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  retryCrop: (crop: string) => void;
  refreshProfile: () => Promise<void>;
};

/**
 * Shared Market favourites source of truth for Market + Home.
 * Dedupes in-flight fetches across screens; does not add a second API/cache.
 * Milk is kept in `favoriteCrops` for Home chips but excluded from market cards
 * (no Agmarknet government price).
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

  /** Agmarknet-backed favourites only — never includes Milk. */
  const marketFavoriteCrops = useMemo(
    () => excludeFromGovernmentMarket(favoriteCrops),
    [favoriteCrops],
  );

  const district = profile?.district?.trim() ?? '';
  const districtResolution = useMemo(
    () => (district ? resolveGovDistrict(district) : null),
    [district],
  );

  const datasetKey = useMemo(
    () =>
      `${districtResolution?.apiDistrict ?? ''}::${marketFavoriteCrops
        .map((crop) => crop.trim().toLowerCase())
        .join('|')}`,
    [districtResolution?.apiDistrict, marketFavoriteCrops],
  );

  useEffect(() => {
    if (profileLoading && !profile) return;
    syncDataset({
      datasetKey,
      favoriteCrops: marketFavoriteCrops,
      districtResolution,
    });
  }, [datasetKey, districtResolution, marketFavoriteCrops, profile, profileLoading, syncDataset]);

  const pricedCards = useMemo(() => selectPricedFavouriteCards(cards), [cards]);
  const hasMarketFavorites = marketFavoriteCrops.length > 0;
  const loading =
    (profileLoading && !profile) ||
    selectFavouriteCardsLoading(cards, hasMarketFavorites);
  const settled =
    !profileLoading && selectFavouriteCardsSettled(cards, hasMarketFavorites);

  const refresh = useCallback(async () => {
    await refreshProfile();
    if (!districtResolution || !marketFavoriteCrops.length) return;
    await refreshAll(marketFavoriteCrops, districtResolution);
  }, [districtResolution, marketFavoriteCrops, refreshAll, refreshProfile]);

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
