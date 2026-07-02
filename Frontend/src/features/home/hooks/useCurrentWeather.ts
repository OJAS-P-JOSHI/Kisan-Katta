import { useCallback, useEffect, useState } from 'react';

import { getCurrentWeather } from '../weather.service';
import type { CurrentWeather } from '../weather.types';

type State = {
  data: CurrentWeather | null;
  loading: boolean;
  error: string | null;
};

export type UseCurrentWeatherReturn = State & { refresh: () => Promise<void> };

export function useCurrentWeather(): UseCurrentWeatherReturn {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });

  const refresh = useCallback(async (): Promise<void> => {
    setState((s) => ({ data: s.data, loading: s.data === null, error: null }));
    try {
      const data = await getCurrentWeather();
      setState({ data, loading: false, error: null });
    } catch {
      setState((s) => ({ ...s, loading: false, error: 'Unable to load weather data' }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
