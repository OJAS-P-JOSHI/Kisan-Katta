import { Request, Response } from "express";
import { getAuthUser } from "../auth/auth.middleware";
import {
  assertUploadFileCount,
  deleteAssistanceImage,
  uploadAssistanceImages,
} from "./assistance.image.service";
import { validateDeleteImage } from "./assistance.image.validation";
import type { ApiSuccessResponse } from "../../types/api-response";
import type { UploadImagesResponseDTO } from "./assistance.types";

export const uploadAssistanceImagesHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<UploadImagesResponseDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const files = req.files as Express.Multer.File[] | undefined;

  assertUploadFileCount(files);

  const images = await uploadAssistanceImages(userId, files as Express.Multer.File[]);
  res.status(201).json({ success: true, data: { images } });
};

export const deleteAssistanceImageHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<{ publicId: string }>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const body = validateDeleteImage(req.body as Record<string, unknown>);
  await deleteAssistanceImage(userId, body.publicId);
  res.status(200).json({ success: true, data: { publicId: body.publicId } });
};
