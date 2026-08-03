/**
 * Special favourite items that behave like crops for Profile + Farmer Expected
 * Price, but are intentionally excluded from Government Market Prices
 * (no Agmarknet mandi rate).
 *
 * Canonical value must match backend `MILK_CROP_NAME` ("Milk").
 */

export const MILK_CROP_NAME = 'Milk';

const GOVERNMENT_MARKET_EXCLUDED = new Set([MILK_CROP_NAME.toLowerCase()]);

export const isExcludedFromGovernmentMarket = (cropName: string): boolean =>
  GOVERNMENT_MARKET_EXCLUDED.has(cropName.trim().toLowerCase());

/** Drops Milk (and any future non-market favourites) from Government Market lists. */
export const excludeFromGovernmentMarket = (crops: readonly string[]): string[] =>
  crops.filter((crop) => !isExcludedFromGovernmentMarket(crop));
