import { AppError } from "../../utils/AppError";
import { CLOUDINARY_ASSISTANCE_FOLDER } from "./assistance.constants";
import type { HelpRequestImage } from "./assistance.types";

const OBJECT_ID_HEX = /^[a-fA-F0-9]{24}$/;
const ASSET_ID = /^[a-zA-Z0-9_-]+$/;

/** Folder-scoped publicId with no path traversal. */
export const isAssistancePublicId = (publicId: string): boolean => {
  if (!publicId.startsWith(`${CLOUDINARY_ASSISTANCE_FOLDER}/`)) return false;
  if (publicId.includes("..") || publicId.includes("//")) return false;

  const remainder = publicId.slice(CLOUDINARY_ASSISTANCE_FOLDER.length + 1);
  const parts = remainder.split("/");
  // Expected shape: {userId}/{assetId}
  if (parts.length !== 2) return false;
  const [ownerId, assetId] = parts;
  return (
    typeof ownerId === "string" &&
    typeof assetId === "string" &&
    OBJECT_ID_HEX.test(ownerId) &&
    ASSET_ID.test(assetId)
  );
};

/** True when the publicId was uploaded under this user's assistance folder. */
export const isAssistancePublicIdOwnedBy = (
  publicId: string,
  userId: string
): boolean => {
  if (!OBJECT_ID_HEX.test(userId)) return false;
  if (!isAssistancePublicId(publicId)) return false;
  return publicId.startsWith(`${CLOUDINARY_ASSISTANCE_FOLDER}/${userId}/`);
};

export const buildAssistanceUploadFolder = (userId: string): string =>
  `${CLOUDINARY_ASSISTANCE_FOLDER}/${userId}`;

export const normalizeHelpRequestImage = (value: unknown): HelpRequestImage => {
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

export const normalizeHelpRequestImages = (values: unknown[]): HelpRequestImage[] =>
  values.map((value) => normalizeHelpRequestImage(value));

export const toStoredHelpRequestImages = (
  images: HelpRequestImage[]
): HelpRequestImage[] =>
  images.map((image) => ({
    url: image.url,
    publicId: image.publicId,
  }));
