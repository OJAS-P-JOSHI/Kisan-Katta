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

const normalizeCropKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const findMarathiCropName = (englishName: string): string | null => {
  const normalized = normalizeCropKey(englishName);
  if (!normalized) return null;

  const exact = CROP_MR_BY_KEY[normalized];
  if (exact) return exact;

  // Prefer longer keys first so "bengal gram" / "dry grapes" win over shorter tokens.
  const entries = Object.entries(CROP_MR_BY_KEY).sort((a, b) => b[0].length - a[0].length);
  for (const [key, marathi] of entries) {
    if (key.includes(' ')) {
      if (normalized.includes(key)) return marathi;
      continue;
    }
    // Whole-token match only — avoids "tur" matching "turmeric".
    const tokenRe = new RegExp(`(?:^|\\s)${key}(?:\\s|$)`);
    if (tokenRe.test(normalized)) return marathi;
  }

  return null;
};

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
