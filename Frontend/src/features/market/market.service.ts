import { api } from '@/services/api';

import type { MarketPrice, MarketPricesResponse } from './market.types';

/**
 * Our backend's market endpoint, relative to the shared client's configured
 * base URL (see `src/config/environment.ts`). The government API is never
 * called directly.
 */
const MARKET_PRICES_ENDPOINT = '/api/v1/market/prices';

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
