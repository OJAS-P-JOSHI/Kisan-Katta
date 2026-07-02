import { useCallback, useEffect, useState } from 'react';

import { getForecast } from '../weather.service';
import type { ForecastDay } from '../weather.types';

export type UseForecastReturn = {
  data: ForecastDay[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useForecast(): UseForecastReturn {
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const data = await getForecast();
      setForecast(data);
    } catch {
      setError('Unable to load forecast');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data: forecast, loading, error, refresh };
}
