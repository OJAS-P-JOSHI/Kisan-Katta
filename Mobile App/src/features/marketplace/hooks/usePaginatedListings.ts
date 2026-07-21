import { useCallback, useEffect, useRef, useState } from 'react';

import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { getListings } from '../marketplace.service';
import type { ListingsQueryParams, MarketplaceListing } from '../marketplace.types';

type UsePaginatedListingsOptions = Omit<ListingsQueryParams, 'page'>;

type UsePaginatedListingsResult = {
  listings: MarketplaceListing[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => void;
};

/** Manages paginated marketplace listings with pull-to-refresh and infinite scroll. */
export function usePaginatedListings(
  options: UsePaginatedListingsOptions,
): UsePaginatedListingsResult {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const optionsKey = JSON.stringify(options);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  const fetchPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      const requestId = ++requestIdRef.current;

      try {
        setError(null);
        const result = await getListings({ ...options, page: pageToLoad });

        if (requestId !== requestIdRef.current) return;

        setListings((prev) => (replace ? result.listings : [...prev, ...result.listings]));
        setPage(pageToLoad);
        setHasMore(pageToLoad < result.pagination.totalPages);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(getMarketplaceErrorMessage(err));
        if (replace) setListings([]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [optionsKey],
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    fetchPage(1, true).finally(() => setLoading(false));
  }, [fetchPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setHasMore(true);
    await fetchPage(1, true);
    setRefreshing(false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || loading || refreshing || !hasMore) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    fetchPage(page + 1, false).finally(() => {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    });
  }, [fetchPage, hasMore, loading, page, refreshing]);

  return {
    listings,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
  };
}
