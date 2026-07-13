import { AppError } from "../../utils/AppError";
import { CLOUDINARY_MARKETPLACE_FOLDER } from "./marketplace.constants";
import type { ListingImage } from "./marketplace.types";

export const isMarketplacePublicId = (publicId: string): boolean =>
  publicId.startsWith(`${CLOUDINARY_MARKETPLACE_FOLDER}/`);

export const normalizeListingImage = (value: unknown): ListingImage => {
  if (typeof value === "string") {
    return { url: value, publicId: "" };
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    const url = record["url"];

    if (typeof url !== "string" || url.trim().length === 0) {
      throw new AppError("Each image must include a valid url.", 400);
    }

    const publicId = record["publicId"];
    return {
      url: url.trim(),
      publicId: typeof publicId === "string" ? publicId.trim() : "",
    };
  }

  throw new AppError("Each image must be an object with url and publicId.", 400);
};

export const normalizeListingImages = (values: unknown[]): ListingImage[] =>
  values.map((value) => normalizeListingImage(value));

export const toStoredListingImages = (images: ListingImage[]): ListingImage[] =>
  images.map((image) => ({
    url: image.url,
    publicId: image.publicId,
  }));
