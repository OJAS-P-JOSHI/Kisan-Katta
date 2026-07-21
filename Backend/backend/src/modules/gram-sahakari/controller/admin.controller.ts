import { Request, Response } from "express";
import { AppError } from "../../../utils/AppError";
import { getAuthUser } from "../../auth/auth.middleware";
import type { ApiSuccessResponse } from "../../../types/api-response";
import type {
  ApplicationDTO,
  PaginatedApplicationsDTO,
} from "../dto/application.dto";
import {
  getApplicationById,
  listApplications,
} from "../service/application.service";
import { validateAdminApplicationsQuery } from "../validation/application.validation";

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
