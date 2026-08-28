import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/utils';

import { getRepresentativeDiscovery } from '../gram-sahakari.service';
import type { RepresentativeDiscovery } from '../gram-sahakari.types';

const EMPTY: RepresentativeDiscovery = {
  available: false,
  matchLevel: null,
  representatives: [],
  profileComplete: true,
};

/** Loads Gram Sahakari representative discovery for the Home screen (single request). */
export function useGramSahakariRepresentative() {
  const [data, setData] = useState<RepresentativeDiscovery>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const result = await getRepresentativeDiscovery();
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load Gram Sahakari.'));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError(null);
        const result = await getRepresentativeDiscovery();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load Gram Sahakari.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const silentRefresh = useCallback(async () => {
    setLoading(false);
    await refresh();
  }, [refresh]);

  return { data, loading, error, refresh, silentRefresh };
}
