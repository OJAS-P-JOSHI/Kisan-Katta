import { randomUUID } from "crypto";
import { performance } from "perf_hooks";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../config/cloudinary";
import { AppError } from "../../utils/AppError";
import {
  CLOUDINARY_MARKETPLACE_FOLDER,
  MAX_UPLOAD_IMAGES,
} from "./marketplace.constants";
import { isMarketplacePublicId } from "./marketplace.image.utils";
import type { ListingImage } from "./marketplace.types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const uploadBufferToCloudinary = (
  buffer: Buffer,
  publicId: string
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const cloudinaryStartedAt = performance.now();

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_MARKETPLACE_FOLDER,
        public_id: publicId,
        resource_type: "image",
        overwrite: false,
      },
      (error, result) => {
        const cloudinaryDurationMs = Math.round(performance.now() - cloudinaryStartedAt);

        if (error || !result) {
          reject(
            new AppError(
              `Cloudinary upload failed after ${cloudinaryDurationMs}ms.`,
              502
            )
          );
          return;
        }

        // eslint-disable-next-line no-console
        console.log(
          `Marketplace Cloudinary upload completed in ${cloudinaryDurationMs}ms for publicId=${result.public_id}`
        );

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

const buildPublicId = (): string => randomUUID().replace(/-/g, "");

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export const uploadMarketplaceImages = async (
  userId: string,
  files: Express.Multer.File[]
): Promise<ListingImage[]> => {
  const uploadStartedAt = performance.now();
  const uploadedPublicIds: string[] = [];
  const uploadedImages: ListingImage[] = [];

  // eslint-disable-next-line no-console
  console.log(
    `Marketplace image upload started: userId=${userId} imageCount=${files.length}`
  );

  try {
    for (const file of files) {
      const publicId = buildPublicId();
      const result = await uploadBufferToCloudinary(file.buffer, publicId);
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

  const uploadDurationMs = Math.round(performance.now() - uploadStartedAt);

  // eslint-disable-next-line no-console
  console.log(
    `Marketplace image upload completed: userId=${userId} imageCount=${uploadedImages.length} durationMs=${uploadDurationMs}`
  );

  return uploadedImages;
};

export const deleteMarketplaceImage = async (
  userId: string,
  publicId: string
): Promise<void> => {
  if (!isMarketplacePublicId(publicId)) {
    throw new AppError("Invalid marketplace image publicId.", 400);
  }

  // eslint-disable-next-line no-console
  console.log(`Marketplace image delete requested: userId=${userId} publicId=${publicId}`);

  await deleteCloudinaryImage(publicId);
};

export const assertUploadFileCount = (files: Express.Multer.File[] | undefined): void => {
  if (!files || files.length === 0) {
    throw new AppError("At least one image file is required.", 400);
  }

  if (files.length > MAX_UPLOAD_IMAGES) {
    throw new AppError(`You can upload at most ${MAX_UPLOAD_IMAGES} images per request.`, 400);
  }
};
