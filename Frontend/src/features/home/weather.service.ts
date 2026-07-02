import { api } from '@/services/api';

import type {
  AlertsApiResponse,
  CurrentWeather,
  CurrentWeatherApiResponse,
  ForecastApiResponse,
  ForecastDay,
  WeatherAlert,
} from './weather.types';

const ENDPOINTS = {
  current: '/api/v1/weather/current',
  forecast: '/api/v1/weather/forecast',
  alerts: '/api/v1/weather/alerts',
} as const;

/**
 * Every weather request is scoped to the authenticated farmer's district
 * (from `GET /api/v1/profile/me`). Callers (see `useCurrentWeather`,
 * `useForecast`, `useWeatherAlerts`) must supply it — there is no default.
 */
export const getCurrentWeather = async (district: string): Promise<CurrentWeather> => {
  const { data } = await api.get<CurrentWeatherApiResponse>(
    `${ENDPOINTS.current}?district=${encodeURIComponent(district)}`,
  );
  return data.data;
};

export const getForecast = async (district: string): Promise<ForecastDay[]> => {
  const { data } = await api.get<ForecastApiResponse>(
    `${ENDPOINTS.forecast}?district=${encodeURIComponent(district)}&days=7`,
  );
  return data.data ?? [];
};

export const getWeatherAlerts = async (district: string): Promise<WeatherAlert[]> => {
  const { data } = await api.get<AlertsApiResponse>(
    `${ENDPOINTS.alerts}?district=${encodeURIComponent(district)}`,
  );
  return data.data.alerts;
};
