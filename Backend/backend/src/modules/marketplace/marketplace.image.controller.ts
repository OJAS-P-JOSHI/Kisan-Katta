import { Request, Response } from "express";
import { getAuthUser } from "../auth/auth.middleware";
import {
  assertUploadFileCount,
  deleteMarketplaceImage,
  uploadMarketplaceImages,
} from "./marketplace.image.service";
import { validateDeleteImage } from "./marketplace.image.validation";
import type { ApiSuccessResponse } from "../../types/api-response";
import type { UploadImagesResponseDTO } from "./marketplace.types";

export const uploadMarketplaceImagesHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<UploadImagesResponseDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const files = req.files as Express.Multer.File[] | undefined;

  assertUploadFileCount(files);

  const images = await uploadMarketplaceImages(userId, files as Express.Multer.File[]);
  res.status(201).json({ success: true, data: { images } });
};

export const deleteMarketplaceImageHandler = async (
  req: Request,
  res: Response<{ success: true }>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const body = validateDeleteImage(req.body as Record<string, unknown>);
  await deleteMarketplaceImage(userId, body.publicId);
  res.status(200).json({ success: true });
};
