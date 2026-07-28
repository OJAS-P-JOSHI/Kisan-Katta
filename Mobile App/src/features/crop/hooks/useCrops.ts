import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/utils';

import { fetchCrops } from '../crop.service';
import { cropStrings } from '../crop.strings';
import type { CropListItem } from '../crop.types';

type State = {
  data: CropListItem[];
  loading: boolean;
  error: string | null;
};

export type UseCropsReturn = State & { refresh: () => Promise<void> };

/** Loads and caches the full Crop Master list from the backend. */
export function useCrops(): UseCropsReturn {
  const [state, setState] = useState<State>({
    data: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async (): Promise<void> => {
    setState((s) => ({ ...s, loading: s.data.length === 0, error: null }));
    try {
      const data = await fetchCrops();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: getErrorMessage(err, cropStrings.loadError),
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
