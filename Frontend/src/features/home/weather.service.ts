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
 * Temporary hardcoded district until user profile / location selection is implemented.
 * Replace with the authenticated farmer's district once the profile module exists.
 *
 * The district is embedded directly in each URL string so the query string is a
 * visible literal in the source — unambiguous regardless of Metro bundler cache.
 */
const DEFAULT_DISTRICT = 'Pune';

export const getCurrentWeather = async (): Promise<CurrentWeather> => {
  const { data } = await api.get<CurrentWeatherApiResponse>(
    `${ENDPOINTS.current}?district=${DEFAULT_DISTRICT}`,
  );
  return data.data;
};

export const getForecast = async (): Promise<ForecastDay[]> => {
  const { data } = await api.get<ForecastApiResponse>(
    `${ENDPOINTS.forecast}?district=${DEFAULT_DISTRICT}&days=7`,
  );
  return data.data ?? [];
};

export const getWeatherAlerts = async (): Promise<WeatherAlert[]> => {
  const { data } = await api.get<AlertsApiResponse>(
    `${ENDPOINTS.alerts}?district=${DEFAULT_DISTRICT}`,
  );
  return data.data.alerts;
};
