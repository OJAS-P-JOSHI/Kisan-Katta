import { useCallback, useEffect, useState } from 'react';

import { getWeatherAlerts } from '../weather.service';
import type { WeatherAlert } from '../weather.types';

type State = {
  data: WeatherAlert[] | null;
  loading: boolean;
  error: string | null;
};

export type UseWeatherAlertsReturn = State & { refresh: () => Promise<void> };

export function useWeatherAlerts(): UseWeatherAlertsReturn {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });

  const refresh = useCallback(async (): Promise<void> => {
    setState((s) => ({ data: s.data, loading: s.data === null, error: null }));
    try {
      const data = await getWeatherAlerts();
      setState({ data, loading: false, error: null });
    } catch {
      setState((s) => ({ ...s, loading: false, error: 'Unable to load weather alerts' }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
