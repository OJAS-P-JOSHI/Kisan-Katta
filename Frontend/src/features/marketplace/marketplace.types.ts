import type { ID } from '@/types';
import type { ApiSuccessResponse } from '@/types';

import type {
  LISTING_STATUSES,
  LISTING_TYPES,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_UNITS,
} from './marketplace.constants';

export type ListingType = (typeof LISTING_TYPES)[number];
export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number];
export type MarketplaceUnit = (typeof MARKETPLACE_UNITS)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export type SellerInfo = {
  name: string;
  district: string;
  phone: string;
};

export type MarketplaceListing = {
  id: ID;
  sellerId: string;
  listingType: ListingType;
  title: string;
  description?: string;
  category: MarketplaceCategory;
  subcategory?: string;
  price: number;
  quantity?: number;
  unit?: MarketplaceUnit;
  images: string[];
  district: string;
  status: ListingStatus;
  views: number;
  contactClicks: number;
  expiresAt: string;
  crop?: string;
  harvestDate?: string;
  moisture?: number;
  expectedPrice?: number;
  brand?: string;
  stock?: number;
  createdAt: string;
  updatedAt: string;
};

export type MarketplaceListingDetail = MarketplaceListing & {
  seller: SellerInfo;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedListings = {
  listings: MarketplaceListing[];
  pagination: PaginationMeta;
};

export type ListingsQueryParams = {
  search?: string;
  category?: MarketplaceCategory;
  listingType?: ListingType;
  district?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'price_low_to_high' | 'price_high_to_low';
};

export type CreateListingPayload = {
  listingType: ListingType;
  title: string;
  description?: string;
  category: MarketplaceCategory;
  price: number;
  quantity?: number;
  unit?: MarketplaceUnit;
  images?: string[];
  crop?: string;
  harvestDate?: string;
  expectedPrice?: number;
  brand?: string;
  stock?: number;
};

export type UpdateListingPayload = Partial<
  Omit<CreateListingPayload, 'listingType'>
> & {
  status?: ListingStatus;
};

export type SaveListingResult = {
  listingId: string;
  savedAt: string;
};

export type UnsaveListingResult = {
  listingId: string;
};

export type PaginatedListingsResponse = ApiSuccessResponse<PaginatedListings>;
export type ListingDetailResponse = ApiSuccessResponse<MarketplaceListingDetail>;
export type ListingResponse = ApiSuccessResponse<MarketplaceListing>;
export type SaveListingResponse = ApiSuccessResponse<SaveListingResult>;
export type UnsaveListingResponse = ApiSuccessResponse<UnsaveListingResult>;
