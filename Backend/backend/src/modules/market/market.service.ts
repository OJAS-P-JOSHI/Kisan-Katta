import { resolveDistrict } from "../../config/maharashtraDistrictCoordinates";
import { AppError } from "../../utils/AppError";
import { excludeFromGovernmentMarket, isExcludedFromGovernmentMarket } from "../crop/crop.special";
import { getProfile } from "../profile/profile.service";
import { getDistrictMarketDataset } from "./market.district";
import {
  filterDistrictData,
  filterDistrictDataForCommodity,
  groupByCommodityOrder,
} from "./market.filter";
import { extractErrorMeta, marketLog } from "./market.gov-client";
import { sortByModalPriceDesc } from "./market.normalize";
import {
  CropMarketIntelligenceDTO,
  MarketPriceDTO,
  MarketPricesQuery,
} from "./market.types";

const DEFAULT_STATE = "Maharashtra";

/** Request context for structured error logs only. */
interface GovRequestContext {
  commodity?: string;
  district?: string;
}

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

const requireDistrict = (district: string | undefined): string => {
  const trimmed = district?.trim();
  if (!trimmed) {
    throw new AppError("district is required for market data", 400);
  }
  return trimmed;
};

const applyLimitOffset = (
  rows: MarketPriceDTO[],
  limit: number,
  offset: number
): MarketPriceDTO[] => {
  if (offset <= 0 && rows.length <= limit) return rows;
  return rows.slice(offset, offset + limit);
};

/**
 * Market prices for optional commodity within a district.
 * Loads the district dataset once (cached 2h), then filters locally.
 */
export const getMarketPrices = async (
  query: MarketPricesQuery,
  _context: GovRequestContext | null = null
): Promise<MarketPriceDTO[]> => {
  // Milk has no Agmarknet mandi price — never call Government API for it.
  if (query.commodity && isExcludedFromGovernmentMarket(query.commodity)) {
    return [];
  }

  const state = (query.state ?? DEFAULT_STATE).trim() || DEFAULT_STATE;
  const districtInput = requireDistrict(query.district);
  const apiDistrict = resolveGovDistrictForApi(districtInput);
  const districtCandidates = resolveGovDistrictCandidates(districtInput);

  const districtData = await getDistrictMarketDataset(state, apiDistrict);

  const filterStarted = Date.now();
  let filtered: MarketPriceDTO[];

  if (query.commodity?.trim()) {
    filtered = filterDistrictDataForCommodity(
      districtData,
      query.commodity.trim(),
      districtCandidates
    );
    marketLog.info("Filtered 1 favourite commodities", {
      commodity: query.commodity.trim(),
      district: apiDistrict,
      matched: filtered.length,
      filterMs: Date.now() - filterStarted,
    });
  } else {
    // District-scoped fetch — return full normalized district set.
    filtered = sortByModalPriceDesc(districtData);
    marketLog.info("Filtered district dataset (all commodities)", {
      district: apiDistrict,
      matched: filtered.length,
      filterMs: Date.now() - filterStarted,
    });
  }

  return applyLimitOffset(filtered, query.limit, query.offset);
};

/**
 * District + commodity market intelligence.
 * Reuses the district memory cache (one Government request per district).
 */
export const getCropMarketIntelligence = async (
  query: MarketPricesQuery & { district: string; commodity: string }
): Promise<CropMarketIntelligenceDTO> => {
  const district = query.district.trim();
  const commodity = query.commodity.trim();

  // Milk has no Agmarknet mandi price — return empty intelligence (no OGD call).
  if (isExcludedFromGovernmentMarket(commodity)) {
    return buildCropMarketIntelligence(commodity, district, []);
  }

  const state = (query.state ?? DEFAULT_STATE).trim() || DEFAULT_STATE;
  const apiDistrict = resolveGovDistrictForApi(district);
  const districtCandidates = resolveGovDistrictCandidates(district);

  const districtData = await getDistrictMarketDataset(state, apiDistrict);

  const filterStarted = Date.now();
  const matched = filterDistrictDataForCommodity(
    districtData,
    commodity,
    districtCandidates
  );
  marketLog.info("Filtered 1 favourite commodities", {
    commodity,
    district: apiDistrict,
    matched: matched.length,
    filterMs: Date.now() - filterStarted,
  });

  const limited = applyLimitOffset(matched, query.limit, query.offset);
  return buildCropMarketIntelligence(commodity, district, limited);
};

/**
 * Favourite crop prices for a user — one district Government fetch, local filter.
 */
export const getFavoriteMarketPrices = async (
  userId: string
): Promise<MarketPriceDTO[]> => {
  const profile = await getProfile(userId);
  // Milk (and any non-Agmarknet favourites) must never hit Government Market APIs.
  const favoriteCrops = excludeFromGovernmentMarket(
    profile.favoriteCrops.map((crop) => crop.trim()).filter(Boolean)
  );

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

  try {
    const districtData = await getDistrictMarketDataset(state, apiDistrict);

    const filterStarted = Date.now();
    const matched = filterDistrictData({
      districtData,
      commodities: favoriteCrops,
      districtCandidates,
    });
    marketLog.info(`Filtered ${favoriteCrops.length} favourite commodities`, {
      district: apiDistrict,
      matched: matched.length,
      filterMs: Date.now() - filterStarted,
    });

    // Preserve previous response ordering: records grouped by favourite crop order.
    const ordered = groupByCommodityOrder(matched, favoriteCrops);

    marketLog.info("Market favourites fetch completed", {
      userId,
      district: originalDistrict,
      cropsTotal: favoriteCrops.length,
      records: ordered.length,
    });

    return ordered;
  } catch (error) {
    marketLog.error("Market favourites district fetch failed", {
      userId,
      district: originalDistrict,
      ...extractErrorMeta(error),
    });
    if (error instanceof AppError) throw error;
    throw new AppError("Government market data service is unavailable", 503);
  }
};

// Re-export filter helper for reuse / Phase 2.
export { filterDistrictData } from "./market.filter";
export {
  clearDistrictMarketCache,
  DISTRICT_CACHE_TTL_MS,
  getDistrictCacheExpiresInMs,
  getDistrictCacheMetrics,
} from "./market.district";
export { getConfiguredDistrictLimit } from "./market.gov-client";
