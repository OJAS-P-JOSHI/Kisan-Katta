/**
 * Special favourite items that behave like crops for Profile + Farmer Expected
 * Price, but are intentionally excluded from Government Market Prices
 * (no Agmarknet mandi rate).
 *
 * Not part of crop-master.json Agmarknet catalog — injected by crop.service.
 */
import type { CropMasterEntry } from "./crop.types";

/** Canonical value stored in `favoriteCrops[]`. */
export const MILK_CROP_NAME = "Milk";

/** Stable synthetic id outside Agmarknet cropId range (1–393). */
export const MILK_CROP_ID = 9001;

/**
 * Milk / Dairy entry — final favourite option for Farmer Expected Price.
 * Search aliases: milk, dairy, दूध, दुध (case-insensitive via index).
 */
export const MILK_CROP_ENTRY: CropMasterEntry = {
  cropId: MILK_CROP_ID,
  name: MILK_CROP_NAME,
  nameMr: "दूध",
  normalized: "milk",
  search: [
    "Milk",
    "milk",
    "MILK",
    "Dairy",
    "dairy",
    "दूध",
    "दुध",
  ],
};

/** Crops that must never drive Government Market / Agmarknet price UI or APIs. */
const GOVERNMENT_MARKET_EXCLUDED = new Set([MILK_CROP_NAME.toLowerCase()]);

export const isExcludedFromGovernmentMarket = (cropName: string): boolean =>
  GOVERNMENT_MARKET_EXCLUDED.has(cropName.trim().toLowerCase());

/** Filter helper — drops Milk and any future non-market favourites. */
export const excludeFromGovernmentMarket = <T extends string>(
  crops: readonly T[]
): T[] => crops.filter((crop) => !isExcludedFromGovernmentMarket(crop));
