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

/** Envelope returned by `GET /api/v1/market/prices`. */
export type MarketPricesResponse = {
  success: boolean;
  data: MarketPrice[];
};
