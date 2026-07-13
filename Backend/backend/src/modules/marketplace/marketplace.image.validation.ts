import { AppError } from "../../utils/AppError";
import {
  CLOUDINARY_MARKETPLACE_FOLDER,
  MAX_LISTING_IMAGES,
} from "./marketplace.constants";
import { isMarketplacePublicId } from "./marketplace.image.utils";
import type { DeleteImageBody, ListingImage } from "./marketplace.types";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

const requireString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${field} is required and must be a non-empty string.`, 400);
  }
  return value.trim();
};

const validateListingImageInput = (value: unknown, index: number): ListingImage => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AppError(
      `images[${index}] must be an object with url and publicId.`,
      400
    );
  }

  const record = value as Record<string, unknown>;
  const url = requireString(record["url"], `images[${index}].url`);
  const publicId = requireString(record["publicId"], `images[${index}].publicId`);

  if (!isMarketplacePublicId(publicId)) {
    throw new AppError(
      `images[${index}].publicId must belong to the ${CLOUDINARY_MARKETPLACE_FOLDER} folder.`,
      400
    );
  }

  return { url, publicId };
};

// ---------------------------------------------------------------------------
// Exported validators
// ---------------------------------------------------------------------------

export const validateListingImages = (value: unknown): ListingImage[] => {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new AppError("images must be an array of image objects.", 400);
  }

  if (value.length > MAX_LISTING_IMAGES) {
    throw new AppError(`images cannot contain more than ${MAX_LISTING_IMAGES} items.`, 400);
  }

  return value.map((item, index) => validateListingImageInput(item, index));
};

export const validateDeleteImage = (body: Record<string, unknown>): DeleteImageBody => {
  const publicId = requireString(body["publicId"], "publicId");

  if (!isMarketplacePublicId(publicId)) {
    throw new AppError("publicId must belong to the marketplace image folder.", 400);
  }

  return { publicId };
};
