/**
 * Pure utility functions for weather display.
 * All farmer-friendly text and icon mapping lives here.
 * No React imports — safe to use anywhere.
 */

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
  if (chance >= 80) return 'Heavy rain likely – plan field work carefully';
  if (chance >= 50) return 'Rain expected today';
  if (chance >= 20) return 'Possible light rain today';
  return 'No rain expected today';
};

/** Returns a short farmer-friendly humidity label. */
export const getHumidityLabel = (humidity: number): string => {
  if (humidity >= 90) return 'Very high – fungal disease risk';
  if (humidity >= 75) return 'High humidity';
  if (humidity >= 50) return 'Moderate humidity';
  return 'Low humidity';
};

/** Returns a short UV index advisory. */
export const getUVLabel = (uv: number): string => {
  if (uv >= 11) return 'Extreme UV';
  if (uv >= 8) return 'Very high UV';
  if (uv >= 6) return 'High UV';
  if (uv >= 3) return 'Moderate UV';
  return 'Low UV';
};

/** Returns a time-aware greeting. */
export const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/** Formats a date string ("2026-07-02") to a short weekday name ("Mon"). */
export const formatDayShort = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short' });

/** Formats a lastUpdated string ("2026-07-02 07:15") to "07:15 AM". */
export const formatUpdatedTime = (lastUpdated: string): string => {
  const d = new Date(lastUpdated.replace(' ', 'T'));
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};
