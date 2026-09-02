import { AppError } from "../../utils/AppError";
import {
  LABOUR_CATEGORIES,
  LABOUR_GENDERS,
  LABOUR_RATE_TYPES,
  LISTING_REPORT_REASONS,
  LISTING_STATUSES,
  LISTING_TYPES,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_UNITS,
  MAX_LABOUR_LISTING_IMAGES,
  PRODUCT_CATEGORIES,
  REPORT_DETAILS_MAX_LENGTH,
} from "./marketplace.constants";
import { validateListingImages } from "./marketplace.image.validation";
import type {
  CreateListingBody,
  LabourGender,
  LabourRateType,
  ListingReportReason,
  ListingStatus,
  ListingType,
  MarketplaceCategory,
  MarketplaceUnit,
  ReportListingBody,
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

const requirePositiveInteger = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new AppError(`${field} is required and must be an integer >= 1.`, 400);
  }
  return value;
};

const validateListingType = (value: unknown): ListingType => {
  if (
    typeof value !== "string" ||
    !(LISTING_TYPES as readonly string[]).includes(value)
  ) {
    throw new AppError(`listingType must be one of: ${LISTING_TYPES.join(", ")}.`, 400);
  }
  return value as ListingType;
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

const validateGender = (value: unknown): LabourGender => {
  if (typeof value !== "string" || !(LABOUR_GENDERS as readonly string[]).includes(value)) {
    throw new AppError(`gender must be one of: ${LABOUR_GENDERS.join(", ")}.`, 400);
  }
  return value as LabourGender;
};

const validateRateType = (value: unknown): LabourRateType => {
  if (typeof value !== "string" || !(LABOUR_RATE_TYPES as readonly string[]).includes(value)) {
    throw new AppError(`rateType must be one of: ${LABOUR_RATE_TYPES.join(", ")}.`, 400);
  }
  return value as LabourRateType;
};

const validateDateField = (value: unknown, field: string): Date => {
  if (typeof value !== "string" && !(value instanceof Date)) {
    throw new AppError(`${field} must be a valid date string.`, 400);
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${field} must be a valid date.`, 400);
  }
  return date;
};

const rejectServerOwnedLocationFields = (body: Record<string, unknown>): void => {
  for (const field of ["district", "village", "taluka"] as const) {
    if (body[field] !== undefined) {
      throw new AppError(
        `${field} cannot be supplied by the client. It is copied from your profile automatically.`,
        400
      );
    }
  }
};

/** Builds a labour listing title from category + worker count. */
export const buildLabourTitle = (
  category: string,
  availableWorkers: number
): string => {
  if (availableWorkers <= 1) {
    return category;
  }
  if (category === "Tractor Driver" || category === "Farm Supervisor") {
    return `${category} Team`;
  }
  if (category.endsWith("Labour") || category.endsWith("Helper")) {
    return `${category} Group`;
  }
  return `${category} Workers`;
};

const validateProduceFields = (body: CreateListingBody): void => {
  if (body.category !== "Produce") {
    throw new AppError('category must be "Produce" for produce listings.', 400);
  }
  if (!body.crop) {
    throw new AppError("crop is required for produce listings.", 400);
  }
  if (body.quantity === undefined) {
    throw new AppError("quantity is required for produce listings.", 400);
  }
  if (!body.harvestDate) {
    throw new AppError("harvestDate is required for produce listings.", 400);
  }
  if (!body.unit) {
    throw new AppError("unit is required for produce listings.", 400);
  }
};

const validateLabourFields = (body: CreateListingBody): void => {
  if (!(LABOUR_CATEGORIES as readonly string[]).includes(body.category)) {
    throw new AppError(
      `category must be one of: ${LABOUR_CATEGORIES.join(", ")} for labour listings.`,
      400
    );
  }
  if (body.availableWorkers === undefined) {
    throw new AppError("availableWorkers is required for labour listings.", 400);
  }
  if (!body.gender) {
    throw new AppError("gender is required for labour listings.", 400);
  }
  if (!body.rateType) {
    throw new AppError("rateType is required for labour listings.", 400);
  }
  if (!body.availableFrom) {
    throw new AppError("availableFrom is required for labour listings.", 400);
  }
  if (!body.description || body.description.trim().length === 0) {
    throw new AppError("description is required for labour listings.", 400);
  }
  if (!body.images || body.images.length === 0) {
    throw new AppError("At least one image is required for labour listings.", 400);
  }
  if (body.images.length > MAX_LABOUR_LISTING_IMAGES) {
    throw new AppError(
      `Labour listings can have at most ${MAX_LABOUR_LISTING_IMAGES} images.`,
      400
    );
  }
};

// ---------------------------------------------------------------------------
// Exported validators
// ---------------------------------------------------------------------------

export const validateCreateListing = (body: Record<string, unknown>): CreateListingBody => {
  rejectServerOwnedLocationFields(body);

  const listingType = validateListingType(body["listingType"]);

  const result: CreateListingBody = {
    listingType,
    title:
      listingType === "labour"
        ? "" // filled after labour fields are parsed
        : requireString(body["title"], "title"),
    category: validateCategory(body["category"]),
    price: requirePositiveNumber(body["price"], "price"),
    images: validateListingImages(
      body["images"],
      listingType === "labour" ? MAX_LABOUR_LISTING_IMAGES : undefined
    ),
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
    result.harvestDate = validateDateField(body["harvestDate"], "harvestDate");
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
  if (body["availableWorkers"] !== undefined) {
    result.availableWorkers = requirePositiveInteger(body["availableWorkers"], "availableWorkers");
  }
  if (body["gender"] !== undefined) {
    result.gender = validateGender(body["gender"]);
  }
  if (body["rateType"] !== undefined) {
    result.rateType = validateRateType(body["rateType"]);
  }
  if (body["availableFrom"] !== undefined) {
    result.availableFrom = validateDateField(body["availableFrom"], "availableFrom");
  }

  if (listingType === "produce") {
    validateProduceFields(result);
  }

  if (listingType === "labour") {
    validateLabourFields(result);
    result.title = buildLabourTitle(result.category, result.availableWorkers!);
  }

  if (listingType === "product") {
    if (!(PRODUCT_CATEGORIES as readonly string[]).includes(result.category)) {
      throw new AppError(
        `category must be one of: ${PRODUCT_CATEGORIES.join(", ")} for product listings.`,
        400
      );
    }
  }

  return result;
};

export const validateUpdateListing = (body: Record<string, unknown>): UpdateListingBody => {
  rejectServerOwnedLocationFields(body);

  const result: UpdateListingBody = {};

  if (body["title"] !== undefined) result.title = requireString(body["title"], "title");
  if (body["description"] !== undefined) {
    result.description = optionalString(body["description"], "description");
  }
  if (body["category"] !== undefined) result.category = validateCategory(body["category"]);
  if (body["subcategory"] !== undefined) {
    result.subcategory = optionalString(body["subcategory"], "subcategory");
  }
  if (body["price"] !== undefined) result.price = requirePositiveNumber(body["price"], "price");
  if (body["quantity"] !== undefined) {
    result.quantity = requirePositiveNumber(body["quantity"], "quantity");
  }
  if (body["unit"] !== undefined) result.unit = validateUnit(body["unit"]);
  if (body["images"] !== undefined) {
    // Max is refined in updateListing once listingType is known (labour = 2).
    result.images = validateListingImages(body["images"]);
  }
  if (body["status"] !== undefined) {
    const status = validateStatus(body["status"]);
    if (status === "ARCHIVED") {
      throw new AppError("Use DELETE /marketplace/listings/:id to archive a listing.", 400);
    }
    result.status = status;
  }
  if (body["crop"] !== undefined) result.crop = requireString(body["crop"], "crop");
  if (body["harvestDate"] !== undefined) {
    result.harvestDate = validateDateField(body["harvestDate"], "harvestDate");
  }
  if (body["moisture"] !== undefined) {
    result.moisture = requirePositiveNumber(body["moisture"], "moisture");
  }
  if (body["expectedPrice"] !== undefined) {
    result.expectedPrice = requirePositiveNumber(body["expectedPrice"], "expectedPrice");
  }
  if (body["brand"] !== undefined) result.brand = requireString(body["brand"], "brand");
  if (body["stock"] !== undefined) result.stock = requirePositiveNumber(body["stock"], "stock");
  if (body["availableWorkers"] !== undefined) {
    result.availableWorkers = requirePositiveInteger(body["availableWorkers"], "availableWorkers");
  }
  if (body["gender"] !== undefined) result.gender = validateGender(body["gender"]);
  if (body["rateType"] !== undefined) result.rateType = validateRateType(body["rateType"]);
  if (body["availableFrom"] !== undefined) {
    result.availableFrom = validateDateField(body["availableFrom"], "availableFrom");
  }

  if (Object.keys(result).length === 0) {
    throw new AppError("At least one field must be provided to update.", 400);
  }

  return result;
};

const validateReportReason = (value: unknown): ListingReportReason => {
  if (
    typeof value !== "string" ||
    !(LISTING_REPORT_REASONS as readonly string[]).includes(value)
  ) {
    throw new AppError(
      `reason must be one of: ${LISTING_REPORT_REASONS.join(", ")}.`,
      400
    );
  }
  return value as ListingReportReason;
};

export const validateReportListing = (body: Record<string, unknown>): ReportListingBody => {
  const reason = validateReportReason(body["reason"]);
  const result: ReportListingBody = { reason };

  if (body["details"] !== undefined && body["details"] !== null) {
    if (typeof body["details"] !== "string") {
      throw new AppError("details must be a string when provided.", 400);
    }
    const details = body["details"].trim();
    if (details.length > REPORT_DETAILS_MAX_LENGTH) {
      throw new AppError(
        `details cannot exceed ${REPORT_DETAILS_MAX_LENGTH} characters.`,
        400
      );
    }
    if (details.length > 0) {
      result.details = details;
    }
  }

  if (reason === "OTHER" && !result.details) {
    throw new AppError("details is required when reason is OTHER.", 400);
  }

  return result;
};
