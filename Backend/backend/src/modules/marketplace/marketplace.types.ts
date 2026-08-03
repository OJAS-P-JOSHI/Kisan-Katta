import { Types } from "mongoose";
import type {
  LABOUR_GENDERS,
  LABOUR_RATE_TYPES,
  LISTING_SORT_OPTIONS,
  LISTING_STATUSES,
  LISTING_TYPES,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_UNITS,
} from "./marketplace.constants";

// ---------------------------------------------------------------------------
// Enums (derived from constants)
// ---------------------------------------------------------------------------

export type ListingType = (typeof LISTING_TYPES)[number];
export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number];
export type MarketplaceUnit = (typeof MARKETPLACE_UNITS)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];
export type ListingSortOption = (typeof LISTING_SORT_OPTIONS)[number];
export type LabourGender = (typeof LABOUR_GENDERS)[number];
export type LabourRateType = (typeof LABOUR_RATE_TYPES)[number];

// ---------------------------------------------------------------------------
// Image shapes
// ---------------------------------------------------------------------------

export interface ListingImage {
  url: string;
  publicId: string;
}

export interface UploadImagesResponseDTO {
  images: ListingImage[];
}

export interface DeleteImageBody {
  publicId: string;
}

// ---------------------------------------------------------------------------
// Mongoose document interfaces
// ---------------------------------------------------------------------------

export interface IMarketplaceListing {
  sellerId: Types.ObjectId;
  listingType: ListingType;
  title: string;
  description?: string;
  category: MarketplaceCategory;
  subcategory?: string;
  price: number;
  quantity?: number;
  unit?: MarketplaceUnit;
  images: ListingImage[];
  district: string;
  village?: string;
  taluka?: string;
  status: ListingStatus;
  views: number;
  contactClicks: number;
  expiresAt: Date;
  crop?: string;
  harvestDate?: Date;
  moisture?: number;
  expectedPrice?: number;
  brand?: string;
  stock?: number;
  /** Labour: number of available workers. */
  availableWorkers?: number;
  /** Labour: Male | Female | Mixed Group. */
  gender?: LabourGender;
  /** Labour: per_day | per_hour (price holds the amount). */
  rateType?: LabourRateType;
  /** Labour: date available from. */
  availableFrom?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMarketplaceSaved {
  userId: Types.ObjectId;
  listingId: Types.ObjectId;
  savedAt: Date;
}

// ---------------------------------------------------------------------------
// Request body shapes
// ---------------------------------------------------------------------------

export interface CreateListingBody {
  listingType: ListingType;
  title: string;
  description?: string;
  category: MarketplaceCategory;
  subcategory?: string;
  price: number;
  quantity?: number;
  unit?: MarketplaceUnit;
  images?: ListingImage[];
  crop?: string;
  harvestDate?: Date;
  moisture?: number;
  expectedPrice?: number;
  brand?: string;
  stock?: number;
  availableWorkers?: number;
  gender?: LabourGender;
  rateType?: LabourRateType;
  availableFrom?: Date;
}

export interface UpdateListingBody {
  title?: string;
  description?: string;
  category?: MarketplaceCategory;
  subcategory?: string;
  price?: number;
  quantity?: number;
  unit?: MarketplaceUnit;
  images?: ListingImage[];
  status?: ListingStatus;
  crop?: string;
  harvestDate?: Date;
  moisture?: number;
  expectedPrice?: number;
  brand?: string;
  stock?: number;
  availableWorkers?: number;
  gender?: LabourGender;
  rateType?: LabourRateType;
  availableFrom?: Date;
}

export interface ListingsQuery {
  search?: string;
  category?: MarketplaceCategory;
  listingType?: ListingType;
  district?: string;
  page: number;
  limit: number;
  sort: ListingSortOption;
}

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

export interface SellerInfoDTO {
  name: string;
  district: string;
  phone: string;
}

export interface ListingResponseDTO {
  id: string;
  sellerId: string;
  listingType: ListingType;
  title: string;
  description?: string;
  category: MarketplaceCategory;
  subcategory?: string;
  price: number;
  quantity?: number;
  unit?: MarketplaceUnit;
  images: ListingImage[];
  district: string;
  village?: string;
  taluka?: string;
  status: ListingStatus;
  views: number;
  contactClicks: number;
  expiresAt: Date;
  crop?: string;
  harvestDate?: Date;
  moisture?: number;
  expectedPrice?: number;
  brand?: string;
  stock?: number;
  availableWorkers?: number;
  gender?: LabourGender;
  rateType?: LabourRateType;
  availableFrom?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingDetailResponseDTO extends ListingResponseDTO {
  seller: SellerInfoDTO;
}

export interface PaginatedListingsDTO {
  listings: ListingResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SavedListingsDTO {
  listings: ListingResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Aggregated counts for the Home "My Marketplace" summary card. */
export interface MyMarketplaceSummaryDTO {
  active: number;
  sold: number;
  archived: number;
  saved: number;
}
