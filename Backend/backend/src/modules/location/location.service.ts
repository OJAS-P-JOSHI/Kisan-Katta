/**
 * Location Master service — read-only, in-memory LGD hierarchy.
 *
 * The JSON is loaded exactly once at module import time. Lookup maps give
 * O(1) district / taluka / village access so request handlers never scan the
 * full tree. Profile (and future modules) resolve hierarchies via
 * `resolveLocationHierarchy`.
 */
import { AppError } from "../../utils/AppError";
import locationMasterJson from "../../data/location-master.json";
import type {
  DistrictListItemDTO,
  LocationDistrict,
  LocationMaster,
  LocationTaluka,
  LocationVillage,
  ResolveLocationInput,
  ResolvedLocation,
  TalukaListItemDTO,
  VillageListItemDTO,
} from "./location.types";

// ---------------------------------------------------------------------------
// In-memory indexes (built once)
// ---------------------------------------------------------------------------

const master: LocationMaster = locationMasterJson as LocationMaster;

const districtByCode = new Map<number, LocationDistrict>();
const talukaByCode = new Map<
  number,
  { taluka: LocationTaluka; districtCode: number }
>();
const villageByCode = new Map<
  number,
  {
    village: LocationVillage;
    talukaCode: number;
    districtCode: number;
  }
>();

/** Normalized district name → district code (includes historical aliases). */
const districtCodeByName = new Map<string, number>();

const districtListCache: DistrictListItemDTO[] = [];

const normalizeName = (name: string): string =>
  name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

/**
 * Historical / colloquial district names → LGD official names in the master.
 * Keys and values are normalized (lowercase, single-spaced).
 */
const DISTRICT_NAME_ALIASES: Record<string, string> = {
  ahmednagar: "ahilyanagar",
  ahmadnagar: "ahilyanagar",
  ahmadanagar: "ahilyanagar",
  aurangabad: "chhatrapati sambhajinagar",
  sambhajinagar: "chhatrapati sambhajinagar",
  "chhatrapati-sambhajinagar": "chhatrapati sambhajinagar",
  osmanabad: "dharashiv",
  bombay: "mumbai suburban",
  mumbai: "mumbai suburban",
  "mumbai city": "mumbai suburban",
  "mumbai-city": "mumbai suburban",
  "mumbai-suburban": "mumbai suburban",
  nasik: "nashik",
  sholapur: "solapur",
  buldana: "buldhana",
  amraoti: "amravati",
  thana: "thane",
};

for (const district of master) {
  districtByCode.set(district.districtCode, district);
  districtListCache.push({
    code: district.districtCode,
    name: district.districtName,
  });
  districtCodeByName.set(normalizeName(district.districtName), district.districtCode);

  for (const taluka of district.talukas) {
    talukaByCode.set(taluka.talukaCode, {
      taluka,
      districtCode: district.districtCode,
    });

    for (const village of taluka.villages) {
      villageByCode.set(village.villageCode, {
        village,
        talukaCode: taluka.talukaCode,
        districtCode: district.districtCode,
      });
    }
  }
}

// Register aliases after the master names so LGD names always win.
for (const [alias, canonical] of Object.entries(DISTRICT_NAME_ALIASES)) {
  const code = districtCodeByName.get(canonical);
  if (code !== undefined) {
    districtCodeByName.set(alias, code);
  }
}

Object.freeze(districtListCache);

// ---------------------------------------------------------------------------
// Public list API (HTTP module)
// ---------------------------------------------------------------------------

/** All Maharashtra districts (code + name), alphabetically sorted. */
export const listDistricts = (): DistrictListItemDTO[] => districtListCache;

/**
 * Talukas for a district, alphabetically sorted.
 * @throws AppError 404 when the district code is unknown
 */
export const listTalukasByDistrictCode = (
  districtCode: number
): TalukaListItemDTO[] => {
  const district = districtByCode.get(districtCode);
  if (!district) {
    throw new AppError("Invalid district code", 404);
  }

  return district.talukas.map((taluka) => ({
    code: taluka.talukaCode,
    name: taluka.talukaName,
  }));
};

/**
 * Villages for a taluka, alphabetically sorted by English name.
 * @throws AppError 404 when the taluka code is unknown
 */
export const listVillagesByTalukaCode = (
  talukaCode: number
): VillageListItemDTO[] => {
  const entry = talukaByCode.get(talukaCode);
  if (!entry) {
    throw new AppError("Invalid taluka code", 404);
  }

  return entry.taluka.villages.map((village) => ({
    code: village.villageCode,
    name: village.name,
    nameMr: village.nameMr,
    category: village.category,
    status: village.status,
  }));
};

export const getLocationMasterStats = (): {
  districtCount: number;
  talukaCount: number;
  villageCount: number;
} => ({
  districtCount: districtByCode.size,
  talukaCount: talukaByCode.size,
  villageCount: villageByCode.size,
});

// ---------------------------------------------------------------------------
// Lookups used by Profile and other modules
// ---------------------------------------------------------------------------

export const getDistrictByCode = (
  districtCode: number
): LocationDistrict | undefined => districtByCode.get(districtCode);

export const getTalukaByCode = (
  talukaCode: number
): { taluka: LocationTaluka; districtCode: number } | undefined =>
  talukaByCode.get(talukaCode);

export const getVillageByCode = (
  villageCode: number
):
  | {
      village: LocationVillage;
      talukaCode: number;
      districtCode: number;
    }
  | undefined => villageByCode.get(villageCode);

const findTalukaInDistrictByName = (
  district: LocationDistrict,
  talukaName: string
): LocationTaluka | undefined => {
  const needle = normalizeName(talukaName);
  return district.talukas.find(
    (taluka) => normalizeName(taluka.talukaName) === needle
  );
};

const findVillageInTalukaByName = (
  taluka: LocationTaluka,
  villageName: string
): LocationVillage | undefined => {
  const needle = normalizeName(villageName);
  return taluka.villages.find(
    (village) => normalizeName(village.name) === needle
  );
};

/**
 * Resolves and validates District → Taluka → Village against the LGD master.
 *
 * Prefer codes when provided; otherwise match English names (case-insensitive).
 * Always returns canonical LGD codes and names. Throws AppError(400) on failure
 * — never 500 for bad client input.
 */
export const resolveLocationHierarchy = (
  input: ResolveLocationInput
): ResolvedLocation => {
  // ----- District -----
  let district: LocationDistrict | undefined;

  if (input.districtCode !== undefined) {
    district = districtByCode.get(input.districtCode);
    if (!district) {
      throw new AppError("Invalid district", 400);
    }
  } else if (input.districtName !== undefined && input.districtName.trim()) {
    const code = districtCodeByName.get(normalizeName(input.districtName));
    if (code === undefined) {
      throw new AppError("Invalid district", 400);
    }
    district = districtByCode.get(code);
    if (!district) {
      throw new AppError("Invalid district", 400);
    }
  } else {
    throw new AppError("Missing district: provide districtCode or district name.", 400);
  }

  // ----- Taluka -----
  let taluka: LocationTaluka | undefined;

  if (input.talukaCode !== undefined) {
    const entry = talukaByCode.get(input.talukaCode);
    if (!entry) {
      throw new AppError("Invalid taluka", 400);
    }
    if (entry.districtCode !== district.districtCode) {
      throw new AppError("Taluka does not belong to district", 400);
    }
    taluka = entry.taluka;
  } else if (input.talukaName !== undefined && input.talukaName.trim()) {
    taluka = findTalukaInDistrictByName(district, input.talukaName);
    if (!taluka) {
      throw new AppError("Invalid taluka", 400);
    }
  } else {
    throw new AppError("Missing taluka: provide talukaCode or taluka name.", 400);
  }

  // ----- Village -----
  let village: LocationVillage | undefined;

  if (input.villageCode !== undefined) {
    const entry = villageByCode.get(input.villageCode);
    if (!entry) {
      throw new AppError("Invalid village", 400);
    }
    if (entry.talukaCode !== taluka.talukaCode) {
      throw new AppError("Village does not belong to taluka", 400);
    }
    if (entry.districtCode !== district.districtCode) {
      throw new AppError("Village does not belong to taluka", 400);
    }
    village = entry.village;
  } else if (input.villageName !== undefined && input.villageName.trim()) {
    village = findVillageInTalukaByName(taluka, input.villageName);
    if (!village) {
      throw new AppError("Invalid village", 400);
    }
  } else {
    throw new AppError("Missing village: provide villageCode or village name.", 400);
  }

  return {
    district: {
      code: district.districtCode,
      name: district.districtName,
    },
    taluka: {
      code: taluka.talukaCode,
      name: taluka.talukaName,
    },
    village: {
      code: village.villageCode,
      name: village.name,
      nameMr: village.nameMr,
    },
  };
};
