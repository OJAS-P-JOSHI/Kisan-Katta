/**
 * Weather domain types that exactly mirror the backend DTO responses.
 * Do NOT use raw WeatherAPI field names (temp_c, feelslike_c, wind_kph, etc.)
 * anywhere in the frontend — always use these types.
 */

// ---------------------------------------------------------------------------
// Current weather  —  GET /api/v1/weather/current?district=<district>
// ---------------------------------------------------------------------------

export type CurrentWeather = {
  lastUpdated: string;
  temperatureC: number;
  condition: string;
  icon: string;
  humidity: number;
  windKph: number;
  windDirection: string;
  precipitationMm: number;
  cloud: number;
  uv: number;
  feelsLikeC: number;
};

export type CurrentWeatherApiResponse = {
  success: boolean;
  data: CurrentWeather;
};

// ---------------------------------------------------------------------------
// 7-day forecast  —  GET /api/v1/weather/forecast?district=<district>&days=7
// ---------------------------------------------------------------------------

export type ForecastDay = {
  date: string;
  maxTempC: number;
  minTempC: number;
  dailyChanceOfRain: number;
  avgHumidity: number;
  condition: string;
  icon: string;
};

export type ForecastApiResponse = {
  success: boolean;
  data: ForecastDay[];
};

// ---------------------------------------------------------------------------
// Weather alerts  —  GET /api/v1/weather/alerts?district=<district>
// ---------------------------------------------------------------------------

export type WeatherAlert = {
  headline: string;
  severity: string;
  event: string;
  effective: string;
  expires: string;
  desc: string;
};

export type AlertsApiResponse = {
  success: boolean;
  data: {
    alerts: WeatherAlert[];
  };
};
