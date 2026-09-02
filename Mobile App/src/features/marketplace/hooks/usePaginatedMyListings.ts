import { useCallback, useEffect, useRef, useState } from 'react';

import { DEFAULT_LIMIT } from '../marketplace.constants';
import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { getMyListings } from '../marketplace.service';
import type { ListingStatus, MarketplaceListing } from '../marketplace.types';

type UsePaginatedMyListingsResult = {
  listings: MarketplaceListing[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => void;
  replaceListing: (listing: MarketplaceListing) => void;
};

const mergeUniqueListings = (
  current: MarketplaceListing[],
  incoming: MarketplaceListing[],
  replace: boolean,
): MarketplaceListing[] => {
  if (replace) return incoming;
  const seen = new Set(current.map((listing) => listing.id));
  const appended = incoming.filter((listing) => !seen.has(listing.id));
  return appended.length === 0 ? current : [...current, ...appended];
};

/** Paginated owner listings. Status is sent to the API, not filtered locally. */
export function usePaginatedMyListings(status: ListingStatus): UsePaginatedMyListingsResult {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [seenStatus, setSeenStatus] = useState(status);

  if (seenStatus !== status) {
    setSeenStatus(status);
    setListings([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setLoading(true);
  }

  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  const fetchPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      const requestId = ++requestIdRef.current;

      try {
        const result = await getMyListings(pageToLoad, DEFAULT_LIMIT, status);

        if (requestId !== requestIdRef.current) return;

        setError(null);
        setListings((prev) => mergeUniqueListings(prev, result.listings, replace));
        setPage(pageToLoad);
        setHasMore(pageToLoad < result.pagination.totalPages);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(getMarketplaceErrorMessage(err));
        if (replace) setListings([]);
      } finally {
        if (replace && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [status],
  );

  useEffect(() => {
    // Data fetch: React Compiler treats the async helper as sync setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- paginated fetch
    void fetchPage(1, true);
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

  const replaceListing = useCallback((listing: MarketplaceListing) => {
    setListings((prev) => prev.map((item) => (item.id === listing.id ? listing : item)));
  }, []);

  return {
    listings,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    replaceListing,
  };
}
