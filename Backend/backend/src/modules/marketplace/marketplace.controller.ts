import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { getAuthUser } from "../auth/auth.middleware";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  LISTING_SORT_OPTIONS,
  MARKETPLACE_CATEGORIES,
  MAX_LIMIT,
} from "./marketplace.constants";
import {
  archiveListing,
  createListing,
  getListingById,
  getListings,
  getMyListings,
  getSavedListings,
  recordContactClick,
  saveListing,
  unsaveListing,
  updateListing,
} from "./marketplace.service";
import {
  validateCreateListing,
  validateUpdateListing,
} from "./marketplace.validation";
import type {
  ListingDetailResponseDTO,
  ListingResponseDTO,
  ListingSortOption,
  ListingsQuery,
  MarketplaceCategory,
  PaginatedListingsDTO,
  SavedListingsDTO,
} from "./marketplace.types";
import type { ApiSuccessResponse } from "../../types/api-response";
import type { ListingType } from "./marketplace.types";
import { LISTING_TYPES } from "./marketplace.constants";

// ---------------------------------------------------------------------------
// Query parsers
// ---------------------------------------------------------------------------

const parseStringParam = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError("Query parameter must be a non-empty string.", 400);
  }
  return value.trim();
};

const parsePage = (value: unknown): number => {
  if (value === undefined) return DEFAULT_PAGE;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError("page must be an integer >= 1.", 400);
  }
  return parsed;
};

const parseLimit = (value: unknown): number => {
  if (value === undefined) return DEFAULT_LIMIT;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > MAX_LIMIT) {
    throw new AppError(`limit must be an integer between 1 and ${MAX_LIMIT}.`, 400);
  }
  return parsed;
};

const parseSort = (value: unknown): ListingSortOption => {
  if (value === undefined) return "newest";
  if (
    typeof value !== "string" ||
    !(LISTING_SORT_OPTIONS as readonly string[]).includes(value)
  ) {
    throw new AppError(
      `sort must be one of: ${LISTING_SORT_OPTIONS.join(", ")}.`,
      400
    );
  }
  return value as ListingSortOption;
};

const parseCategory = (value: unknown): MarketplaceCategory | undefined => {
  const category = parseStringParam(value);
  if (category === undefined) return undefined;
  if (!(MARKETPLACE_CATEGORIES as readonly string[]).includes(category)) {
    throw new AppError(`category must be one of: ${MARKETPLACE_CATEGORIES.join(", ")}.`, 400);
  }
  return category as MarketplaceCategory;
};

const parseListingType = (value: unknown): ListingType | undefined => {
  const listingType = parseStringParam(value);
  if (listingType === undefined) return undefined;
  if (!(LISTING_TYPES as readonly string[]).includes(listingType)) {
    throw new AppError(`listingType must be one of: ${LISTING_TYPES.join(", ")}.`, 400);
  }
  return listingType as ListingType;
};

const parseListingsQuery = (req: Request): ListingsQuery => ({
  search: parseStringParam(req.query.search),
  category: parseCategory(req.query.category),
  listingType: parseListingType(req.query.listingType),
  district: parseStringParam(req.query.district),
  page: parsePage(req.query.page),
  limit: parseLimit(req.query.limit),
  sort: parseSort(req.query.sort),
});

const parsePaginationQuery = (
  req: Request
): { page: number; limit: number } => ({
  page: parsePage(req.query.page),
  limit: parseLimit(req.query.limit),
});

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const createListingHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ListingResponseDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const body = validateCreateListing(req.body as Record<string, unknown>);
  const data = await createListing(userId, body);
  res.status(201).json({ success: true, data });
};

export const getListingsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PaginatedListingsDTO>>
): Promise<void> => {
  const query = parseListingsQuery(req);
  const authenticatedUserId = req.user?.userId;
  const data = await getListings(query, authenticatedUserId);
  res.status(200).json({ success: true, data });
};

export const getListingByIdHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ListingDetailResponseDTO>>
): Promise<void> => {
  const listingId = req.params["id"];
  if (!listingId) {
    throw new AppError("Listing id is required.", 400);
  }
  const data = await getListingById(listingId, req.user?.userId);
  res.status(200).json({ success: true, data });
};

export const updateListingHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ListingResponseDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const listingId = req.params["id"];
  if (!listingId) {
    throw new AppError("Listing id is required.", 400);
  }
  const body = validateUpdateListing(req.body as Record<string, unknown>);
  const data = await updateListing(userId, listingId, body);
  res.status(200).json({ success: true, data });
};

export const archiveListingHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ListingResponseDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const listingId = req.params["id"];
  if (!listingId) {
    throw new AppError("Listing id is required.", 400);
  }
  const data = await archiveListing(userId, listingId);
  res.status(200).json({ success: true, data });
};

export const getMyListingsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PaginatedListingsDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const { page, limit } = parsePaginationQuery(req);
  const data = await getMyListings(userId, page, limit);
  res.status(200).json({ success: true, data });
};

export const saveListingHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<{ listingId: string; savedAt: Date }>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const listingId = req.params["id"];
  if (!listingId) {
    throw new AppError("Listing id is required.", 400);
  }
  const data = await saveListing(userId, listingId);
  res.status(201).json({ success: true, data });
};

export const unsaveListingHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<{ listingId: string }>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const listingId = req.params["id"];
  if (!listingId) {
    throw new AppError("Listing id is required.", 400);
  }
  const data = await unsaveListing(userId, listingId);
  res.status(200).json({ success: true, data });
};

export const getSavedListingsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<SavedListingsDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const { page, limit } = parsePaginationQuery(req);
  const data = await getSavedListings(userId, page, limit);
  res.status(200).json({ success: true, data });
};

export const contactListingHandler = async (
  req: Request,
  res: Response<{ success: true }>
): Promise<void> => {
  const listingId = req.params["id"];
  if (!listingId) {
    throw new AppError("Listing id is required.", 400);
  }
  await recordContactClick(listingId);
  res.status(200).json({ success: true });
};
