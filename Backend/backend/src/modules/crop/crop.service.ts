/**
 * Crop Master service — read-only, in-memory Agmarknet catalog.
 *
 * JSON is loaded once at module import. Indexes support O(1) lookup by cropId,
 * canonical name, and efficient ranked search.
 */
import { AppError } from "../../utils/AppError";
import cropMasterJson from "../../data/crop-master.json";
import { MILK_CROP_ENTRY } from "./crop.special";
import type {
  CropListItemDTO,
  CropMaster,
  CropMasterEntry,
  CropSearchResultDTO,
} from "./crop.types";

// ---------------------------------------------------------------------------
// In-memory indexes (built once)
// ---------------------------------------------------------------------------

const master: CropMaster = cropMasterJson as CropMaster;

const cropById = new Map<number, CropMasterEntry>();
const cropByName = new Map<string, CropMasterEntry>();
const cropByNormalized = new Map<string, CropMasterEntry>();
/** Lowercase search term → cropIds (a term may map to multiple crops). */
const searchTermIndex = new Map<string, number[]>();

const listCache: CropListItemDTO[] = [];

const indexCrop = (crop: CropMasterEntry, options?: { appendToList?: boolean }): void => {
  cropById.set(crop.cropId, crop);
  cropByName.set(crop.name, crop);
  cropByNormalized.set(crop.normalized, crop);

  if (options?.appendToList !== false) {
    listCache.push({
      cropId: crop.cropId,
      name: crop.name,
      nameMr: crop.nameMr,
    });
  }

  for (const term of crop.search) {
    const key = term.trim().toLowerCase();
    if (!key) continue;
    const existing = searchTermIndex.get(key) ?? [];
    if (!existing.includes(crop.cropId)) {
      existing.push(crop.cropId);
      searchTermIndex.set(key, existing);
    }
  }

  // Index canonical name and normalized form explicitly
  searchTermIndex.set(crop.normalized, [crop.cropId]);
};

for (const crop of master) {
  indexCrop(crop);
}

// Milk / Dairy — special favourite for Farmer Expected Price (not Agmarknet).
// Always last in GET /crops browse list. Excluded from Government Market module.
indexCrop(MILK_CROP_ENTRY);

Object.freeze(listCache);

// ---------------------------------------------------------------------------
// Search ranking
// ---------------------------------------------------------------------------

type MatchRank = 0 | 1 | 2;

const rankMatch = (crop: CropMasterEntry, query: string): MatchRank | null => {
  const q = query.toLowerCase();

  if (crop.normalized === q || crop.name.toLowerCase() === q) return 0;
  if (crop.nameMr && crop.nameMr.toLowerCase() === q) return 0;

  for (const term of crop.search) {
    const t = term.toLowerCase();
    if (t === q) return 0;
  }

  if (crop.normalized.startsWith(q) || crop.name.toLowerCase().startsWith(q)) return 1;
  if (crop.nameMr && crop.nameMr.startsWith(q)) return 1;

  for (const term of crop.search) {
    if (term.toLowerCase().startsWith(q)) return 1;
  }

  if (crop.normalized.includes(q) || crop.name.toLowerCase().includes(q)) return 2;
  if (crop.nameMr && crop.nameMr.includes(q)) return 2;

  for (const term of crop.search) {
    if (term.toLowerCase().includes(q)) return 2;
  }

  return null;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** All crops (cropId, name, nameMr), alphabetically sorted in the master file. */
export const listCrops = (): CropListItemDTO[] => listCache;

/**
 * Ranked crop search across English, Marathi, normalized keys, and aliases.
 * Returns an empty array when no matches (never an error for unknown query).
 */
export const searchCrops = (query: string, limit = 50): CropSearchResultDTO[] => {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new AppError('Query parameter "q" is required and must be non-empty.', 400);
  }

  const q = trimmed.toLowerCase();
  const candidateIds = new Set<number>();

  // Fast path: gather ids from inverted index (prefix scan on keys)
  for (const [term, ids] of searchTermIndex.entries()) {
    if (term.includes(q) || q.includes(term)) {
      for (const id of ids) candidateIds.add(id);
    }
  }

  // Also scan Agmarknet + special favourites for substring matches
  for (const crop of cropById.values()) {
    if (rankMatch(crop, q) !== null) {
      candidateIds.add(crop.cropId);
    }
  }

  const ranked: { crop: CropMasterEntry; rank: MatchRank }[] = [];
  for (const id of candidateIds) {
    const crop = cropById.get(id);
    if (!crop) continue;
    const rank = rankMatch(crop, q);
    if (rank !== null) ranked.push({ crop, rank });
  }

  ranked.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.crop.name.localeCompare(b.crop.name, "en", { sensitivity: "base" });
  });

  return ranked.slice(0, limit).map(({ crop }) => ({
    cropId: crop.cropId,
    name: crop.name,
    nameMr: crop.nameMr,
  }));
};

/** O(1) lookup by cropId. Returns undefined when unknown. */
export const getCropById = (cropId: number): CropMasterEntry | undefined =>
  cropById.get(cropId);

/** O(1) lookup by exact canonical Agmarknet name. */
export const getCropByName = (name: string): CropMasterEntry | undefined =>
  cropByName.get(name);

/**
 * Resolves a stored or submitted crop string to the canonical Agmarknet name.
 * Accepts exact names, case-insensitive matches, search aliases, and legacy
 * profile labels. Returns null when the crop is unknown.
 */
export const resolveCropName = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Exact canonical match
  if (cropByName.has(trimmed)) return trimmed;

  // Case-insensitive canonical match
  const normalized = trimmed.toLowerCase().replace(/\s+/g, " ").replace(/(\S)\(/g, "$1 (");
  const byNormalized = cropByNormalized.get(normalized);
  if (byNormalized) return byNormalized.name;

  // Search alias match (case-insensitive)
  const aliasIds = searchTermIndex.get(trimmed.toLowerCase());
  if (aliasIds && aliasIds.length === 1) {
    const crop = cropById.get(aliasIds[0]!);
    if (crop) return crop.name;
  }

  // Linear fallback for multi-match or spacing variants (Agmarknet + special)
  for (const crop of cropById.values()) {
    for (const term of crop.search) {
      if (term.toLowerCase() === trimmed.toLowerCase()) {
        return crop.name;
      }
    }
  }

  return null;
};

/** Throws AppError(400) when any crop name is unknown. Returns canonical names. */
export const assertKnownCrops = (crops: string[]): string[] => {
  const resolved: string[] = [];
  const unknown: string[] = [];

  for (const crop of crops) {
    const canonical = resolveCropName(crop);
    if (canonical === null) {
      unknown.push(crop);
    } else if (!resolved.includes(canonical)) {
      resolved.push(canonical);
    }
  }

  if (unknown.length > 0) {
    throw new AppError(
      `Unknown crop(s) in favoriteCrops: ${unknown.map((c) => `"${c}"`).join(", ")}.`,
      400
    );
  }

  return resolved;
};

export const getCropMasterStats = (): {
  totalCrops: number;
  translatedCount: number;
  untranslatedCount: number;
} => {
  const all = [...cropById.values()];
  const translatedCount = all.filter((c) => c.nameMr.length > 0).length;
  return {
    totalCrops: all.length,
    translatedCount,
    untranslatedCount: all.length - translatedCount,
  };
};

// Re-export special-favourite helpers for Market / Profile consumers.
export {
  MILK_CROP_NAME,
  MILK_CROP_ID,
  isExcludedFromGovernmentMarket,
  excludeFromGovernmentMarket,
} from "./crop.special";
