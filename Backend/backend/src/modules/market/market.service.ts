import { env } from "../../config/env";
import { normalizeDistrictName, resolveDistrict } from "../../config/maharashtraDistrictCoordinates";
import { AppError } from "../../utils/AppError";
import { getProfile } from "../profile/profile.service";
import {
  CropMarketIntelligenceDTO,
  GovApiResponse,
  GovMarketRecord,
  MarketPriceDTO,
  MarketPricesQuery,
} from "./market.types";

const DEFAULT_STATE = "Maharashtra";
const REQUEST_TIMEOUT_MS = 30_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const FAVOURITES_LIMIT = 100;
const GOV_API_URL = `${env.marketApiBaseUrl}/resource/${env.marketDatasetId}`;
const DEFAULT_RECENT_DAYS = 20;
const IS_DEV = process.env.NODE_ENV !== "production";

/** Request context for structured error logs only — never dumped as raw param objects. */
interface GovRequestContext {
  commodity?: string;
  district?: string;
}

interface CacheEntry {
  data: MarketPriceDTO[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

const marketLog = {
  info: (message: string, meta?: Record<string, unknown>): void => {
    // eslint-disable-next-line no-console
    console.log(`[market] ${message}`, meta ?? "");
  },
  warn: (message: string, meta?: Record<string, unknown>): void => {
    // eslint-disable-next-line no-console
    console.warn(`[market] ${message}`, meta ?? "");
  },
  error: (message: string, meta?: Record<string, unknown>): void => {
    // eslint-disable-next-line no-console
    console.error(`[market] ${message}`, meta ?? "");
  },
};

const toNumber = (value: string | number | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getRecentDaysWindow = (): number => {
  const raw = Number(process.env.MARKET_RECENT_DAYS);
  return Number.isInteger(raw) && raw > 0 ? raw : DEFAULT_RECENT_DAYS;
};

const parseArrivalDate = (value: string | undefined): Date | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const filterRecentGovRecords = (records: GovMarketRecord[]): GovMarketRecord[] => {
  if (records.length === 0) return [];

  const recentDays = getRecentDaysWindow();
  const today = new Date();
  const cutoffDate = new Date(today);
  cutoffDate.setDate(today.getDate() - recentDays);
  cutoffDate.setHours(0, 0, 0, 0);

  return records.filter((record) => {
    const arrivalDate = parseArrivalDate(record.Arrival_Date);
    if (!arrivalDate) return false;
    return arrivalDate >= cutoffDate;
  });
};

const keepLatestRecordPerMandi = (records: GovMarketRecord[]): GovMarketRecord[] => {
  const seenMarkets = new Set<string>();
  const latestPerMandi: GovMarketRecord[] = [];

  for (const record of records) {
    const marketKey = (record.Market ?? "").trim();
    if (!marketKey || seenMarkets.has(marketKey)) continue;
    seenMarkets.add(marketKey);
    latestPerMandi.push(record);
  }

  return latestPerMandi;
};

const normalizeText = (value: string): string => value.trim().toLowerCase();

// Government market data still uses legacy district names (e.g. "Aurangabad")
// even though profiles store the canonical renamed value.
const GOV_MARKET_DISTRICT_ALIASES: Record<string, string> = {
  "chhatrapati sambhajinagar": "Aurangabad",
  dharashiv: "Osmanabad",
};

const resolveGovDistrictForApi = (district: string): string => {
  const { district: canonicalDistrict, cacheKey } = resolveDistrict(district);
  return GOV_MARKET_DISTRICT_ALIASES[cacheKey] ?? canonicalDistrict;
};

const resolveGovDistrictCandidates = (district: string): string[] => {
  const { district: canonicalDistrict, cacheKey } = resolveDistrict(district);
  const apiDistrict = GOV_MARKET_DISTRICT_ALIASES[cacheKey] ?? canonicalDistrict;
  return [...new Set([apiDistrict, canonicalDistrict])];
};

const matchesFavoriteCrop = (commodity: string, crop: string): boolean =>
  commodity.trim() === crop.trim();

const matchesFavoriteDistrict = (recordDistrict: string, districtCandidates: string[]): boolean => {
  const recordNorm = normalizeDistrictName(recordDistrict);
  return districtCandidates.some(
    (candidate) => normalizeDistrictName(candidate) === recordNorm
  );
};

const toMarketPriceDTO = (record: GovMarketRecord): MarketPriceDTO => ({
  commodity: (record.Commodity ?? "").trim(),
  market: (record.Market ?? "").trim(),
  district: (record.District ?? "").trim(),
  state: (record.State ?? "").trim(),
  variety: (record.Variety ?? "").trim(),
  grade: (record.Grade ?? "").trim(),
  arrivalDate: (record.Arrival_Date ?? "").trim(),
  modalPrice: toNumber(record.Modal_Price),
  minPrice: toNumber(record.Min_Price),
  maxPrice: toNumber(record.Max_Price),
});

/** Highest modal price first — production default for market intelligence. */
const sortByModalPriceDesc = (records: MarketPriceDTO[]): MarketPriceDTO[] =>
  [...records].sort((a, b) => b.modalPrice - a.modalPrice);

/**
 * Builds crop intelligence summary from already-filtered mandi rows.
 * Empty markets → zeroed summary (callers may treat marketCount === 0 as empty).
 */
export const buildCropMarketIntelligence = (
  commodity: string,
  district: string,
  records: MarketPriceDTO[]
): CropMarketIntelligenceDTO => {
  const markets = sortByModalPriceDesc(records);
  const marketCount = markets.length;

  if (marketCount === 0) {
    return {
      commodity,
      district,
      markets: [],
      highestPrice: 0,
      lowestPrice: 0,
      averageModalPrice: 0,
      marketCount: 0,
    };
  }

  const sum = markets.reduce((acc, item) => acc + item.modalPrice, 0);
  return {
    commodity,
    district,
    markets,
    highestPrice: markets[0]?.modalPrice ?? 0,
    lowestPrice: markets[marketCount - 1]?.modalPrice ?? 0,
    averageModalPrice: Math.round(sum / marketCount),
    marketCount,
  };
};

const buildGovApiUrl = (params: Record<string, string | number>): string => {
  const url = new URL(GOV_API_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, String(value));
  }
  return url.toString();
};

const extractErrorMeta = (error: unknown): Record<string, unknown> => {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  const meta: Record<string, unknown> = {
    name: error.name,
    message: error.message,
  };

  const withCode = error as Error & { code?: string; cause?: unknown };
  if (withCode.code) meta.code = withCode.code;
  if (withCode.cause instanceof Error) {
    meta.cause = withCode.cause.message;
  } else if (withCode.cause != null) {
    meta.cause = String(withCode.cause);
  }

  if (IS_DEV && error.stack) {
    meta.stack = error.stack;
  }

  return meta;
};

const mapGovApiError = (
  error: unknown,
  context: GovRequestContext | null = null
): AppError => {
  if (error instanceof Error && error.name === "AbortError") {
    marketLog.error("Government API timeout", {
      ...extractErrorMeta(error),
      commodity: context?.commodity,
      district: context?.district,
    });
    return new AppError("Government market data service timed out", 504);
  }

  if (error instanceof Error) {
    marketLog.error("Government API unavailable", {
      ...extractErrorMeta(error),
      commodity: context?.commodity,
      district: context?.district,
    });
    return new AppError("Government market data service is unavailable", 503);
  }

  marketLog.error("Government API unexpected error", {
    ...extractErrorMeta(error),
    commodity: context?.commodity,
    district: context?.district,
  });
  return new AppError("Unexpected error while fetching market prices", 500);
};

const buildCacheKey = (params: MarketPricesQuery): string =>
  [
    params.state ?? "",
    params.district ?? "",
    params.commodity ?? "",
    params.limit,
    params.offset,
  ].join("|");

const buildGovFilters = (
  query: MarketPricesQuery
): Record<string, string | number> => {
  const params: Record<string, string | number> = {
    "api-key": env.marketApiKey,
    format: "json",
    limit: query.limit,
    offset: query.offset,
  };

  if (query.state) params["filters[State]"] = query.state.trim();
  if (query.district) params["filters[District]"] = query.district.trim();
  if (query.commodity) params["filters[Commodity]"] = query.commodity.trim();
  params["sort[Arrival_Date]"] = "desc";

  return params;
};

const fetchMarketPricesFromGov = async (
  query: MarketPricesQuery,
  context: GovRequestContext | null = null
): Promise<MarketPriceDTO[]> => {
  if (!env.marketApiKey) {
    throw new AppError("Government market data API key is not configured", 500);
  }

  const params = buildGovFilters(query);
  const requestContext: GovRequestContext = {
    commodity: context?.commodity ?? query.commodity,
    district: context?.district ?? query.district,
  };
  const start = Date.now();

  marketLog.info("Government API request started", {
    commodity: requestContext.commodity,
    district: requestContext.district,
    limit: query.limit,
  });

  try {
    const finalUrl = buildGovApiUrl(params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(finalUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        marketLog.error("Government API invalid key", {
          httpStatus: response.status,
          commodity: requestContext.commodity,
          district: requestContext.district,
          durationMs: Date.now() - start,
        });
        throw new AppError("Government market data API key is invalid", 500);
      }

      marketLog.error("Government API HTTP failure", {
        httpStatus: response.status,
        statusText: response.statusText,
        commodity: requestContext.commodity,
        district: requestContext.district,
        durationMs: Date.now() - start,
      });
      throw new AppError("Government market data service is unavailable", 503);
    }

    const responseData = (await response.json()) as GovApiResponse;
    const elapsedMs = Date.now() - start;

    if (!Array.isArray(responseData.records)) {
      marketLog.error("Government API unexpected payload", {
        commodity: requestContext.commodity,
        district: requestContext.district,
        durationMs: elapsedMs,
      });
      throw new AppError("Unexpected response from government market data API", 502);
    }

    const receivedCount = responseData.records.length;
    const recentRecords = filterRecentGovRecords(responseData.records);
    const latestPerMandiRecords = keepLatestRecordPerMandi(recentRecords);
    const mappedRecords = latestPerMandiRecords.map(toMarketPriceDTO);

    if (receivedCount === 0 || mappedRecords.length === 0) {
      marketLog.warn("No recent government market records", {
        commodity: requestContext.commodity,
        district: requestContext.district,
        received: receivedCount,
        afterFilter: recentRecords.length,
        uniqueMandis: mappedRecords.length,
        durationMs: elapsedMs,
      });
    } else {
      marketLog.info("Government API success", {
        commodity: requestContext.commodity,
        district: requestContext.district,
        received: receivedCount,
        afterFilter: recentRecords.length,
        uniqueMandis: mappedRecords.length,
        durationMs: elapsedMs,
      });
    }

    return mappedRecords;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw mapGovApiError(error, requestContext);
  }
};

export const getMarketPrices = async (
  query: MarketPricesQuery,
  context: GovRequestContext | null = null
): Promise<MarketPriceDTO[]> => {
  const cacheKey = buildCacheKey(query);
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    marketLog.info("Market cache hit", { cacheKey });
    return cached.data;
  }

  marketLog.info("Market cache miss", { cacheKey });
  const data = sortByModalPriceDesc(await fetchMarketPricesFromGov(query, context));
  cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
};

/**
 * District + commodity market intelligence.
 * Reuses the same cached gov fetch as GET /prices (one request per crop).
 * Accepts either the profile district or the gov alias; maps to the API name for fetch.
 */
export const getCropMarketIntelligence = async (
  query: MarketPricesQuery & { district: string; commodity: string }
): Promise<CropMarketIntelligenceDTO> => {
  const district = query.district.trim();
  const commodity = query.commodity.trim();
  const apiDistrict = resolveGovDistrictForApi(district);
  const districtCandidates = resolveGovDistrictCandidates(district);
  const records = await getMarketPrices(
    {
      ...query,
      district: apiDistrict,
    },
    { commodity, district }
  );
  const matched = records.filter(
    (item) =>
      matchesFavoriteCrop(item.commodity, commodity) &&
      matchesFavoriteDistrict(item.district, districtCandidates)
  );
  return buildCropMarketIntelligence(commodity, district, matched);
};

const fetchFavoriteCropPrices = async (
  state: string,
  _originalDistrict: string,
  apiDistrict: string,
  districtCandidates: string[],
  crop: string
): Promise<MarketPriceDTO[]> => {
  const commodity = crop.trim();

  const data = await getMarketPrices(
    {
      state,
      district: apiDistrict,
      commodity,
      limit: FAVOURITES_LIMIT,
      offset: 0,
    },
    { commodity, district: apiDistrict }
  );
  const matched = data.filter(
    (item) =>
      matchesFavoriteCrop(item.commodity, commodity) &&
      matchesFavoriteDistrict(item.district, districtCandidates)
  );

  return sortByModalPriceDesc(matched);
};

export const getFavoriteMarketPrices = async (
  userId: string
): Promise<MarketPriceDTO[]> => {
  const profile = await getProfile(userId);
  const favoriteCrops = profile.favoriteCrops.map((crop) => crop.trim()).filter(Boolean);

  if (favoriteCrops.length === 0) {
    marketLog.info("Market favourites empty", { userId });
    return [];
  }

  const state = DEFAULT_STATE;
  const originalDistrict = profile.district.trim();
  const apiDistrict = resolveGovDistrictForApi(originalDistrict);
  const districtCandidates = resolveGovDistrictCandidates(originalDistrict);

  marketLog.info("Market favourites fetch started", {
    userId,
    district: originalDistrict,
    cropCount: favoriteCrops.length,
  });

  const groupedByCrop = new Map<string, MarketPriceDTO[]>();
  const cropResults = await Promise.allSettled(
    favoriteCrops.map((crop) =>
      fetchFavoriteCropPrices(
        state,
        originalDistrict,
        apiDistrict,
        districtCandidates,
        crop
      )
    )
  );
  let successCount = 0;
  let lastFailure: unknown = null;

  cropResults.forEach((result, index) => {
    const crop = favoriteCrops[index];
    if (!crop) return;

    const cropKey = normalizeText(crop);
    if (result.status === "fulfilled") {
      successCount += 1;
      groupedByCrop.set(cropKey, result.value);
      return;
    }

    lastFailure = result.reason;
    groupedByCrop.set(cropKey, []);
    marketLog.error("Market favourites crop failed", {
      crop,
      district: originalDistrict,
      ...extractErrorMeta(result.reason),
    });
  });

  if (successCount === 0) {
    if (lastFailure instanceof AppError) {
      throw lastFailure;
    }
    throw mapGovApiError(lastFailure, {
      district: originalDistrict,
    });
  }

  const ordered: MarketPriceDTO[] = [];
  for (const crop of favoriteCrops) {
    const cropKey = normalizeText(crop);
    ordered.push(...(groupedByCrop.get(cropKey) ?? []));
  }

  marketLog.info("Market favourites fetch completed", {
    userId,
    district: originalDistrict,
    cropsSucceeded: successCount,
    cropsTotal: favoriteCrops.length,
    records: ordered.length,
  });

  return ordered;
};
