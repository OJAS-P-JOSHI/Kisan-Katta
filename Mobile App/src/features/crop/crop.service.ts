import { api } from '@/services/api';
import type { ApiSuccessResponse } from '@/types';

import type { CropListItem } from './crop.types';

const ENDPOINTS = {
  crops: '/api/v1/crops',
  search: '/api/v1/crops/search',
} as const;

// ---------------------------------------------------------------------------
// Module-level caches — survive remounts; avoid refetching the same lists.
// ---------------------------------------------------------------------------

let cropsCache: CropListItem[] | null = null;
const searchCache = new Map<string, CropListItem[]>();

/** GET /api/v1/crops — full Crop Master list (cached). */
export const fetchCrops = async (): Promise<CropListItem[]> => {
  if (cropsCache) return cropsCache;
  const { data } = await api.get<ApiSuccessResponse<CropListItem[]>>(ENDPOINTS.crops);
  cropsCache = data.data;
  return cropsCache;
};

/**
 * GET /api/v1/crops/search?q=...
 * Backend ranks English / Marathi / romanized aliases — no client-side ranking.
 */
export const searchCrops = async (query: string, limit = 50): Promise<CropListItem[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cacheKey = `${trimmed.toLowerCase()}|${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const { data } = await api.get<ApiSuccessResponse<CropListItem[]>>(ENDPOINTS.search, {
    params: { q: trimmed, limit },
  });
  searchCache.set(cacheKey, data.data);
  return data.data;
};

/** Marathi label when present; otherwise canonical Agmarknet English name. */
export const getCropLabel = (crop: CropListItem | string, crops?: readonly CropListItem[]): string => {
  if (typeof crop !== 'string') {
    return crop.nameMr.trim() || crop.name;
  }

  const list = crops ?? cropsCache ?? [];
  const exact = list.find((c) => c.name === crop);
  if (exact) return exact.nameMr.trim() || exact.name;

  const lower = crop.toLowerCase();
  const byCase = list.find((c) => c.name.toLowerCase() === lower);
  if (byCase) return byCase.nameMr.trim() || byCase.name;

  return crop;
};

/**
 * Maps stored favourite strings onto canonical Agmarknet names using the
 * Crop Master cache + backend search (covers legacy labels like "Kanda (Onion)").
 */
export const resolveFavoriteCrops = async (
  stored: readonly string[],
): Promise<string[]> => {
  const crops = await fetchCrops();
  const byName = new Map(crops.map((c) => [c.name, c.name]));
  const byLower = new Map(crops.map((c) => [c.name.toLowerCase(), c.name]));
  const resolved: string[] = [];

  for (const raw of stored) {
    const item = raw.trim();
    if (!item) continue;

    const direct = byName.get(item) ?? byLower.get(item.toLowerCase());
    if (direct) {
      if (!resolved.includes(direct)) resolved.push(direct);
      continue;
    }

    try {
      const results = await searchCrops(item, 5);
      const match = results[0]?.name;
      if (match && !resolved.includes(match)) {
        resolved.push(match);
      } else if (!resolved.includes(item)) {
        resolved.push(item);
      }
    } catch {
      if (!resolved.includes(item)) resolved.push(item);
    }
  }

  return resolved;
};

/** Sync normalize when the crop list is already loaded (no network). */
export const normalizeFavoriteCrops = (
  stored: readonly string[],
  crops: readonly CropListItem[],
): string[] => {
  const byName = new Map(crops.map((c) => [c.name, c.name]));
  const byLower = new Map(crops.map((c) => [c.name.toLowerCase(), c.name]));
  const resolved: string[] = [];

  for (const raw of stored) {
    const item = raw.trim();
    if (!item) continue;
    const match = byName.get(item) ?? byLower.get(item.toLowerCase()) ?? item;
    if (!resolved.includes(match)) resolved.push(match);
  }

  return resolved;
};

export const clearCropCaches = (): void => {
  cropsCache = null;
  searchCache.clear();
};
