import { randomUUID } from "crypto";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../config/cloudinary";
import { AppError } from "../../utils/AppError";
import { AuthUser } from "../auth/auth.model";
import {
  CLOUDINARY_ASSISTANCE_FOLDER,
  MAX_UPLOAD_IMAGES,
} from "./assistance.constants";
import {
  buildAssistanceUploadFolder,
  isAssistancePublicIdOwnedBy,
} from "./assistance.image.utils";
import type { HelpRequestImage } from "./assistance.types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const hasJpegSignature = (buffer: Buffer): boolean =>
  buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

const hasPngSignature = (buffer: Buffer): boolean =>
  buffer.length >= 8 &&
  buffer[0] === 0x89 &&
  buffer[1] === 0x50 &&
  buffer[2] === 0x4e &&
  buffer[3] === 0x47 &&
  buffer[4] === 0x0d &&
  buffer[5] === 0x0a &&
  buffer[6] === 0x1a &&
  buffer[7] === 0x0a;

const hasWebpSignature = (buffer: Buffer): boolean =>
  buffer.length >= 12 &&
  buffer.toString("ascii", 0, 4) === "RIFF" &&
  buffer.toString("ascii", 8, 12) === "WEBP";

/** Rejects spoofed Content-Type by checking magic bytes before Cloudinary. */
const assertImageMagicBytes = (file: Express.Multer.File): void => {
  const buffer = file.buffer;
  const ok =
    (file.mimetype === "image/jpeg" && hasJpegSignature(buffer)) ||
    (file.mimetype === "image/png" && hasPngSignature(buffer)) ||
    (file.mimetype === "image/webp" && hasWebpSignature(buffer));

  if (!ok) {
    throw new AppError(
      "Uploaded file content does not match a supported image type.",
      400
    );
  }
};

const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string,
  publicId: string
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError("Cloudinary upload failed.", 502));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });

const deleteCloudinaryImage = async (publicId: string): Promise<void> => {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new AppError("Failed to delete image from Cloudinary.", 502);
  }
};

const rollbackUploadedImages = async (publicIds: string[]): Promise<void> => {
  await Promise.all(
    publicIds.map(async (publicId) => {
      try {
        await deleteCloudinaryImage(publicId);
      } catch {
        // Best-effort cleanup; the original error is returned to the client.
      }
    })
  );
};

const buildAssetId = (): string => randomUUID().replace(/-/g, "");

const assertVerifiedUploader = async (userId: string): Promise<void> => {
  const authUser = await AuthUser.findById(userId).select("isVerified").lean();
  if (!authUser) {
    throw new AppError("User account no longer exists.", 401);
  }
  if (!authUser.isVerified) {
    throw new AppError(
      "Only verified farmers can upload proof photos. Please verify your account first.",
      403
    );
  }
};

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export const uploadAssistanceImages = async (
  userId: string,
  files: Express.Multer.File[]
): Promise<HelpRequestImage[]> => {
  await assertVerifiedUploader(userId);

  const folder = buildAssistanceUploadFolder(userId);
  const uploadedPublicIds: string[] = [];
  const uploadedImages: HelpRequestImage[] = [];

  try {
    for (const file of files) {
      assertImageMagicBytes(file);
      const assetId = buildAssetId();
      const result = await uploadBufferToCloudinary(file.buffer, folder, assetId);
      uploadedPublicIds.push(result.public_id);
      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }
  } catch (error) {
    await rollbackUploadedImages(uploadedPublicIds);
    throw error;
  }

  return uploadedImages;
};

export const deleteAssistanceImage = async (
  userId: string,
  publicId: string
): Promise<void> => {
  if (!isAssistancePublicIdOwnedBy(publicId, userId)) {
    throw new AppError("You are not authorized to delete this image.", 403);
  }

  await deleteCloudinaryImage(publicId);
};

export const assertUploadFileCount = (
  files: Express.Multer.File[] | undefined
): void => {
  if (!files || files.length === 0) {
    throw new AppError("At least one proof photo is required.", 400);
  }

  if (files.length > MAX_UPLOAD_IMAGES) {
    throw new AppError(
      `You can upload at most ${MAX_UPLOAD_IMAGES} proof photos per request.`,
      400
    );
  }
};

/** Kept for callers that still need the folder constant without importing utils. */
export const getAssistanceFolder = (): string => CLOUDINARY_ASSISTANCE_FOLDER;
