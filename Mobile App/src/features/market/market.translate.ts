/**
 * Presentation-only Marathi helpers for the Market feature.
 * Never mutate Agmarknet commodity strings used in API requests.
 */

/** Formats UI copy as `मराठी (English)`. */
export const bilingualLabel = (marathi: string, english: string): string =>
  `${marathi} (${english})`;

/**
 * Canonical English keys (lowercase) → Marathi display name.
 * Matching is applied only while rendering.
 */
const CROP_MR_BY_KEY: Record<string, string> = {
  onion: 'कांदा',
  tomato: 'टोमॅटो',
  potato: 'बटाटा',
  brinjal: 'वांगे',
  eggplant: 'वांगे',
  okra: 'भेंडी',
  bhindi: 'भेंडी',
  'ladies finger': 'भेंडी',
  cotton: 'कापूस',
  soybean: 'सोयाबीन',
  soyabean: 'सोयाबीन',
  wheat: 'गहू',
  rice: 'तांदूळ',
  paddy: 'तांदूळ',
  maize: 'मका',
  corn: 'मका',
  sugarcane: 'ऊस',
  tur: 'तूर',
  arhar: 'तूर',
  'pigeon pea': 'तूर',
  gram: 'हरभरा',
  chickpea: 'हरभरा',
  'bengal gram': 'हरभरा',
  groundnut: 'शेंगदाणा',
  peanut: 'शेंगदाणा',
  grapes: 'द्राक्ष',
  grape: 'द्राक्ष',
  'dry grapes': 'मनुका',
  raisin: 'मनुका',
  pomegranate: 'डाळिंब',
  banana: 'केळी',
};

const CROP_EMOJI_BY_KEY: Record<string, string> = {
  onion: '🧅',
  tomato: '🍅',
  potato: '🥔',
  brinjal: '🍆',
  eggplant: '🍆',
  okra: '🌿',
  bhindi: '🌿',
  'ladies finger': '🌿',
  cotton: '☁️',
  soybean: '🌱',
  soyabean: '🌱',
  wheat: '🌾',
  rice: '🍚',
  paddy: '🌾',
  maize: '🌽',
  corn: '🌽',
  sugarcane: '🎋',
  tur: '🫘',
  arhar: '🫘',
  'pigeon pea': '🫘',
  gram: '🫘',
  chickpea: '🫘',
  'bengal gram': '🫘',
  groundnut: '🥜',
  peanut: '🥜',
  grapes: '🍇',
  grape: '🍇',
  'dry grapes': '🍇',
  raisin: '🍇',
  pomegranate: '🍎',
  banana: '🍌',
};

const normalizeCropKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const findMappedValue = <T,>(englishName: string, map: Record<string, T>): T | null => {
  const normalized = normalizeCropKey(englishName);
  if (!normalized) return null;

  const exact = map[normalized];
  if (exact) return exact;

  const entries = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
  for (const [key, value] of entries) {
    if (key.includes(' ')) {
      if (normalized.includes(key)) return value;
      continue;
    }
    const tokenRe = new RegExp(`(?:^|\\s)${key}(?:\\s|$)`);
    if (tokenRe.test(normalized)) return value;
  }

  return null;
};

const findMarathiCropName = (englishName: string): string | null =>
  findMappedValue(englishName, CROP_MR_BY_KEY);

/**
 * Renders an Agmarknet commodity for UI only.
 * Example: `Onion` → `कांदा (Onion)`
 * Unknown crops: `Foo` → `Foo (Foo)`
 */
export const translateCropName = (englishName: string): string => {
  const original = englishName.trim();
  if (!original) return bilingualLabel(englishName, englishName);

  const marathi = findMarathiCropName(original);
  if (!marathi) return bilingualLabel(original, original);
  return bilingualLabel(marathi, original);
};

/** Two-line display parts so long Agmarknet names wrap without truncation. */
export const getCropDisplayParts = (
  englishName: string,
): { marathi: string; english: string } => {
  const original = englishName.trim();
  const marathi = findMarathiCropName(original) ?? original;
  return { marathi, english: original || englishName };
};

/** Optional crop emoji for premium chips/rows (presentation only). */
export const getCropEmoji = (englishName: string): string =>
  findMappedValue(englishName, CROP_EMOJI_BY_KEY) ?? '🌿';
