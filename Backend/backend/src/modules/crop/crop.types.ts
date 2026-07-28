/**
 * Crop Master types — Agmarknet commodity catalog.
 *
 * Loaded from `src/data/crop-master.json`. No MongoDB.
 * Canonical `name` values MUST match Agmarknet exactly (used by market APIs).
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
