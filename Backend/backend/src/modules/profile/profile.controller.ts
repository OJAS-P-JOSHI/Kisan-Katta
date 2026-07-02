import { Request, Response } from "express";
import { createProfile, getProfile, updateProfile } from "./profile.service";
import { validateCreateProfile, validateUpdateProfile } from "./profile.validator";
import { getAuthUser } from "../auth/auth.middleware";
import type { ApiSuccessResponse } from "../../types/api-response";
import type { ProfileResponseDTO } from "./profile.types";

export const createProfileHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ProfileResponseDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const body = validateCreateProfile(req.body as Record<string, unknown>);
  const data = await createProfile(userId, body);
  res.status(201).json({ success: true, data });
};

export const getProfileHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ProfileResponseDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const data = await getProfile(userId);
  res.status(200).json({ success: true, data });
};

export const updateProfileHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ProfileResponseDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const body = validateUpdateProfile(req.body as Record<string, unknown>);
  const data = await updateProfile(userId, body);
  res.status(200).json({ success: true, data });
};
