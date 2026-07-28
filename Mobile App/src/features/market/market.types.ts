/** Government mandi price record, as returned by the backend market API. */
export type MarketPrice = {
  commodity: string;
  market: string;
  district: string;
  state: string;
  variety: string;
  grade: string;
  arrivalDate: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
};

/** Envelope returned by `GET /api/v1/market/prices` and `GET /api/v1/market/favourites`. */
export type MarketPricesResponse = {
  success: boolean;
  data: MarketPrice[];
};

/**
 * Crop-level market intelligence from `GET /api/v1/market/intelligence`.
 * Markets are sorted by modalPrice descending; summary is server-computed.
 */
export type CropMarketIntelligence = {
  commodity: string;
  district: string;
  markets: MarketPrice[];
  highestPrice: number;
  lowestPrice: number;
  averageModalPrice: number;
  marketCount: number;
};

export type CropMarketIntelligenceResponse = {
  success: boolean;
  data: CropMarketIntelligence;
};

export type MarketCropCardState = 'loading' | 'success' | 'empty' | 'error';

export type MarketCropCardModel = {
  crop: string;
  state: MarketCropCardState;
  data: CropMarketIntelligence | null;
  error: string | null;
  isRefreshing: boolean;
  lastUpdatedAt: number | null;
};
