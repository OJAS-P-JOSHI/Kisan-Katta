import { useCallback, useEffect, useRef, useState } from 'react';

import { getAssistanceErrorMessage } from '../assistance.errors';
import { getHelpRequests, getMyHelpRequests } from '../assistance.service';
import type {
  HelpRequest,
  HelpRequestSortOption,
  HelpRequestStatus,
} from '../assistance.types';

export type HelpRequestScope = 'feed' | 'mine';

type UsePaginatedHelpRequestsOptions = {
  /** `feed` reads the public list, `mine` reads the author's own requests. */
  scope: HelpRequestScope;
  search?: string;
  district?: string;
  sort?: HelpRequestSortOption;
  status?: HelpRequestStatus;
};

type UsePaginatedHelpRequestsResult = {
  requests: HelpRequest[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  refresh: () => Promise<void>;
  loadMore: () => void;
  /** Replaces one card in place after support / resolve, without a refetch. */
  replaceRequest: (request: HelpRequest) => void;
  removeRequest: (requestId: string) => void;
};

/** Paginated help requests with pull-to-refresh and infinite scroll. */
export function usePaginatedHelpRequests(
  options: UsePaginatedHelpRequestsOptions,
): UsePaginatedHelpRequestsResult {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const optionsKey = JSON.stringify(options);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  const fetchPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      const requestId = ++requestIdRef.current;

      try {
        setError(null);
        const result =
          options.scope === 'mine'
            ? await getMyHelpRequests({
                page: pageToLoad,
                ...(options.status ? { status: options.status } : {}),
              })
            : await getHelpRequests({
                page: pageToLoad,
                ...(options.search ? { search: options.search } : {}),
                ...(options.district ? { district: options.district } : {}),
                ...(options.sort ? { sort: options.sort } : {}),
              });

        if (requestId !== requestIdRef.current) return;

        setRequests((prev) => {
          if (replace) return result.requests;
          const seen = new Set(prev.map((item) => item.id));
          const appended = result.requests.filter((item) => !seen.has(item.id));
          return appended.length === 0 ? prev : [...prev, ...appended];
        });
        setPage(pageToLoad);
        setTotal(result.pagination.total);
        setHasMore(pageToLoad < result.pagination.totalPages);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(getAssistanceErrorMessage(err));
        if (replace) setRequests([]);
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

  const replaceRequest = useCallback((updated: HelpRequest) => {
    setRequests((prev) =>
      prev.map((request) => (request.id === updated.id ? updated : request)),
    );
  }, []);

  const removeRequest = useCallback((requestId: string) => {
    setRequests((prev) => prev.filter((request) => request.id !== requestId));
  }, []);

  return {
    requests,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    total,
    refresh,
    loadMore,
    replaceRequest,
    removeRequest,
  };
}
