/**
 * Crop Master types — Agmarknet commodity catalog (+ special favourites).
 *
 * Agmarknet rows load from `src/data/crop-master.json`. Milk is injected by
 * `crop.special.ts` for Farmer Expected Price only (not Agmarknet).
 * Canonical `name` values for Agmarknet crops MUST match Agmarknet exactly
 * (used by market APIs). Milk must never be sent to Agmarknet.
 */

/** Full crop entry as stored in crop-master.json. */
export interface CropMasterEntry {
  cropId: number;
  name: string;
  nameMr: string;
  normalized: string;
  search: string[];
}

export type CropMaster = CropMasterEntry[];

/** GET /api/v1/crops list item. */
export interface CropListItemDTO {
  cropId: number;
  name: string;
  nameMr: string;
}

/** GET /api/v1/crops/search result item. */
export interface CropSearchResultDTO {
  cropId: number;
  name: string;
  nameMr: string;
}
