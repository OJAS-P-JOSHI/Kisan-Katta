import { GovMarketRecord, MarketPriceDTO } from "./market.types";

const DEFAULT_RECENT_DAYS = 20;

export const toNumber = (value: string | number | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeText = (value: string): string => value.trim().toLowerCase();

export const getRecentDaysWindow = (): number => {
  const raw = Number(process.env.MARKET_RECENT_DAYS);
  return Number.isInteger(raw) && raw > 0 ? raw : DEFAULT_RECENT_DAYS;
};

export const parseArrivalDate = (value: string | undefined): Date | null => {
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

export const filterRecentGovRecords = (records: GovMarketRecord[]): GovMarketRecord[] => {
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

/**
 * Keep the first (latest, when sorted Arrival_Date desc) row per commodity+market.
 * Commodity is part of the key so district-wide datasets do not collapse different
 * crops that share a mandi name (behaviour matches former per-commodity fetches).
 */
export const keepLatestRecordPerMandi = (records: GovMarketRecord[]): GovMarketRecord[] => {
  const seenKeys = new Set<string>();
  const latestPerMandi: GovMarketRecord[] = [];

  for (const record of records) {
    const marketKey = (record.Market ?? "").trim();
    if (!marketKey) continue;
    const commodityKey = normalizeText(record.Commodity ?? "");
    const dedupeKey = `${commodityKey}|${marketKey}`;
    if (seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);
    latestPerMandi.push(record);
  }

  return latestPerMandi;
};

export const toMarketPriceDTO = (record: GovMarketRecord): MarketPriceDTO => ({
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
export const sortByModalPriceDesc = (records: MarketPriceDTO[]): MarketPriceDTO[] =>
  [...records].sort((a, b) => b.modalPrice - a.modalPrice);

/** Normalize raw gov rows the same way as the former per-commodity path. */
export const normalizeGovRecordsToDto = (records: GovMarketRecord[]): MarketPriceDTO[] => {
  const recentRecords = filterRecentGovRecords(records);
  const latestPerMandiRecords = keepLatestRecordPerMandi(recentRecords);
  return latestPerMandiRecords.map(toMarketPriceDTO);
};
