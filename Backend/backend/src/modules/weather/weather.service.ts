import axios from "axios";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { resolveDistrict } from "../../config/maharashtraDistrictCoordinates";
import {
  AlertDTO,
  AlertsQuery,
  AlertsResponseDTO,
  CurrentWeatherDTO,
  CurrentWeatherQuery,
  ForecastDayDTO,
  ForecastQuery,
  WeatherApiAlertsResponse,
  WeatherApiCurrentResponse,
  WeatherApiForecastResponse,
} from "./weather.types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEATHER_API_BASE = "https://api.weatherapi.com/v1";
const REQUEST_TIMEOUT_MS = 10_000;

const CURRENT_CACHE_TTL_MS  =  5 * 60 * 1000; //  5 minutes
const FORECAST_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const ALERTS_CACHE_TTL_MS   = 10 * 60 * 1000; // 10 minutes

// ---------------------------------------------------------------------------
// Generic in-memory cache
// Swap the Map for a Redis client here later without touching any caller.
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const currentCache  = new Map<string, CacheEntry<CurrentWeatherDTO>>();
const forecastCache = new Map<string, CacheEntry<ForecastDayDTO[]>>();
const alertsCache   = new Map<string, CacheEntry<AlertsResponseDTO>>();

const getCached = <T>(cache: Map<string, CacheEntry<T>>, key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt > Date.now()) return entry.data;
  cache.delete(key); // evict expired entry
  return null;
};

const setCache = <T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  data: T,
  ttlMs: number
): void => {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
};

// ---------------------------------------------------------------------------
// WeatherAPI error code → HTTP status mapping
// https://www.weatherapi.com/docs/#intro-error-codes
// ---------------------------------------------------------------------------

const WEATHER_API_ERROR_CODES: Record<number, { status: number; message: string }> = {
  1006: { status: 404, message: "District not found. Please check the district name." },
  2006: { status: 500, message: "Weather API key is not configured correctly." },
  2007: { status: 429, message: "Weather API quota exceeded. Please try again later." },
  2008: { status: 500, message: "Weather API key has been disabled." },
  2009: { status: 403, message: "Weather API key does not have access to this resource." },
};

// Translates any upstream/network failure into a typed AppError so the
// global error handler always returns a structured, meaningful response.
// API key is never included in logged output.
const mapWeatherApiError = (error: unknown, context: string): AppError => {
  if (axios.isAxiosError(error)) {
    // WeatherAPI can embed an error object inside a 400 response body.
    const apiError = error.response?.data?.error as
      | { code: number; message: string }
      | undefined;

    if (apiError) {
      const mapped = WEATHER_API_ERROR_CODES[apiError.code];
      if (mapped) return new AppError(mapped.message, mapped.status);
      return new AppError(`Weather API error: ${apiError.message}`, 502);
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      // eslint-disable-next-line no-console
      console.error(`[WeatherService] ${context} timed out:`, error.code);
      return new AppError("Weather service timed out. Please try again.", 504);
    }

    // eslint-disable-next-line no-console
    console.error(`[WeatherService] ${context} network error:`, error.code ?? error.message);
    return new AppError("Weather service is currently unavailable.", 503);
  }

  // eslint-disable-next-line no-console
  console.error(`[WeatherService] ${context} unexpected error:`, error);
  return new AppError("An unexpected error occurred while fetching weather data.", 500);
};

// Checks for an inline error body (WeatherAPI sometimes returns 200 + error).
const checkInlineError = (error: { code: number; message: string } | undefined): void => {
  if (!error) return;
  const mapped = WEATHER_API_ERROR_CODES[error.code];
  throw mapped
    ? new AppError(mapped.message, mapped.status)
    : new AppError(`Weather API error: ${error.message}`, 502);
};

// ---------------------------------------------------------------------------
// Transformation helpers — the only place WeatherAPI field names appear.
// ---------------------------------------------------------------------------

// WeatherAPI returns protocol-relative icon URLs (//cdn.weatherapi.com/...).
// Prefix with https: so clients always receive an absolute URL.
const absoluteIcon = (icon: string | undefined): string =>
  icon ? `https:${icon}` : "";

const toCurrentWeatherDTO = (raw: WeatherApiCurrentResponse): CurrentWeatherDTO => {
  const c = raw.current ?? {};
  return {
    lastUpdated:    c.last_updated ?? "",
    temperatureC:   c.temp_c       ?? 0,
    condition:      c.condition?.text ?? "",
    icon:           absoluteIcon(c.condition?.icon),
    humidity:       c.humidity     ?? 0,
    windKph:        c.wind_kph     ?? 0,
    windDirection:  c.wind_dir     ?? "",
    precipitationMm: c.precip_mm  ?? 0,
    cloud:          c.cloud        ?? 0,
    uv:             c.uv           ?? 0,
    feelsLikeC:     c.feelslike_c  ?? 0,
  };
};

const toForecastDayDTO = (
  day: NonNullable<NonNullable<WeatherApiForecastResponse["forecast"]>["forecastday"]>[number]
): ForecastDayDTO => {
  const d = day.day ?? {};
  return {
    date:                 day.date             ?? "",
    maxTempC:             d.maxtemp_c          ?? 0,
    minTempC:             d.mintemp_c          ?? 0,
    avgTempC:             d.avgtemp_c          ?? 0,
    maxWindKph:           d.maxwind_kph        ?? 0,
    totalPrecipitationMm: d.totalprecip_mm     ?? 0,
    averageHumidity:      d.avghumidity        ?? 0,
    condition:            d.condition?.text    ?? "",
    icon:                 absoluteIcon(d.condition?.icon),
    // daily_will_it_rain is an integer (0 or 1) — convert to boolean.
    willRain:             (d.daily_will_it_rain    ?? 0) === 1,
    chanceOfRain:         d.daily_chance_of_rain   ?? 0,
    uv:                   d.uv                     ?? 0,
  };
};

const toAlertDTO = (
  raw: NonNullable<NonNullable<WeatherApiAlertsResponse["alerts"]>["alert"]>[number]
): AlertDTO => ({
  headline:    raw.headline    ?? "",
  severity:    raw.severity    ?? "",
  urgency:     raw.urgency     ?? "",
  areas:       raw.areas       ?? "",
  event:       raw.event       ?? "",
  effective:   raw.effective   ?? "",
  expires:     raw.expires     ?? "",
  description: raw.desc        ?? "",
  instruction: raw.instruction ?? "",
});

// ---------------------------------------------------------------------------
// Public service API
// ---------------------------------------------------------------------------

export const getCurrentWeather = async (
  query: CurrentWeatherQuery
): Promise<CurrentWeatherDTO> => {
  // Resolve district → coordinates. Throws 404 for unknown districts.
  const { cacheKey, coordQuery } = resolveDistrict(query.district);

  const cached = getCached(currentCache, cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get<WeatherApiCurrentResponse>(
      `${WEATHER_API_BASE}/current.json`,
      {
        timeout: REQUEST_TIMEOUT_MS,
        params: { key: env.weatherApiKey, q: coordQuery, aqi: "no" },
      }
    );

    checkInlineError(data.error);

    const result = toCurrentWeatherDTO(data);
    setCache(currentCache, cacheKey, result, CURRENT_CACHE_TTL_MS);
    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw mapWeatherApiError(error, "getCurrentWeather");
  }
};

export const getForecast = async (
  query: ForecastQuery
): Promise<ForecastDayDTO[]> => {
  const { cacheKey, coordQuery } = resolveDistrict(query.district);
  const fullKey = `${cacheKey}|${query.days}`;

  const cached = getCached(forecastCache, fullKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get<WeatherApiForecastResponse>(
      `${WEATHER_API_BASE}/forecast.json`,
      {
        timeout: REQUEST_TIMEOUT_MS,
        params: {
          key: env.weatherApiKey,
          q: coordQuery,
          days: query.days,
          aqi: "no",
          alerts: "no",
        },
      }
    );

    checkInlineError(data.error);

    const result = (data.forecast?.forecastday ?? []).map(toForecastDayDTO);
    setCache(forecastCache, fullKey, result, FORECAST_CACHE_TTL_MS);
    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw mapWeatherApiError(error, "getForecast");
  }
};

export const getAlerts = async (
  query: AlertsQuery
): Promise<AlertsResponseDTO> => {
  const { cacheKey, coordQuery } = resolveDistrict(query.district);

  const cached = getCached(alertsCache, cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get<WeatherApiAlertsResponse>(
      `${WEATHER_API_BASE}/forecast.json`,
      {
        timeout: REQUEST_TIMEOUT_MS,
        params: {
          key: env.weatherApiKey,
          q: coordQuery,
          days: 1,
          aqi: "no",
          alerts: "yes",
        },
      }
    );

    checkInlineError(data.error);

    const result: AlertsResponseDTO = {
      alerts: (data.alerts?.alert ?? []).map(toAlertDTO),
    };

    setCache(alertsCache, cacheKey, result, ALERTS_CACHE_TTL_MS);
    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw mapWeatherApiError(error, "getAlerts");
  }
};

