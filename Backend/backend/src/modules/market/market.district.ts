import { MarketPriceDTO } from "./market.types";
import { normalizeGovRecordsToDto } from "./market.normalize";
import { fetchDistrictRecordsFromGov, marketLog } from "./market.gov-client";

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours exactly

interface DistrictCacheEntry {
  data: MarketPriceDTO[];
  cachedAt: number;
  expiresAt: number;
  commodityCount: number;
  recordCount: number;
}

interface DistrictMetrics {
  cacheHits: number;
  cacheMisses: number;
  coalesceJoins: number;
}

const districtCache = new Map<string, DistrictCacheEntry>();
/** Single-flight: concurrent callers for the same district share one Promise. */
const inflightDistrictFetches = new Map<string, Promise<MarketPriceDTO[]>>();
const metrics: DistrictMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  coalesceJoins: 0,
};

export const buildDistrictCacheKey = (state: string, district: string): string =>
  `${state.trim()}|${district.trim()}`;

const countCommodities = (rows: readonly MarketPriceDTO[]): number => {
  const set = new Set<string>();
  for (const row of rows) {
    const name = row.commodity.trim();
    if (name) set.add(name);
  }
  return set.size;
};

/**
 * Returns normalized market rows for an entire district.
 * Uses 2h memory cache + single-flight coalescing.
 */
export const getDistrictMarketDataset = async (
  state: string,
  apiDistrict: string
): Promise<MarketPriceDTO[]> => {
  const cacheKey = buildDistrictCacheKey(state, apiDistrict);
  const now = Date.now();
  const cached = districtCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    metrics.cacheHits += 1;
    const ageMs = now - cached.cachedAt;
    const ttlRemainingMs = cached.expiresAt - now;
    marketLog.info("District cache hit", {
      district: apiDistrict,
      ageMinutes: Math.round((ageMs / 60_000) * 10) / 10,
      ttlRemainingMinutes: Math.round((ttlRemainingMs / 60_000) * 10) / 10,
      commodities: cached.commodityCount,
      normalizedRecords: cached.recordCount,
    });
    return cached.data;
  }

  // Expired entry — drop so we never serve stale past exactly 2h.
  if (cached && cached.expiresAt <= now) {
    districtCache.delete(cacheKey);
  }

  const existing = inflightDistrictFetches.get(cacheKey);
  if (existing) {
    metrics.coalesceJoins += 1;
    marketLog.info(`District fetch coalesced: ${apiDistrict}`, {
      cacheKey,
      coalesceJoins: metrics.coalesceJoins,
    });
    return existing;
  }

  metrics.cacheMisses += 1;
  marketLog.info(`District cache miss: ${apiDistrict}`, { cacheKey });

  const fetchPromise = (async (): Promise<MarketPriceDTO[]> => {
    const govStarted = Date.now();
    const rawRecords = await fetchDistrictRecordsFromGov({
      state,
      district: apiDistrict,
    });
    const govMs = Date.now() - govStarted;

    const normalizeStarted = Date.now();
    const data = normalizeGovRecordsToDto(rawRecords);
    const normalizeMs = Date.now() - normalizeStarted;
    const commodityCount = countCommodities(data);
    const cachedAt = Date.now();
    const expiresAt = cachedAt + CACHE_TTL_MS;

    districtCache.set(cacheKey, {
      data,
      cachedAt,
      expiresAt,
      commodityCount,
      recordCount: data.length,
    });

    marketLog.info("District cached", {
      district: apiDistrict,
      normalizedRecords: data.length,
      commodities: commodityCount,
      expiresAt: new Date(expiresAt).toISOString(),
      ttlHours: CACHE_TTL_MS / (60 * 60 * 1000),
      rawRecords: rawRecords.length,
      govRequestMs: govMs,
      normalizeMs,
    });

    return data;
  })();

  inflightDistrictFetches.set(cacheKey, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    inflightDistrictFetches.delete(cacheKey);
  }
};

/** Test / ops helper — not used by HTTP handlers. */
export const getDistrictCacheMetrics = (): DistrictMetrics & { size: number } => ({
  ...metrics,
  size: districtCache.size,
});

/** Test helper to clear cache between scenarios. */
export const clearDistrictMarketCache = (): void => {
  districtCache.clear();
  inflightDistrictFetches.clear();
  metrics.cacheHits = 0;
  metrics.cacheMisses = 0;
  metrics.coalesceJoins = 0;
};

export const DISTRICT_CACHE_TTL_MS = CACHE_TTL_MS;

/** Test helper: remaining TTL for a cache key, or null if missing/expired. */
export const getDistrictCacheExpiresInMs = (
  state: string,
  district: string
): number | null => {
  const entry = districtCache.get(buildDistrictCacheKey(state, district));
  if (!entry) return null;
  const remaining = entry.expiresAt - Date.now();
  return remaining > 0 ? remaining : null;
};
