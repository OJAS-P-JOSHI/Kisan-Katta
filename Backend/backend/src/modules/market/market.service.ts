import dns from "node:dns/promises";
import { env } from "../../config/env";
import { normalizeDistrictName, resolveDistrict } from "../../config/maharashtraDistrictCoordinates";
import { AppError } from "../../utils/AppError";
import { getProfile } from "../profile/profile.service";
import { GovApiResponse, GovMarketRecord, MarketPriceDTO, MarketPricesQuery } from "./market.types";

const DEFAULT_STATE = "Maharashtra";
const REQUEST_TIMEOUT_MS = 30_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const FAVOURITES_LIMIT = 100;
const GOV_API_URL = `${env.marketApiBaseUrl}/resource/${env.marketDatasetId}`;
const DEFAULT_RECENT_DAYS = 20;

interface FavouritesDebugContext {
  crop: string;
  district: string;
  mappedCrop: string;
  url: string;
  params: Record<string, string | number>;
}

interface CacheEntry {
  data: MarketPriceDTO[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

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
  // eslint-disable-next-line no-console
  console.log("Government records received:", records.length);

  if (records.length === 0) return [];

  const recentDays = getRecentDaysWindow();
  const today = new Date();
  const cutoffDate = new Date(today);
  cutoffDate.setDate(today.getDate() - recentDays);
  cutoffDate.setHours(0, 0, 0, 0);

  // eslint-disable-next-line no-console
  console.log("Today's date:", today.toISOString());
  // eslint-disable-next-line no-console
  console.log("Cutoff date:", cutoffDate.toISOString());

  const filtered = records.filter((record) => {
    const arrivalDate = parseArrivalDate(record.Arrival_Date);
    if (!arrivalDate) return false;
    return arrivalDate >= cutoffDate;
  });

  // eslint-disable-next-line no-console
  console.log("Records after recent filter:", filtered.length);
  // eslint-disable-next-line no-console
  console.log("Government records after filtering:", filtered.length);
  return filtered;
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

  // eslint-disable-next-line no-console
  console.log("Records after latest mandi filter:", latestPerMandi.length);
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

const buildGovApiUrl = (params: Record<string, string | number>): string => {
  const url = new URL(GOV_API_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, String(value));
  }
  return url.toString();
};

const mapGovApiError = (
  error: unknown,
  debugContext: FavouritesDebugContext | null = null
): AppError => {
  if (error instanceof Error && error.name === "AbortError") {
    // eslint-disable-next-line no-console
    console.error("Government API timeout:", error.message);
    if (debugContext) {
      // eslint-disable-next-line no-console
      console.error("Timeout details:", {
        crop: debugContext.crop,
        district: debugContext.district,
        url: debugContext.url,
        params: debugContext.params,
        retryNumber: "N/A",
      });
    }
    return new AppError("Government market data service timed out", 504);
  }

  if (error instanceof Error) {
    // eslint-disable-next-line no-console
    console.error("Government API unavailable:", error.message);
    return new AppError("Government market data service is unavailable", 503);
  }

  // eslint-disable-next-line no-console
  console.error("Government API unexpected error:", error);
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
  debugContext: FavouritesDebugContext | null = null
): Promise<MarketPriceDTO[]> => {
  if (!env.marketApiKey) {
    throw new AppError("Government market data API key is not configured", 500);
  }

  const params = buildGovFilters(query);
  const start = Date.now();
  // eslint-disable-next-line no-console
  console.log("Government API request:", params);

  if (debugContext) {
    // eslint-disable-next-line no-console
    console.log("Government API URL:", GOV_API_URL);
    // eslint-disable-next-line no-console
    console.log("Government API Params:", params);
    // eslint-disable-next-line no-console
    console.log("Timeout:", REQUEST_TIMEOUT_MS);
  }

  const timerLabel = `Gov API ${debugContext?.mappedCrop ?? query.commodity ?? "unknown"}`;

  try {
    if (debugContext) {
      // eslint-disable-next-line no-console
      console.time(timerLabel);
    }

    const finalUrl = buildGovApiUrl(params);

    // eslint-disable-next-line no-console
    console.log("================================================");
    // eslint-disable-next-line no-console
    console.log("FINAL GOV URL");
    // eslint-disable-next-line no-console
    console.log(finalUrl);
    // eslint-disable-next-line no-console
    console.log("================================================");

    // eslint-disable-next-line no-console
    console.log("Axios timeout:", REQUEST_TIMEOUT_MS);
    // eslint-disable-next-line no-console
    console.log("Node version:", process.version);
    // eslint-disable-next-line no-console
    console.log("Platform:", process.platform);

    const host = new URL(GOV_API_URL).hostname;

    // eslint-disable-next-line no-console
    console.time("DNS Lookup");

    const dnsResult = await dns.lookup(host, {
      all: true,
    });

    // eslint-disable-next-line no-console
    console.timeEnd("DNS Lookup");

    // eslint-disable-next-line no-console
    console.log("DNS Result:", dnsResult);

    // eslint-disable-next-line no-console
    console.time("Axios Request");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(finalUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    // eslint-disable-next-line no-console
    console.timeEnd("Axios Request");

    // eslint-disable-next-line no-console
    console.log("Response status:", response.status);
    // eslint-disable-next-line no-console
    console.log("Response server:", response.headers.get("server"));
    // eslint-disable-next-line no-console
    console.log("Response content-length:", response.headers.get("content-length"));
    // eslint-disable-next-line no-console
    console.log("Response content-type:", response.headers.get("content-type"));

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // eslint-disable-next-line no-console
        console.error("Government API invalid key:", response.status);
        throw new AppError("Government market data API key is invalid", 500);
      }

      // eslint-disable-next-line no-console
      console.error("Government API unavailable:", response.statusText);
      throw new AppError("Government market data service is unavailable", 503);
    }

    const responseData = (await response.json()) as GovApiResponse;

    if (debugContext) {
      // eslint-disable-next-line no-console
      console.timeEnd(timerLabel);
      // eslint-disable-next-line no-console
      console.log("HTTP Status:", response.status);
      // eslint-disable-next-line no-console
      console.log("Records Returned:", responseData.records?.length);
      // eslint-disable-next-line no-console
      console.log("Total:", responseData.total);
      // eslint-disable-next-line no-console
      console.log("Count:", responseData.count);
      // eslint-disable-next-line no-console
      console.log("First Raw Record:");
      // eslint-disable-next-line no-console
      console.dir(responseData.records?.[0], { depth: null });
    }

    const elapsedMs = Date.now() - start;
    // eslint-disable-next-line no-console
    console.log(`Government API response in ${elapsedMs}ms`);

    if (!Array.isArray(responseData.records)) {
      throw new AppError("Unexpected response from government market data API", 502);
    }

    const recentRecords = filterRecentGovRecords(responseData.records);
    const latestPerMandiRecords = keepLatestRecordPerMandi(recentRecords);
    const mappedRecords = latestPerMandiRecords.map(toMarketPriceDTO);

    if (debugContext) {
      // eslint-disable-next-line no-console
      console.log("Mapped DTO Count:", mappedRecords.length);
      // eslint-disable-next-line no-console
      console.log("First DTO:");
      // eslint-disable-next-line no-console
      console.dir(mappedRecords[0], { depth: null });
    }

    return mappedRecords;
  } catch (error) {
    if (debugContext) {
      // eslint-disable-next-line no-console
      console.timeEnd(timerLabel);
    }

    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("GOVERNMENT API ERROR");
      // eslint-disable-next-line no-console
      console.error({
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    if (error instanceof AppError) {
      throw error;
    }
    throw mapGovApiError(error, debugContext);
  }
};

export const getMarketPrices = async (
  query: MarketPricesQuery,
  debugContext: FavouritesDebugContext | null = null
): Promise<MarketPriceDTO[]> => {
  const cacheKey = buildCacheKey(query);
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    // eslint-disable-next-line no-console
    console.log("Market cache hit:", cacheKey);
    return cached.data;
  }

  // eslint-disable-next-line no-console
  console.log("Market cache miss:", cacheKey);
  const data = await fetchMarketPricesFromGov(query, debugContext);
  cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
};

const fetchFavoriteCropPrices = async (
  state: string,
  originalDistrict: string,
  apiDistrict: string,
  districtCandidates: string[],
  crop: string
): Promise<MarketPriceDTO[]> => {
  const commodity = crop.trim();

  // eslint-disable-next-line no-console
  console.log("Original District:", originalDistrict);
  // eslint-disable-next-line no-console
  console.log("Mapped District:", apiDistrict);
  // eslint-disable-next-line no-console
  console.log("Original crop:", crop);
  // eslint-disable-next-line no-console
  console.log("Final crop sent to Government API:", commodity);

  const params = buildGovFilters({
    state,
    district: apiDistrict,
    commodity,
    limit: FAVOURITES_LIMIT,
    offset: 0,
  });

  const debugContext: FavouritesDebugContext = {
    crop,
    district: apiDistrict,
    mappedCrop: commodity,
    url: GOV_API_URL,
    params,
  };

  const data = await getMarketPrices(
    {
      state,
      district: apiDistrict,
      commodity,
      limit: FAVOURITES_LIMIT,
      offset: 0,
    },
    debugContext
  );

  const matched = data.filter(
    (item) =>
      matchesFavoriteCrop(item.commodity, commodity) &&
      matchesFavoriteDistrict(item.district, districtCandidates)
  );

  // eslint-disable-next-line no-console
  console.log(`Crop completed: ${crop} - Returned ${matched.length} records`);

  return matched;
};

export const getFavoriteMarketPrices = async (
  userId: string
): Promise<MarketPriceDTO[]> => {
  // eslint-disable-next-line no-console
  console.log("========== MARKET FAVOURITES START ==========");
  // eslint-disable-next-line no-console
  console.log("Authenticated User ID:", userId);

  const profile = await getProfile(userId);
  // eslint-disable-next-line no-console
  console.log("Profile:", profile);
  // eslint-disable-next-line no-console
  console.log("District:", profile.district);
  // eslint-disable-next-line no-console
  console.log("Favourite Crops:", profile.favoriteCrops);

  const favoriteCrops = profile.favoriteCrops.map((crop) => crop.trim()).filter(Boolean);

  if (favoriteCrops.length === 0) {
    // eslint-disable-next-line no-console
    console.log("Returning favourites: 0");
    // eslint-disable-next-line no-console
    console.log("========== MARKET FAVOURITES END ==========");
    return [];
  }

  const state = DEFAULT_STATE;
  const originalDistrict = profile.district.trim();
  const apiDistrict = resolveGovDistrictForApi(originalDistrict);
  const districtCandidates = resolveGovDistrictCandidates(originalDistrict);

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
    // eslint-disable-next-line no-console
    console.error(`Crop failed: ${crop}`, result.reason);
  });

  if (successCount === 0) {
    if (lastFailure instanceof AppError) {
      throw lastFailure;
    }
    throw mapGovApiError(lastFailure);
  }

  // eslint-disable-next-line no-console
  console.log("Total arrays:", groupedByCrop.size);
  // eslint-disable-next-line no-console
  console.log(
    "Array lengths:",
    [...groupedByCrop.values()].map((arr) => arr.length)
  );

  const ordered: MarketPriceDTO[] = [];
  for (const crop of favoriteCrops) {
    const cropKey = normalizeText(crop);
    ordered.push(...(groupedByCrop.get(cropKey) ?? []));
  }

  // eslint-disable-next-line no-console
  console.log("Merged Records:", ordered.length);
  // eslint-disable-next-line no-console
  console.log("Returning favourites:", ordered.length);
  // eslint-disable-next-line no-console
  console.log("========== MARKET FAVOURITES END ==========");

  return ordered;
};
