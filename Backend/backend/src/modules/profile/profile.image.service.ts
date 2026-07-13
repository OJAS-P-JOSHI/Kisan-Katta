import { randomUUID } from "crypto";
import { performance } from "perf_hooks";
import { Types } from "mongoose";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../config/cloudinary";
import { AppError } from "../../utils/AppError";
import {
  CLOUDINARY_PROFILE_FOLDER,
  MAX_PROFILE_IMAGES,
  PROFILE_IMAGE_MAX_EDGE_PX,
} from "./profile.constants";
import { isProfilePublicId, toStoredProfileImage } from "./profile.image.utils";
import { FarmerProfile } from "./profile.model";
import type { ProfileImage, UploadProfileImageResponseDTO } from "./profile.types";

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
        folder: CLOUDINARY_PROFILE_FOLDER,
        public_id: publicId,
        resource_type: "image",
        overwrite: false,
        transformation: [
          {
            width: PROFILE_IMAGE_MAX_EDGE_PX,
            height: PROFILE_IMAGE_MAX_EDGE_PX,
            crop: "limit",
          },
          {
            quality: "auto",
            fetch_format: "auto",
          },
        ],
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
          `Profile Cloudinary upload completed in ${cloudinaryDurationMs}ms for publicId=${result.public_id}`
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

const rollbackUploadedImage = async (publicId: string): Promise<void> => {
  try {
    await deleteCloudinaryImage(publicId);
  } catch {
    // Best-effort cleanup; the original error is returned to the client.
  }
};

const buildPublicId = (): string => randomUUID().replace(/-/g, "");

const toProfileImage = (result: UploadApiResponse): ProfileImage => ({
  url: result.secure_url,
  publicId: result.public_id,
});

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export const assertProfileImageUpload = (
  files: Express.Multer.File[] | undefined
): Express.Multer.File => {
  if (!files || files.length === 0) {
    throw new AppError("A profile image file is required.", 400);
  }

  if (files.length > MAX_PROFILE_IMAGES) {
    throw new AppError(
      `You can upload at most ${MAX_PROFILE_IMAGES} profile image per request.`,
      400
    );
  }

  return files[0] as Express.Multer.File;
};

/**
 * Uploads a new profile photo (or replaces the existing one).
 * Uploads to Cloudinary first, then updates MongoDB. Rolls back the new
 * Cloudinary asset if the DB write fails. Old Cloudinary cleanup is
 * best-effort after a successful save.
 */
export const uploadProfileImage = async (
  userId: string,
  file: Express.Multer.File
): Promise<UploadProfileImageResponseDTO> => {
  const uploadStartedAt = performance.now();

  // eslint-disable-next-line no-console
  console.log(`Profile image upload started: userId=${userId}`);

  const profile = await FarmerProfile.findOne({
    userId: new Types.ObjectId(userId),
  });

  if (!profile) {
    throw new AppError("Profile not found. Please create your profile first.", 404);
  }

  const previousPublicId =
    profile.profileImage?.publicId && isProfilePublicId(profile.profileImage.publicId)
      ? profile.profileImage.publicId
      : null;

  const publicId = buildPublicId();
  const result = await uploadBufferToCloudinary(file.buffer, publicId);
  const nextImage = toStoredProfileImage(toProfileImage(result));

  try {
    profile.profileImage = nextImage;
    await profile.save();
  } catch (error) {
    await rollbackUploadedImage(result.public_id);
    throw error;
  }

  if (previousPublicId && previousPublicId !== nextImage.publicId) {
    try {
      await deleteCloudinaryImage(previousPublicId);
    } catch (cleanupError) {
      // Keep the newest image — do not fail the request.
      // eslint-disable-next-line no-console
      console.error(
        `Failed to delete previous profile image from Cloudinary: userId=${userId} publicId=${previousPublicId}`,
        cleanupError
      );
    }
  }

  const uploadDurationMs = Math.round(performance.now() - uploadStartedAt);

  // eslint-disable-next-line no-console
  console.log(
    `Profile image upload completed: userId=${userId} publicId=${nextImage.publicId} durationMs=${uploadDurationMs}`
  );

  return { profileImage: nextImage };
};

/**
 * Removes the farmer's profile photo. Idempotent when no image exists.
 */
export const deleteProfileImage = async (userId: string): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log(`Profile image delete requested: userId=${userId}`);

  const profile = await FarmerProfile.findOne({
    userId: new Types.ObjectId(userId),
  });

  if (!profile) {
    throw new AppError("Profile not found. Please create your profile first.", 404);
  }

  const existing = profile.profileImage;

  if (!existing?.publicId) {
    return;
  }

  if (isProfilePublicId(existing.publicId)) {
    await deleteCloudinaryImage(existing.publicId);
  }

  profile.profileImage = null;
  await profile.save();
};
