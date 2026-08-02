import { useCallback, useEffect, useState } from 'react';

import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { getMyMarketplaceSummary } from '../marketplace.service';
import type { MyMarketplaceSummary } from '../marketplace.types';

const EMPTY_SUMMARY: MyMarketplaceSummary = {
  active: 0,
  sold: 0,
  archived: 0,
  saved: 0,
};

/** Loads Home "My Marketplace" counts from GET /marketplace/my-summary. */
export function useMyMarketplaceSummary() {
  const [data, setData] = useState<MyMarketplaceSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const summary = await getMyMarketplaceSummary();
      setData(summary);
    } catch (err) {
      setError(getMarketplaceErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError(null);
        const summary = await getMyMarketplaceSummary();
        if (!cancelled) setData(summary);
      } catch (err) {
        if (!cancelled) setError(getMarketplaceErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error, refresh };
}
