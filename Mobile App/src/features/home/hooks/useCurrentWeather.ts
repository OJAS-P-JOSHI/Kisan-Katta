import { useCallback, useEffect, useState } from 'react';

import { getCurrentWeather } from '../weather.service';
import type { CurrentWeather } from '../weather.types';

type State = {
  data: CurrentWeather | null;
  loading: boolean;
  error: string | null;
};

export type UseCurrentWeatherReturn = State & { refresh: () => Promise<void> };

/** `district` comes from the authenticated farmer's profile; pass `undefined` while it loads. */
export function useCurrentWeather(district: string | undefined): UseCurrentWeatherReturn {
  const [state, setState] = useState<State>({ data: null, loading: !!district, error: null });

  const refresh = useCallback(async (): Promise<void> => {
    if (!district) return;
    setState((s) => ({ data: s.data, loading: s.data === null, error: null }));
    try {
      const data = await getCurrentWeather(district);
      setState({ data, loading: false, error: null });
    } catch {
      setState((s) => ({ ...s, loading: false, error: 'Unable to load weather data' }));
    }
  }, [district]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
