import { AppError } from "../../utils/AppError";
import {
  CLOUDINARY_ASSISTANCE_FOLDER,
  MAX_HELP_REQUEST_IMAGES,
  MIN_HELP_REQUEST_IMAGES,
} from "./assistance.constants";
import {
  isAssistancePublicId,
  isAssistancePublicIdOwnedBy,
} from "./assistance.image.utils";
import type { DeleteImageBody, HelpRequestImage } from "./assistance.types";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

const requireString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${field} is required and must be a non-empty string.`, 400);
  }
  return value.trim();
};

/**
 * Ensures the URL is a Cloudinary delivery URL that references the same
 * publicId. Blocks attaching arbitrary external URLs to a stolen publicId.
 */
const assertUrlMatchesPublicId = (
  url: string,
  publicId: string,
  field: string
): void => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AppError(`${field} must be a valid absolute image URL.`, 400);
  }

  if (parsed.protocol !== "https:") {
    throw new AppError(`${field} must use HTTPS.`, 400);
  }

  if (!parsed.hostname.endsWith("res.cloudinary.com")) {
    throw new AppError(`${field} must be a Cloudinary image URL.`, 400);
  }

  // Cloudinary delivery paths embed the publicId (with optional version / transforms
  // and a file extension such as `.jpg`).
  const normalizedPath = decodeURIComponent(parsed.pathname);
  const candidates = [
    `/${publicId}`,
    `/${publicId}.jpg`,
    `/${publicId}.jpeg`,
    `/${publicId}.png`,
    `/${publicId}.webp`,
  ];
  const matches = candidates.some((candidate) => normalizedPath.includes(candidate));
  if (!matches) {
    throw new AppError(`${field} does not match the provided publicId.`, 400);
  }
};

const validateHelpRequestImageInput = (
  value: unknown,
  index: number,
  userId: string
): HelpRequestImage => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AppError(
      `images[${index}] must be an object with url and publicId.`,
      400
    );
  }

  const record = value as Record<string, unknown>;
  const url = requireString(record["url"], `images[${index}].url`);
  const publicId = requireString(record["publicId"], `images[${index}].publicId`);

  if (!isAssistancePublicId(publicId)) {
    throw new AppError(
      `images[${index}].publicId must belong to the ${CLOUDINARY_ASSISTANCE_FOLDER} folder.`,
      400
    );
  }

  if (!isAssistancePublicIdOwnedBy(publicId, userId)) {
    throw new AppError(
      `images[${index}] must be a proof photo you uploaded.`,
      403
    );
  }

  assertUrlMatchesPublicId(url, publicId, `images[${index}].url`);

  return { url, publicId };
};

// ---------------------------------------------------------------------------
// Exported validators
// ---------------------------------------------------------------------------

/** Proof photos are mandatory: 1–3 images uploaded by the same farmer. */
export const validateHelpRequestImages = (
  value: unknown,
  userId: string
): HelpRequestImage[] => {
  if (!Array.isArray(value)) {
    throw new AppError("images must be an array of image objects.", 400);
  }

  if (value.length < MIN_HELP_REQUEST_IMAGES) {
    throw new AppError(
      `images must contain at least ${MIN_HELP_REQUEST_IMAGES} proof photo.`,
      400
    );
  }

  if (value.length > MAX_HELP_REQUEST_IMAGES) {
    throw new AppError(
      `images cannot contain more than ${MAX_HELP_REQUEST_IMAGES} items.`,
      400
    );
  }

  const images = value.map((item, index) =>
    validateHelpRequestImageInput(item, index, userId)
  );

  const publicIds = new Set<string>();
  for (const image of images) {
    if (publicIds.has(image.publicId)) {
      throw new AppError("images cannot contain duplicate publicIds.", 400);
    }
    publicIds.add(image.publicId);
  }

  return images;
};

export const validateDeleteImage = (
  body: Record<string, unknown>
): DeleteImageBody => {
  const publicId = requireString(body["publicId"], "publicId");

  if (!isAssistancePublicId(publicId)) {
    throw new AppError("publicId must belong to the assistance image folder.", 400);
  }

  return { publicId };
};
