import multer, { MulterError } from "multer";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../utils/AppError";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "../gram-sahakari.constants";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
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

export const gramSahakariDocumentUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  upload.single("file")(req, res, (error: unknown) => {
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
        next(new AppError("Document image must be 5 MB or smaller.", 400));
        return;
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        next(new AppError("Upload field name must be 'file'.", 400));
        return;
      }

      next(new AppError(error.message, 400));
      return;
    }

    next(error);
  });
};

export const assertUploadedFile = (file: Express.Multer.File | undefined): Express.Multer.File => {
  if (!file) {
    throw new AppError("A document file is required.", 400);
  }
  return file;
};
