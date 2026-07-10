import { AppError } from "../../utils/AppError";
import {
  LISTING_STATUSES,
  LISTING_TYPES,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_UNITS,
  MAX_LISTING_IMAGES,
} from "./marketplace.constants";
import type {
  CreateListingBody,
  ListingStatus,
  ListingType,
  MarketplaceCategory,
  MarketplaceUnit,
  UpdateListingBody,
} from "./marketplace.types";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

const requireString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${field} is required and must be a non-empty string.`, 400);
  }
  return value.trim();
};

const optionalString = (value: unknown, field: string): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${field} must be a non-empty string when provided.`, 400);
  }
  return value.trim();
};

const requirePositiveNumber = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new AppError(`${field} is required and must be a non-negative number.`, 400);
  }
  return value;
};

const validateListingType = (value: unknown): ListingType => {
  if (value !== "product" && value !== "produce") {
    throw new AppError(`listingType must be one of: ${LISTING_TYPES.join(", ")}.`, 400);
  }
  return value;
};

const validateCategory = (value: unknown): MarketplaceCategory => {
  if (
    typeof value !== "string" ||
    !(MARKETPLACE_CATEGORIES as readonly string[]).includes(value)
  ) {
    throw new AppError(`category must be one of: ${MARKETPLACE_CATEGORIES.join(", ")}.`, 400);
  }
  return value as MarketplaceCategory;
};

const validateUnit = (value: unknown): MarketplaceUnit => {
  if (typeof value !== "string" || !(MARKETPLACE_UNITS as readonly string[]).includes(value)) {
    throw new AppError(`unit must be one of: ${MARKETPLACE_UNITS.join(", ")}.`, 400);
  }
  return value as MarketplaceUnit;
};

const validateStatus = (value: unknown): ListingStatus => {
  if (typeof value !== "string" || !(LISTING_STATUSES as readonly string[]).includes(value)) {
    throw new AppError(`status must be one of: ${LISTING_STATUSES.join(", ")}.`, 400);
  }
  return value as ListingStatus;
};

const validateImages = (value: unknown): string[] => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new AppError("images must be an array of URL strings.", 400);
  }
  if (value.length > MAX_LISTING_IMAGES) {
    throw new AppError(`images cannot contain more than ${MAX_LISTING_IMAGES} URLs.`, 400);
  }
  const urls: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new AppError("Each image must be a non-empty URL string.", 400);
    }
    urls.push(item.trim());
  }
  return urls;
};

const validateHarvestDate = (value: unknown): Date => {
  if (typeof value !== "string" && !(value instanceof Date)) {
    throw new AppError("harvestDate must be a valid date string.", 400);
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("harvestDate must be a valid date.", 400);
  }
  return date;
};

const rejectDistrictField = (body: Record<string, unknown>): void => {
  if (body["district"] !== undefined) {
    throw new AppError(
      "district cannot be supplied by the client. It is copied from your profile automatically.",
      400
    );
  }
};

const validateProduceFields = (body: CreateListingBody | UpdateListingBody, isCreate: boolean): void => {
  if (!isCreate) return;

  const createBody = body as CreateListingBody;
  if (!createBody.crop) {
    throw new AppError("crop is required for produce listings.", 400);
  }
  if (createBody.quantity === undefined) {
    throw new AppError("quantity is required for produce listings.", 400);
  }
  if (!createBody.harvestDate) {
    throw new AppError("harvestDate is required for produce listings.", 400);
  }
};

// ---------------------------------------------------------------------------
// Exported validators
// ---------------------------------------------------------------------------

export const validateCreateListing = (body: Record<string, unknown>): CreateListingBody => {
  rejectDistrictField(body);

  const listingType = validateListingType(body["listingType"]);
  const result: CreateListingBody = {
    listingType,
    title: requireString(body["title"], "title"),
    category: validateCategory(body["category"]),
    price: requirePositiveNumber(body["price"], "price"),
    images: validateImages(body["images"]),
  };

  const description = optionalString(body["description"], "description");
  if (description !== undefined) result.description = description;

  const subcategory = optionalString(body["subcategory"], "subcategory");
  if (subcategory !== undefined) result.subcategory = subcategory;

  if (body["quantity"] !== undefined) {
    result.quantity = requirePositiveNumber(body["quantity"], "quantity");
  }
  if (body["unit"] !== undefined) {
    result.unit = validateUnit(body["unit"]);
  }
  if (body["crop"] !== undefined) {
    result.crop = requireString(body["crop"], "crop");
  }
  if (body["harvestDate"] !== undefined) {
    result.harvestDate = validateHarvestDate(body["harvestDate"]);
  }
  if (body["moisture"] !== undefined) {
    result.moisture = requirePositiveNumber(body["moisture"], "moisture");
  }
  if (body["expectedPrice"] !== undefined) {
    result.expectedPrice = requirePositiveNumber(body["expectedPrice"], "expectedPrice");
  }
  if (body["brand"] !== undefined) {
    result.brand = requireString(body["brand"], "brand");
  }
  if (body["stock"] !== undefined) {
    result.stock = requirePositiveNumber(body["stock"], "stock");
  }

  if (listingType === "produce") {
    validateProduceFields(result, true);
    if (!result.unit) {
      throw new AppError("unit is required for produce listings.", 400);
    }
  }

  return result;
};

export const validateUpdateListing = (body: Record<string, unknown>): UpdateListingBody => {
  rejectDistrictField(body);

  const result: UpdateListingBody = {};

  if (body["title"] !== undefined) result.title = requireString(body["title"], "title");
  if (body["description"] !== undefined) result.description = optionalString(body["description"], "description");
  if (body["category"] !== undefined) result.category = validateCategory(body["category"]);
  if (body["subcategory"] !== undefined) result.subcategory = optionalString(body["subcategory"], "subcategory");
  if (body["price"] !== undefined) result.price = requirePositiveNumber(body["price"], "price");
  if (body["quantity"] !== undefined) result.quantity = requirePositiveNumber(body["quantity"], "quantity");
  if (body["unit"] !== undefined) result.unit = validateUnit(body["unit"]);
  if (body["images"] !== undefined) result.images = validateImages(body["images"]);
  if (body["status"] !== undefined) {
    const status = validateStatus(body["status"]);
    if (status === "ARCHIVED") {
      throw new AppError("Use DELETE /marketplace/listings/:id to archive a listing.", 400);
    }
    result.status = status;
  }
  if (body["crop"] !== undefined) result.crop = requireString(body["crop"], "crop");
  if (body["harvestDate"] !== undefined) result.harvestDate = validateHarvestDate(body["harvestDate"]);
  if (body["moisture"] !== undefined) result.moisture = requirePositiveNumber(body["moisture"], "moisture");
  if (body["expectedPrice"] !== undefined) {
    result.expectedPrice = requirePositiveNumber(body["expectedPrice"], "expectedPrice");
  }
  if (body["brand"] !== undefined) result.brand = requireString(body["brand"], "brand");
  if (body["stock"] !== undefined) result.stock = requirePositiveNumber(body["stock"], "stock");

  if (Object.keys(result).length === 0) {
    throw new AppError("At least one field must be provided to update.", 400);
  }

  return result;
};
