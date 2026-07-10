// Our own DTO shape for market price data, independent of any upstream
// government API format. Services must always map into this shape.
export interface MarketPriceDTO {
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
}

// Validated/normalized query parameters accepted by GET /api/v1/market/prices.
export interface MarketPricesQuery {
  state?: string;
  district?: string;
  commodity?: string;
  limit: number;
  offset: number;
}

// Shape of a single record as returned by the data.gov.in market prices
// resource. Field names match the upstream API exactly (PascalCase, prices
// as numeric strings); fields are optional since upstream data quality
// (missing fields) can't be guaranteed.
export interface GovMarketRecord {
  State?: string;
  District?: string;
  Market?: string;
  Commodity?: string;
  Variety?: string;
  Grade?: string;
  Arrival_Date?: string;
  Min_Price?: string | number;
  Max_Price?: string | number;
  Modal_Price?: string | number;
}

// Envelope returned by the data.gov.in resource API.
export interface GovApiResponse {
  records?: GovMarketRecord[];
  total?: number;
  count?: number;
  offset?: string | number;
  limit?: string | number;
}
