import multer, { MulterError } from "multer";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_PROFILE_IMAGES,
} from "./profile.constants";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_PROFILE_IMAGES,
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      callback(
        new AppError(
          "Unsupported image type. Only JPEG, PNG, and WebP images are allowed.",
          400
        )
      );
      return;
    }

    callback(null, true);
  },
});

export const profileImageUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  upload.array("image", MAX_PROFILE_IMAGES)(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof AppError) {
      next(error);
      return;
    }

    if (error instanceof MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(new AppError("Profile image must be 5 MB or smaller.", 400));
        return;
      }

      if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
        next(
          new AppError(
            `You can upload at most ${MAX_PROFILE_IMAGES} profile image per request.`,
            400
          )
        );
        return;
      }

      next(new AppError(error.message, 400));
      return;
    }

    next(error);
  });
};
