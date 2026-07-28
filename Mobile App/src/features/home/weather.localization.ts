/**
 * Weather localization & farmer messaging — single source of truth.
 *
 * Lookup maps are module-level (O(1), no per-render allocation).
 * Unknown API values fall back to the original English string.
 */

import { strings } from '@/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GreetingByTime = {
  text: string;
  emoji: string;
};

export type FarmingAdviceInput = {
  condition: string;
  temperatureC: number;
  /** Today's rain chance % from forecast day 0 — optional while forecast loads. */
  rainChance?: number;
  windKph: number;
  hasAlerts: boolean;
};

// ---------------------------------------------------------------------------
// Condition map (WeatherAPI common texts → Marathi)
// Keys are lowercased exact condition strings.
// ---------------------------------------------------------------------------

const CONDITION_MR: Readonly<Record<string, string>> = {
  sunny: 'सूर्यप्रकाश',
  clear: 'स्वच्छ आकाश',
  'partly cloudy': 'अंशतः ढगाळ',
  cloudy: 'ढगाळ',
  overcast: 'पूर्ण ढगाळ',
  mist: 'धुके',
  fog: 'दाट धुके',
  'freezing fog': 'गोठवणारे धुके',
  haze: 'धूसर वातावरण',
  'patchy rain nearby': 'आजूबाजूला हलका पाऊस',
  'patchy rain possible': 'पावसाची शक्यता',
  'patchy light rain': 'अनियमित हलका पाऊस',
  'light rain': 'हलका पाऊस',
  'light rain shower': 'हलकी पावसाची सरी',
  'moderate rain': 'मध्यम पाऊस',
  'moderate rain at times': 'कधी कधी मध्यम पाऊस',
  'moderate or heavy rain shower': 'मध्यम ते जोरदार पावसाची सरी',
  'heavy rain': 'मुसळधार पाऊस',
  'heavy rain at times': 'कधी कधी मुसळधार पाऊस',
  'torrential rain shower': 'प्रचंड पावसाची सरी',
  'light drizzle': 'रिमझिम पाऊस',
  'patchy light drizzle': 'अनियमित रिमझिम पाऊस',
  'freezing drizzle': 'गोठवणारा रिमझिम पाऊस',
  'heavy freezing drizzle': 'जोरदार गोठवणारा रिमझिम पाऊस',
  'patchy freezing drizzle possible': 'गोठवणार्‍या रिमझिम पावसाची शक्यता',
  'light freezing rain': 'हलका गोठवणारा पाऊस',
  'moderate or heavy freezing rain': 'मध्यम ते जोरदार गोठवणारा पाऊस',
  'thundery outbreaks possible': 'मेघगर्जनेची शक्यता',
  thunderstorm: 'मेघगर्जनेसह पाऊस',
  'patchy light rain with thunder': 'मेघगर्जनेसह हलका पाऊस',
  'moderate or heavy rain with thunder': 'मेघगर्जनेसह जोरदार पाऊस',
  'light sleet': 'हलका गारा व पाऊस',
  'moderate or heavy sleet': 'मध्यम ते जोरदार गारा व पाऊस',
  'patchy sleet possible': 'गारा व पावसाची शक्यता',
  'light sleet showers': 'हलकी गार्‍यांची सरी',
  'moderate or heavy sleet showers': 'मध्यम ते जोरदार गार्‍यांची सरी',
  snow: 'हिमवृष्टी',
  'blowing snow': 'वाऱ्यासोबत हिमवृष्टी',
  blizzard: 'हिमवादळ',
  'patchy light snow': 'अनियमित हलकी हिमवृष्टी',
  'light snow': 'हलकी हिमवृष्टी',
  'patchy moderate snow': 'अनियमित मध्यम हिमवृष्टी',
  'moderate snow': 'मध्यम हिमवृष्टी',
  'patchy heavy snow': 'अनियमित जोरदार हिमवृष्टी',
  'heavy snow': 'जोरदार हिमवृष्टी',
  'light snow showers': 'हलकी हिमवृष्टीची सरी',
  'moderate or heavy snow showers': 'मध्यम ते जोरदार हिमवृष्टीची सरी',
  'patchy light snow with thunder': 'मेघगर्जनेसह हलकी हिमवृष्टी',
  'moderate or heavy snow with thunder': 'मेघगर्जनेसह जोरदार हिमवृष्टी',
  'ice pellets': 'बर्फाचे गोळे',
  'light showers of ice pellets': 'हलकी बर्फाच्या गोळ्यांची सरी',
  'moderate or heavy showers of ice pellets': 'मध्यम ते जोरदार बर्फाच्या गोळ्यांची सरी',
  'patchy snow possible': 'हिमवृष्टीची शक्यता',
};

/** Ordered pattern fallbacks for near-matches not in the exact map. */
const CONDITION_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/partly\s*cloud/i, CONDITION_MR['partly cloudy']],
  [/thund|lightning/i, CONDITION_MR.thunderstorm],
  [/torrential|heavy\s*rain|pour/i, CONDITION_MR['heavy rain']],
  [/moderate\s*(or\s*heavy\s*)?rain/i, CONDITION_MR['moderate rain']],
  [/light\s*rain|patchy\s*light\s*rain/i, CONDITION_MR['light rain']],
  [/drizzle/i, CONDITION_MR['light drizzle']],
  [/patchy\s*rain/i, CONDITION_MR['patchy rain nearby']],
  [/rain|shower/i, 'पाऊस'],
  [/blizzard|blowing\s*snow|heavy\s*snow/i, CONDITION_MR.blizzard],
  [/snow|ice\s*pellet/i, CONDITION_MR.snow],
  [/sleet/i, CONDITION_MR['light sleet']],
  [/freezing\s*fog/i, CONDITION_MR['freezing fog']],
  [/fog/i, CONDITION_MR.fog],
  [/mist/i, CONDITION_MR.mist],
  [/haze/i, CONDITION_MR.haze],
  [/overcast/i, CONDITION_MR.overcast],
  [/cloud/i, CONDITION_MR.cloudy],
  [/sunny/i, CONDITION_MR.sunny],
  [/clear/i, CONDITION_MR.clear],
];

// ---------------------------------------------------------------------------
// Wind direction map (16-point compass)
// ---------------------------------------------------------------------------

const WIND_DIRECTION_MR: Readonly<Record<string, string>> = {
  N: 'उत्तर',
  NNE: 'उत्तर-ईशान्य',
  NE: 'ईशान्य',
  ENE: 'पूर्व-ईशान्य',
  E: 'पूर्व',
  ESE: 'पूर्व-आग्नेय',
  SE: 'आग्नेय',
  SSE: 'दक्षिण-आग्नेय',
  S: 'दक्षिण',
  SSW: 'दक्षिण-नैऋत्य',
  SW: 'नैऋत्य',
  WSW: 'पश्चिम-नैऋत्य',
  W: 'पश्चिम',
  WNW: 'पश्चिम-वायव्य',
  NW: 'वायव्य',
  NNW: 'उत्तर-वायव्य',
};

// ---------------------------------------------------------------------------
// Farming advice (module-level constants — no per-render allocation)
// ---------------------------------------------------------------------------

const ADVICE = {
  alert: 'आज हवामान इशाऱ्याकडे विशेष लक्ष द्या.',
  extremeHeat: 'दुपारच्या उन्हात शेतीची कामे टाळा.',
  cold: 'संवेदनशील पिकांची काळजी घ्या.',
  thunderstorm: 'मेघगर्जनेच्या वेळी उघड्यावर काम करू नका.',
  heavyRain: 'पिकांचे संरक्षण करा आणि पाणी साचणार नाही याची काळजी घ्या.',
  highWind: 'फवारणी पुढे ढकला.',
  lightRain: 'शेतातील पाण्याचा निचरा तपासा.',
  patchyRain: 'पावसाची शक्यता आहे.',
  sunny: 'आज सिंचनाचा विचार करा.',
  clear: 'शेतीच्या कामांसाठी चांगले हवामान.',
  cloudy: 'हवामानात बदल होऊ शकतो.',
  rainLikely: 'आज पाऊस अपेक्षित आहे — कामे नियोजनाने करा.',
  rainPossible: 'पावसाची शक्यता आहे.',
  favorable: 'शेतीसाठी हवामान अनुकूल आहे.',
} as const;

const HIGH_WIND_KPH = 40;
const EXTREME_HEAT_C = 38;
const COLD_C = 10;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Translates a WeatherAPI condition string to Marathi.
 * Exact map lookup first (O(1)); pattern fallback next; else original English.
 */
export function translateCondition(condition: string): string {
  if (!condition) return condition;
  const key = condition.trim().toLowerCase();
  const exact = CONDITION_MR[key];
  if (exact) return exact;

  for (const [pattern, mr] of CONDITION_PATTERNS) {
    if (pattern.test(condition)) return mr;
  }

  return condition;
}

/** Translates a compass wind-direction code (N, NE, WSW, …) to Marathi. */
export function translateWindDirection(direction: string): string {
  if (!direction) return direction;
  const key = direction.trim().toUpperCase();
  return WIND_DIRECTION_MR[key] ?? direction;
}

/**
 * Time-aware Marathi greeting from the device's local clock.
 * 05:00–11:59 सुप्रभात · 12:00–16:59 शुभ दुपार ·
 * 17:00–20:59 शुभ संध्याकाळ · 21:00–04:59 शुभ रात्री
 */
export function getGreetingByTime(now: Date = new Date()): GreetingByTime {
  const hour = now.getHours();
  const { greetings } = strings.home;

  if (hour >= 5 && hour < 12) return { text: greetings.morning, emoji: '🌅' };
  if (hour >= 12 && hour < 17) return { text: greetings.afternoon, emoji: '☀️' };
  if (hour >= 17 && hour < 21) return { text: greetings.evening, emoji: '🌇' };
  return { text: greetings.night, emoji: '🌙' };
}

/**
 * Farmer-oriented advice from current weather + alerts.
 * Alert-based advice always wins when `hasAlerts` is true.
 */
export function getFarmingAdvice(input: FarmingAdviceInput): string {
  const condition = (input.condition ?? '').toLowerCase();
  const rainChance = input.rainChance;
  const wind = input.windKph;
  const temp = input.temperatureC;

  if (input.hasAlerts) return ADVICE.alert;

  if (temp > EXTREME_HEAT_C) return ADVICE.extremeHeat;
  if (temp < COLD_C) return ADVICE.cold;

  if (/thund|lightning/.test(condition)) return ADVICE.thunderstorm;
  if (/heavy\s*rain|torrential|pour/.test(condition)) return ADVICE.heavyRain;

  if (wind >= HIGH_WIND_KPH) return ADVICE.highWind;

  if (/light\s*rain|drizzle|light\s*rain\s*shower/.test(condition)) return ADVICE.lightRain;
  if (/patchy\s*rain/.test(condition)) return ADVICE.patchyRain;

  if (condition === 'sunny' || condition.includes('sunny')) return ADVICE.sunny;
  if (condition === 'clear' || condition.includes('clear')) return ADVICE.clear;
  if (/cloud|overcast/.test(condition)) return ADVICE.cloudy;

  if (rainChance !== undefined) {
    if (rainChance >= 50) return ADVICE.rainLikely;
    if (rainChance >= 20) return ADVICE.rainPossible;
  }

  if (/rain|shower|sleet/.test(condition)) return ADVICE.patchyRain;

  return ADVICE.favorable;
}

/** @deprecated Prefer `translateCondition` — kept for any lingering imports. */
export const translateWeatherCondition = translateCondition;
