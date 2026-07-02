import axios from "axios";
import dotenv from "dotenv";
import { AppError } from "../../utils/AppError";
import {
  GovApiResponse,
  GovMarketRecord,
  MarketPriceDTO,
  MarketPricesQuery,
} from "./market.types";

// Ensures .env is loaded even if this module is ever imported before
// config/env.ts runs, without changing any file outside the Market module.
dotenv.config();

const GOV_API_BASE_URL =
  "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24";
const GOV_API_KEY = process.env.GOV_API_KEY ?? "";
const REQUEST_TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Simple in-memory cache for transformed market price responses, keyed by
// the exact query that produced them. No external store (e.g. Redis) needed
// since this is process-local and short-lived.
interface CacheEntry {
  data: MarketPriceDTO[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

// Builds a stable cache key from the filter/pagination fields that affect
// the upstream request, so different queries never share a cache entry.
const buildCacheKey = (query: MarketPricesQuery): string =>
  [
    query.state ?? "",
    query.district ?? "",
    query.commodity ?? "",
    query.arrivalDate ?? "",
    query.limit,
    query.offset,
  ].join("|");

// Maps our query params to the government API's filters[...] query keys.
// Only filters explicitly provided by the client are sent upstream.
const buildFilterParams = (query: MarketPricesQuery): Record<string, string> => {
  const params: Record<string, string> = {};

  if (query.state) params["filters[State]"] = query.state;
  if (query.district) params["filters[District]"] = query.district;
  if (query.commodity) params["filters[Commodity]"] = query.commodity;
  if (query.arrivalDate) params["filters[Arrival_Date]"] = query.arrivalDate;

  return params;
};

// The government API may return price fields as numeric strings; this
// guarantees every price in our DTO is always a real number.
const toNumber = (value: string | number | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Transforms a raw government API record into our own DTO shape so callers
// never depend on the upstream response format.
const toMarketPriceDTO = (record: GovMarketRecord): MarketPriceDTO => ({
  commodity: record.Commodity ?? "",
  market: record.Market ?? "",
  district: record.District ?? "",
  state: record.State ?? "",
  variety: record.Variety ?? "",
  grade: record.Grade ?? "",
  arrivalDate: record.Arrival_Date ?? "",
  modalPrice: toNumber(record.Modal_Price),
  minPrice: toNumber(record.Min_Price),
  maxPrice: toNumber(record.Max_Price),
});

// Translates Axios/network failures into an AppError with the right HTTP
// status so the existing global error handler responds correctly.
const mapGovApiError = (error: unknown): AppError => {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new AppError("Government market data service timed out", 504);
    }
    // Covers no-response network errors (ECONNREFUSED/ENOTFOUND) and any
    // non-2xx response from the upstream API.
    return new AppError("Government market data service is unavailable", 503);
  }

  return new AppError("Unexpected error while fetching market prices", 500);
};

export const getMarketPrices = async (
  query: MarketPricesQuery
): Promise<MarketPriceDTO[]> => {
  const cacheKey = buildCacheKey(query);
  const cached = cache.get(cacheKey);

  if (cached) {
    if (cached.expiresAt > Date.now()) {
      return cached.data;
    }
    // Expired - drop it so a stale entry can't accumulate in memory.
    cache.delete(cacheKey);
  }

  if (!GOV_API_KEY) {
    throw new AppError("Government market data API key is not configured", 500);
  }

  try {
    const { data } = await axios.get<GovApiResponse>(GOV_API_BASE_URL, {
      timeout: REQUEST_TIMEOUT_MS,
      params: {
        "api-key": GOV_API_KEY,
        format: "json",
        limit: query.limit,
        offset: query.offset,
        ...buildFilterParams(query),
      },
    });

    const mapped = (data.records ?? []).map(toMarketPriceDTO);
    cache.set(cacheKey, { data: mapped, expiresAt: Date.now() + CACHE_TTL_MS });

    return mapped;
  } catch (error) {
    throw mapGovApiError(error);
  }
};
