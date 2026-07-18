import { Request, Response } from "express";
import { AppError } from "../../../utils/AppError";
import { getAuthUser } from "../../auth/auth.middleware";
import type { ApiSuccessResponse } from "../../../types/api-response";
import type {
  ApplicationDTO,
  PaginatedApplicationsDTO,
} from "../dto/application.dto";
import {
  approveApplication,
  getApplicationById,
  listApplications,
  rejectApplication,
  reviewApplication,
  suspendApplication,
} from "../service/application.service";
import {
  validateAdminApplicationsQuery,
  validateRejectApplication,
  validateReviewApplication,
} from "../validation/application.validation";

const requireParam = (value: string | undefined, field: string): string => {
  if (!value || value.trim().length === 0) {
    throw new AppError(`${field} is required.`, 400);
  }
  return value.trim();
};

export const listApplicationsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PaginatedApplicationsDTO>>
): Promise<void> => {
  const actor = getAuthUser(req);
  const query = validateAdminApplicationsQuery(req.query);
  const data = await listApplications(query, actor);
  res.status(200).json({ success: true, data });
};

export const getApplicationByIdHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ApplicationDTO>>
): Promise<void> => {
  const actor = getAuthUser(req);
  const applicationId = requireParam(req.params.id, "id");
  const data = await getApplicationById(applicationId, actor);
  res.status(200).json({ success: true, data });
};

export const reviewApplicationHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ApplicationDTO>>
): Promise<void> => {
  const actor = getAuthUser(req);
  const applicationId = requireParam(req.params.id, "id");
  const body = validateReviewApplication(req.body);
  const data = await reviewApplication(applicationId, body, actor);
  res.status(200).json({ success: true, data });
};

export const approveApplicationHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ApplicationDTO>>
): Promise<void> => {
  const actor = getAuthUser(req);
  const applicationId = requireParam(req.params.id, "id");
  const data = await approveApplication(applicationId, actor);
  res.status(200).json({ success: true, data });
};

export const rejectApplicationHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ApplicationDTO>>
): Promise<void> => {
  const actor = getAuthUser(req);
  const applicationId = requireParam(req.params.id, "id");
  const body = validateRejectApplication(req.body);
  const data = await rejectApplication(applicationId, body, actor);
  res.status(200).json({ success: true, data });
};

export const suspendApplicationHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ApplicationDTO>>
): Promise<void> => {
  const actor = getAuthUser(req);
  const applicationId = requireParam(req.params.id, "id");
  const data = await suspendApplication(applicationId, actor);
  res.status(200).json({ success: true, data });
};
