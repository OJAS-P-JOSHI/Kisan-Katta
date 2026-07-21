import { AGMARKNET_COMMODITIES } from './agmarknetCommodities';

/**
 * Curated Maharashtra crop options for profile favourite-crop selection.
 * `value` MUST be an exact Agmarknet commodity string (see `agmarknetCommodities.ts`).
 * `label` is UI-only (Marathi + English).
 */
export type MaharashtraCrop = {
  id: string;
  label: string;
  value: string;
};

const assertAgmarknetValue = (value: string): string => {
  if (!(AGMARKNET_COMMODITIES as readonly string[]).includes(value)) {
    throw new Error(`maharashtraCrops: "${value}" is not an Agmarknet commodity`);
  }
  return value;
};

const crop = (id: string, label: string, value: string): MaharashtraCrop => ({
  id,
  label,
  value: assertAgmarknetValue(value),
});

export const MAHARASHTRA_CROPS: readonly MaharashtraCrop[] = [
  crop('cotton', 'कापूस (Cotton)', 'Cotton'),
  crop('soyabean', 'सोयाबीन (Soyabean)', 'Soyabean'),
  crop('onion', 'कांदा (Onion)', 'Onion'),
  crop('groundnut', 'भुईमूग (Groundnut)', 'Groundnut'),
  crop('tur', 'तूर (Tur / Red Gram)', 'Red gram/Arhar/Tur(whole)'),
  crop('wheat', 'गहू (Wheat)', 'Wheat'),
  crop('jowar', 'ज्वारी (Jowar)', 'Jowar(Sorghum)'),
  crop('bajra', 'बाजरी (Bajra)', 'Bajra(Pearl Millet/Cumbu)'),
  crop('maize', 'मका (Maize)', 'Maize'),
  crop('paddy', 'भात / धान (Paddy)', 'Paddy(Dhan)(Common)'),
  crop('rice', 'तांदूळ (Rice)', 'Rice'),
  crop('sugarcane', 'ऊस (Sugarcane)', 'Sugarcane'),
  crop('bengal-gram', 'हरभरा (Bengal Gram)', 'Bengal Gram(Gram)(Whole)'),
  crop('green-gram', 'मूग (Green Gram)', 'Green Gram(Moong)(Whole)'),
  crop('black-gram', 'उडीद (Black Gram)', 'Black Gram (Urd Beans)(Whole)'),
  crop('tomato', 'टोमॅटो (Tomato)', 'Tomato'),
  crop('brinjal', 'वांगी (Brinjal)', 'Brinjal'),
  crop('bhindi', 'भेंडी (Okra)', 'Bhindi(Ladies Finger)'),
  crop('potato', 'बटाटा (Potato)', 'Potato'),
  crop('garlic', 'लसूण (Garlic)', 'Garlic'),
  crop('green-chilli', 'हिरवी मिरची (Green Chilli)', 'Green Chilli'),
  crop('dry-chillies', 'सुकी मिरची (Dry Chillies)', 'Dry Chillies'),
  crop('cabbage', 'कोबी (Cabbage)', 'Cabbage'),
  crop('cauliflower', 'फुलकोबी (Cauliflower)', 'Cauliflower'),
  crop('cucumber', 'काकडी (Cucumber)', 'Cucumbar(Kheera)'),
  crop('bottle-gourd', 'दुधी भोपळा (Bottle Gourd)', 'Bottle gourd'),
  crop('bitter-gourd', 'कारले (Bitter Gourd)', 'Bitter gourd'),
  crop('pumpkin', 'भोपळा (Pumpkin)', 'Pumpkin'),
  crop('cluster-beans', 'गवार (Cluster Beans)', 'Cluster beans'),
  crop('spinach', 'पालक (Spinach)', 'Spinach'),
  crop('methi', 'मेथी (Methi)', 'Methi(Leaves)'),
  crop('coriander', 'कोथिंबीर (Coriander)', 'Coriander(Leaves)'),
  crop('grapes', 'द्राक्षे (Grapes)', 'Grapes'),
  crop('pomegranate', 'डाळिंब (Pomegranate)', 'Pomegranate'),
  crop('mango', 'आंबा (Mango)', 'Mango'),
  crop('banana', 'केळी (Banana)', 'Banana'),
  crop('orange', 'संत्रे (Orange)', 'Orange'),
  crop('sweet-lime', 'मोसंबी (Sweet Lime)', 'Mousambi(Sweet Lime)'),
  crop('guava', 'पेरू (Guava)', 'Guava'),
  crop('papaya', 'पपई (Papaya)', 'Papaya'),
  crop('chikoo', 'चिकू (Sapota)', 'Chikoos(Sapota)'),
  crop('custard-apple', 'सीताफळ (Custard Apple)', 'Custard Apple(Sharifa)'),
  crop('watermelon', 'टरबूज (Watermelon)', 'Water Melon'),
  crop('muskmelon', 'खरबूज (Musk Melon)', 'Karbuja(Musk Melon)'),
  crop('turmeric', 'हळद (Turmeric)', 'Turmeric'),
  crop('ginger-green', 'आले (Ginger)', 'Ginger(Green)'),
  crop('sesamum', 'तीळ (Sesame)', 'Sesamum(Sesame,Gingelly,Til)'),
  crop('sunflower', 'सूर्यफूल (Sunflower)', 'Sunflower'),
  crop('safflower', 'करडई (Safflower)', 'Safflower'),
  crop('mustard', 'मोहरी (Mustard)', 'Mustard'),
  crop('castor', 'एरंडी (Castor)', 'Castor Seed'),
  crop('niger', 'खुरासणी (Niger)', 'Niger Seed(Ramtil)'),
  crop('linseed', 'अळशी (Linseed)', 'Linseed'),
  crop('coconut', 'नारळ (Coconut)', 'Coconut'),
  crop('cashew', 'काजू (Cashew)', 'Cashewnuts'),
  crop('ragi', 'नाचणी (Ragi)', 'Ragi(Finger Millet)'),
  crop('sweet-potato', 'रताळे (Sweet Potato)', 'Sweet Potato'),
  crop('drumstick', 'शेवगा (Drumstick)', 'Drumstick'),
  crop('lemon', 'लिंबू (Lemon)', 'Lemon'),
  crop('jackfruit', 'फणस (Jackfruit)', 'Jack Fruit'),
  crop('cowpea', 'चवळी (Cowpea)', 'Cowpea(Lobia/Karamani)'),
  crop('matki', 'मटकी (Matki)', 'Mataki'),
  crop('kulthi', 'कुळीथ (Horse Gram)', 'Kulthi(Horse Gram)'),
  crop('lentil', 'मसूर (Lentil)', 'Lentil(Masur)(Whole)'),
] as const;

export const MAHARASHTRA_CROP_BY_VALUE: ReadonlyMap<string, MaharashtraCrop> = new Map(
  MAHARASHTRA_CROPS.map((item) => [item.value, item]),
);

/** O(1) membership for the curated recommended set (duplicate prevention in search). */
export const MAHARASHTRA_CROP_VALUES: ReadonlySet<string> = new Set(
  MAHARASHTRA_CROPS.map((item) => item.value),
);

const AGMARKNET_COMMODITY_SET: ReadonlySet<string> = new Set(AGMARKNET_COMMODITIES);

/**
 * Legacy favourite-crop labels previously stored in MongoDB.
 * Maps to the current Agmarknet `value` so existing profiles still load.
 */
const LEGACY_CROP_TO_VALUE: Record<string, string> = {
  'Kanda (Onion)': 'Onion',
  Soyabean: 'Soyabean',
  'Kapus (Cotton)': 'Cotton',
  'Tur (Pigeon Pea)': 'Red gram/Arhar/Tur(whole)',
  Bajri: 'Bajra(Pearl Millet/Cumbu)',
  Jowar: 'Jowar(Sorghum)',
  Wheat: 'Wheat',
  'Rice (Bhaat)': 'Rice',
  Sugarcane: 'Sugarcane',
  'Gram (Harbhara)': 'Bengal Gram(Gram)(Whole)',
  Groundnut: 'Groundnut',
  Grapes: 'Grapes',
  Turmeric: 'Turmeric',
  'Soybean Oilseed': 'Soyabean',
  Maize: 'Maize',
  Cotton: 'Cotton',
  Onion: 'Onion',
  Tomato: 'Tomato',
};

/**
 * Resolves a stored crop string to an exact Agmarknet commodity value.
 * Accepts curated Maharashtra crops, legacy profile labels, and any
 * Agmarknet commodity (so search-picked favourites survive reload).
 */
export const resolveMaharashtraCropValue = (stored: string): string | null => {
  if (MAHARASHTRA_CROP_BY_VALUE.has(stored)) return stored;
  const mapped = LEGACY_CROP_TO_VALUE[stored];
  if (mapped && AGMARKNET_COMMODITY_SET.has(mapped)) return mapped;
  if (AGMARKNET_COMMODITY_SET.has(stored)) return stored;
  return null;
};

/** Maps stored favourite crops (new or legacy) onto selectable Agmarknet values. */
export const normalizeFavoriteCrops = (stored: readonly string[]): string[] => {
  const resolved: string[] = [];
  for (const item of stored) {
    const value = resolveMaharashtraCropValue(item);
    if (value && !resolved.includes(value)) resolved.push(value);
  }
  return resolved;
};

/**
 * UI label for a stored Agmarknet (or legacy) crop value.
 * Prefer curated Marathi label when available; otherwise the Agmarknet name.
 */
export const getMaharashtraCropLabel = (stored: string): string => {
  const value = resolveMaharashtraCropValue(stored) ?? stored;
  return MAHARASHTRA_CROP_BY_VALUE.get(value)?.label ?? value;
};
