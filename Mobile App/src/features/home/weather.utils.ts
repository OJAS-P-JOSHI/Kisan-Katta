/**
 * Pure utility functions for weather display icons / formatting.
 * Localization & farming advice live in `weather.localization.ts`.
 */

import { strings } from '@/constants';

export {
  getFarmingAdvice,
  getGreetingByTime,
  translateCondition,
  translateWindDirection,
  translateWeatherCondition,
  type FarmingAdviceInput,
  type GreetingByTime,
} from './weather.localization';

/** Subset of MaterialCommunityIcons names used for weather conditions. */
export type WeatherIconName =
  | 'weather-sunny'
  | 'weather-partly-cloudy'
  | 'weather-cloudy'
  | 'weather-fog'
  | 'weather-rainy'
  | 'weather-lightning'
  | 'weather-snowy'
  | 'weather-snowy-rainy'
  | 'weather-pouring'
  | 'weather-lightning-rainy';

/** Maps a backend condition string to a MaterialCommunityIcons name. */
export const getWeatherIcon = (condition: string): WeatherIconName => {
  const c = condition.toLowerCase();
  if (c === 'sunny' || c === 'clear') return 'weather-sunny';
  if (c.includes('partly cloud') || c.includes('partly cloudy')) return 'weather-partly-cloudy';
  if (c.includes('overcast') || c.includes('cloudy') || c.includes('cloud')) return 'weather-cloudy';
  if (c.includes('mist') || c.includes('fog')) return 'weather-fog';
  if (c.includes('thunder') || c.includes('lightning')) return 'weather-lightning-rainy';
  if (c.includes('blizzard') || c.includes('snow') || c.includes('ice pellet')) return 'weather-snowy';
  if (c.includes('sleet') || c.includes('freezing')) return 'weather-snowy-rainy';
  if (c.includes('heavy rain') || c.includes('torrential') || c.includes('pour')) return 'weather-pouring';
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return 'weather-rainy';
  return 'weather-cloudy';
};

/** Returns a farmer-friendly rain advisory based on daily chance of rain (%). */
export const getRainMessage = (chance: number): string => {
  const { weather } = strings.home;
  if (chance >= 80) return weather.rainHeavy;
  if (chance >= 50) return weather.rainLikely;
  if (chance >= 20) return weather.rainPossible;
  return weather.rainNone;
};

/** Returns a short farmer-friendly humidity label. */
export const getHumidityLabel = (humidity: number): string => {
  const { weather } = strings.home;
  if (humidity >= 90) return weather.humidityVeryHigh;
  if (humidity >= 75) return weather.humidityHigh;
  if (humidity >= 50) return weather.humidityModerate;
  return weather.humidityLow;
};

/** Returns a short UV index advisory. */
export const getUVLabel = (uv: number): string => {
  const { weather } = strings.home;
  if (uv >= 11) return weather.uvExtreme;
  if (uv >= 8) return weather.uvVeryHigh;
  if (uv >= 6) return weather.uvHigh;
  if (uv >= 3) return weather.uvModerate;
  return weather.uvLow;
};

/** Formats a date string ("2026-07-02") to a short Marathi weekday ("सोम"). */
export const formatDayShort = (dateStr: string): string => {
  const day = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`).getDay();
  const { weekdays } = strings.home.forecast;
  const map = [
    weekdays.sun,
    weekdays.mon,
    weekdays.tue,
    weekdays.wed,
    weekdays.thu,
    weekdays.fri,
    weekdays.sat,
  ] as const;
  return map[day] ?? weekdays.sun;
};

/** Formats a lastUpdated string ("2026-07-02 07:15") to "07:15 AM". */
export const formatUpdatedTime = (lastUpdated: string): string => {
  const d = new Date(lastUpdated.replace(' ', 'T'));
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};
