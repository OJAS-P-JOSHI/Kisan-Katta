import { normalizeDistrictName } from "../../config/maharashtraDistrictCoordinates";
import { MarketPriceDTO } from "./market.types";
import { normalizeText, sortByModalPriceDesc } from "./market.normalize";

const matchesFavoriteCrop = (commodity: string, crop: string): boolean =>
  commodity.trim() === crop.trim();

const matchesFavoriteDistrict = (
  recordDistrict: string,
  districtCandidates: string[]
): boolean => {
  const recordNorm = normalizeDistrictName(recordDistrict);
  return districtCandidates.some(
    (candidate) => normalizeDistrictName(candidate) === recordNorm
  );
};

export interface FilterDistrictDataInput {
  /** Normalized district market rows (already recent + latest-per-mandi). */
  districtData: readonly MarketPriceDTO[];
  /** Favourite / requested commodity names (exact trim match, same as before). */
  commodities: readonly string[];
  /** Profile + gov alias district names accepted for a row. */
  districtCandidates: readonly string[];
}

/**
 * Local filter over a cached district dataset.
 * Does not call the Government API.
 */
export const filterDistrictData = ({
  districtData,
  commodities,
  districtCandidates,
}: FilterDistrictDataInput): MarketPriceDTO[] => {
  const wanted = new Set(
    commodities.map((c) => c.trim()).filter(Boolean)
  );
  if (wanted.size === 0) return [];

  const candidates = [...districtCandidates];
  const matched = districtData.filter(
    (item) =>
      wanted.has(item.commodity.trim()) &&
      matchesFavoriteDistrict(item.district, candidates)
  );

  return sortByModalPriceDesc(matched);
};

/** Filter a district dataset down to a single commodity. */
export const filterDistrictDataForCommodity = (
  districtData: readonly MarketPriceDTO[],
  commodity: string,
  districtCandidates: readonly string[]
): MarketPriceDTO[] =>
  filterDistrictData({
    districtData,
    commodities: [commodity],
    districtCandidates,
  });

export const matchesCommodityExact = matchesFavoriteCrop;

export const groupByCommodityOrder = (
  records: readonly MarketPriceDTO[],
  commoditiesInOrder: readonly string[]
): MarketPriceDTO[] => {
  const byCrop = new Map<string, MarketPriceDTO[]>();
  for (const crop of commoditiesInOrder) {
    byCrop.set(normalizeText(crop), []);
  }
  for (const row of records) {
    const key = normalizeText(row.commodity);
    const bucket = byCrop.get(key);
    if (bucket) bucket.push(row);
  }
  const ordered: MarketPriceDTO[] = [];
  for (const crop of commoditiesInOrder) {
    ordered.push(...(byCrop.get(normalizeText(crop)) ?? []));
  }
  return ordered;
};
