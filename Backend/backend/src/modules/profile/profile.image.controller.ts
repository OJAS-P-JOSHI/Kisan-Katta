import { Request, Response } from "express";
import { getAuthUser } from "../auth/auth.middleware";
import {
  assertProfileImageUpload,
  deleteProfileImage,
  uploadProfileImage,
} from "./profile.image.service";
import type { ApiSuccessResponse } from "../../types/api-response";
import type { UploadProfileImageResponseDTO } from "./profile.types";

export const uploadProfileImageHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<UploadProfileImageResponseDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const files = req.files as Express.Multer.File[] | undefined;
  const file = assertProfileImageUpload(files);

  const data = await uploadProfileImage(userId, file);
  res.status(200).json({ success: true, data });
};

export const deleteProfileImageHandler = async (
  req: Request,
  res: Response<{ success: true }>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  await deleteProfileImage(userId);
  res.status(200).json({ success: true });
};
