import { api } from '@/services/api';

import type {
  CropMarketIntelligence,
  CropMarketIntelligenceResponse,
  MarketPrice,
  MarketPricesResponse,
} from './market.types';

/**
 * Our backend's market endpoint, relative to the shared client's configured
 * base URL (see `src/config/environment.ts`). The government API is never
 * called directly.
 */
const MARKET_PRICES_ENDPOINT = '/api/v1/market/prices';
const MARKET_INTELLIGENCE_ENDPOINT = '/api/v1/market/intelligence';
const MARKET_FAVOURITES_ENDPOINT = '/api/v1/market/favourites';

const DEFAULT_STATE = 'Maharashtra';
const DEFAULT_LIMIT = 20;

/** Fetches live mandi prices for a state from our backend. */
export const getMarketPrices = async (
  state: string = DEFAULT_STATE,
  limit: number = DEFAULT_LIMIT,
): Promise<MarketPrice[]> => {
  const response = await api.get<MarketPricesResponse>(MARKET_PRICES_ENDPOINT, {
    params: { state, limit },
  });
  return response.data.data;
};

/** Fetches mandi prices for one district+commodity pair from our backend. */
export const getMarketPricesForCrop = async ({
  district,
  commodity,
  state = DEFAULT_STATE,
  limit = 100,
  offset = 0,
}: {
  district: string;
  commodity: string;
  state?: string;
  limit?: number;
  offset?: number;
}): Promise<MarketPrice[]> => {
  const response = await api.get<MarketPricesResponse>(MARKET_PRICES_ENDPOINT, {
    params: { state, district, commodity, limit, offset },
  });
  return response.data.data;
};

/**
 * Crop market intelligence — all mandis + server summary for one district+commodity.
 * One request per crop; reuses backend cache shared with /prices.
 */
export const getCropMarketIntelligence = async ({
  district,
  commodity,
  state = DEFAULT_STATE,
  limit = 100,
  offset = 0,
}: {
  district: string;
  commodity: string;
  state?: string;
  limit?: number;
  offset?: number;
}): Promise<CropMarketIntelligence> => {
  const response = await api.get<CropMarketIntelligenceResponse>(MARKET_INTELLIGENCE_ENDPOINT, {
    params: { state, district, commodity, limit, offset },
  });
  return response.data.data;
};

/** Fetches mandi prices for the authenticated farmer's favourite crops. */
export const getFavouriteMarketPrices = async (): Promise<MarketPrice[]> => {
  const response = await api.get<MarketPricesResponse>(MARKET_FAVOURITES_ENDPOINT);
  return response.data.data;
};
