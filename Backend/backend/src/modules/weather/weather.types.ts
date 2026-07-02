// ---------------------------------------------------------------------------
// Application DTOs — what callers receive. Never expose WeatherAPI fields.
// ---------------------------------------------------------------------------

export interface CurrentWeatherDTO {
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
}

export interface ForecastDayDTO {
  date: string;
  maxTempC: number;
  minTempC: number;
  avgTempC: number;
  maxWindKph: number;
  totalPrecipitationMm: number;
  averageHumidity: number;
  condition: string;
  icon: string;
  willRain: boolean;
  chanceOfRain: number;
  uv: number;
}

// Fields from WeatherAPI alerts that are meaningful for farmers.
export interface AlertDTO {
  headline: string;
  severity: string;
  urgency: string;
  areas: string;
  event: string;
  effective: string;
  expires: string;
  description: string;
  instruction: string;
}

export interface AlertsResponseDTO {
  alerts: AlertDTO[];
}

// ---------------------------------------------------------------------------
// Validated query shapes passed from controllers to the service.
// ---------------------------------------------------------------------------

export interface CurrentWeatherQuery {
  district: string;
}

export interface ForecastQuery {
  district: string;
  days: number;
}

export interface AlertsQuery {
  district: string;
}

// ---------------------------------------------------------------------------
// Raw WeatherAPI.com response types.
// Kept here so weather.service.ts is the only file that ever references
// WeatherAPI field names directly.
// ---------------------------------------------------------------------------

// Shared condition block used by current + forecast + day responses.
interface WeatherApiCondition {
  text?: string;
  icon?: string;
}

// Shared error block — WeatherAPI embeds errors inside the response body.
export interface WeatherApiErrorBody {
  code: number;
  message: string;
}

export interface WeatherApiCurrentResponse {
  current?: {
    last_updated?: string;
    temp_c?: number;
    condition?: WeatherApiCondition;
    humidity?: number;
    wind_kph?: number;
    wind_dir?: string;
    precip_mm?: number;
    cloud?: number;
    uv?: number;
    feelslike_c?: number;
  };
  error?: WeatherApiErrorBody;
}

export interface WeatherApiForecastResponse {
  forecast?: {
    forecastday?: Array<{
      date?: string;
      day?: {
        maxtemp_c?: number;
        mintemp_c?: number;
        avgtemp_c?: number;
        maxwind_kph?: number;
        totalprecip_mm?: number;
        avghumidity?: number;
        condition?: WeatherApiCondition;
        daily_will_it_rain?: number;
        daily_chance_of_rain?: number;
        uv?: number;
      };
    }>;
  };
  error?: WeatherApiErrorBody;
}

// forecast.json with alerts=yes includes an additional `alerts` key.
export interface WeatherApiAlertsResponse {
  alerts?: {
    alert?: Array<{
      headline?: string;
      severity?: string;
      urgency?: string;
      areas?: string;
      event?: string;
      effective?: string;
      expires?: string;
      desc?: string;
      instruction?: string;
    }>;
  };
  error?: WeatherApiErrorBody;
}

