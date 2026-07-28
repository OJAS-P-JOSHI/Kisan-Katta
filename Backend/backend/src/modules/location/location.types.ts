/**
 * Location Master types — Maharashtra LGD (Local Government Directory).
 *
 * Excel "Sub-District" is exposed as "Taluka" everywhere in this API.
 * No MongoDB — all data is loaded from `src/data/location-master.json`.
 */

/** Village node as stored in location-master.json. */
export interface LocationVillage {
  villageCode: number;
  name: string;
  nameMr: string;
  category: string;
  status: string;
}

/** Taluka (Excel: Sub-District) node as stored in location-master.json. */
export interface LocationTaluka {
  talukaCode: number;
  talukaName: string;
  villages: LocationVillage[];
}

/** District node as stored in location-master.json. */
export interface LocationDistrict {
  districtCode: number;
  districtName: string;
  talukas: LocationTaluka[];
}

/** Full master file shape. */
export type LocationMaster = LocationDistrict[];

/** GET /api/v1/location/districts item. */
export interface DistrictListItemDTO {
  code: number;
  name: string;
}

/** GET /api/v1/location/talukas/:districtCode item. */
export interface TalukaListItemDTO {
  code: number;
  name: string;
}

/** GET /api/v1/location/villages/:talukaCode item. */
export interface VillageListItemDTO {
  code: number;
  name: string;
  nameMr: string;
  category: string;
  status: string;
}

/** Canonical resolved location used by Profile and future modules. */
export interface ResolvedLocation {
  district: { code: number; name: string };
  taluka: { code: number; name: string };
  village: { code: number; name: string; nameMr: string };
}

/**
 * Input for hierarchy resolution. Prefer codes when present; fall back to
 * English names (legacy clients). Codes always win over names for the same level.
 */
export interface ResolveLocationInput {
  districtCode?: number;
  talukaCode?: number;
  villageCode?: number;
  districtName?: string;
  talukaName?: string;
  villageName?: string;
}
