import { useCallback, useEffect, useState } from 'react';

import { getForecast } from '../weather.service';
import type { ForecastDay } from '../weather.types';

export type UseForecastReturn = {
  data: ForecastDay[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/** `district` comes from the authenticated farmer's profile; pass `undefined` while it loads. */
export function useForecast(district: string | undefined): UseForecastReturn {
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(!!district);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!district) return;
    setError(null);
    setLoading(true);
    try {
      const data = await getForecast(district);
      setForecast(data);
    } catch {
      setError('Unable to load forecast');
    } finally {
      setLoading(false);
    }
  }, [district]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data: forecast, loading, error, refresh };
}
