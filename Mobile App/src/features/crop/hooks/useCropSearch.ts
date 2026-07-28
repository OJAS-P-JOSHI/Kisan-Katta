import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/utils';

import { searchCrops } from '../crop.service';
import { cropStrings } from '../crop.strings';
import type { CropListItem } from '../crop.types';

type State = {
  data: CropListItem[];
  loading: boolean;
  error: string | null;
};

export type UseCropSearchReturn = State & { refresh: () => Promise<void> };

/**
 * Backend crop search. Pass an empty / whitespace query to idle with [].
 * Ranking (English / Marathi / aliases) is done entirely by the API.
 */
export function useCropSearch(query: string | null | undefined): UseCropSearchReturn {
  const [state, setState] = useState<State>({
    data: [],
    loading: false,
    error: null,
  });

  const refresh = useCallback(async (): Promise<void> => {
    const trimmed = query?.trim() ?? '';
    if (!trimmed) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await searchCrops(trimmed);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: [],
        loading: false,
        error: getErrorMessage(err, cropStrings.searchError),
      });
    }
  }, [query]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
