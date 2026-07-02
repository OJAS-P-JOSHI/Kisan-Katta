import { useCallback, useEffect, useState } from 'react';

import { getWeatherAlerts } from '../weather.service';
import type { WeatherAlert } from '../weather.types';

type State = {
  data: WeatherAlert[] | null;
  loading: boolean;
  error: string | null;
};

export type UseWeatherAlertsReturn = State & { refresh: () => Promise<void> };

/** `district` comes from the authenticated farmer's profile; pass `undefined` while it loads. */
export function useWeatherAlerts(district: string | undefined): UseWeatherAlertsReturn {
  const [state, setState] = useState<State>({ data: null, loading: !!district, error: null });

  const refresh = useCallback(async (): Promise<void> => {
    if (!district) return;
    setState((s) => ({ data: s.data, loading: s.data === null, error: null }));
    try {
      const data = await getWeatherAlerts(district);
      setState({ data, loading: false, error: null });
    } catch {
      setState((s) => ({ ...s, loading: false, error: 'Unable to load weather alerts' }));
    }
  }, [district]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
