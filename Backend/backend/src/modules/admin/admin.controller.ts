import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import type { ApiSuccessResponse } from "../../types/api-response";
import { getAuthUser } from "../auth/auth.middleware";
import type {
  ApplicationDTO,
  PaginatedApplicationsDTO,
} from "../gram-sahakari/dto/application.dto";
import { getPortalAdmin } from "./admin.middleware";
import type {
  AdminProfileDTO,
  AnalyticsSummaryDTO,
  DashboardSummaryDTO,
  PaginatedPaymentsDTO,
  PaginatedVolunteersDTO,
} from "./admin.dto";
import {
  getAdminApplicationById,
  getAnalyticsSummary,
  getDashboardSummary,
  listAdminApplications,
  listPayments,
  listVolunteers,
} from "./admin.service";
import {
  validateAdminListQuery,
  validateAdminPaymentsQuery,
  validateAdminVolunteersQuery,
} from "./admin.validators";

const requireParam = (value: string | undefined, field: string): string => {
  if (!value || value.trim().length === 0) {
    throw new AppError(`${field} is required.`, 400);
  }
  return value.trim();
};

export const getMeAdminHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<AdminProfileDTO>>
): Promise<void> => {
  const admin = getPortalAdmin(req);
  res.status(200).json({ success: true, data: admin });
};

export const getDashboardHandler = async (
  _req: Request,
  res: Response<ApiSuccessResponse<DashboardSummaryDTO>>
): Promise<void> => {
  const data = await getDashboardSummary();
  res.status(200).json({ success: true, data });
};

export const getAnalyticsHandler = async (
  _req: Request,
  res: Response<ApiSuccessResponse<AnalyticsSummaryDTO>>
): Promise<void> => {
  const data = await getAnalyticsSummary();
  res.status(200).json({ success: true, data });
};

export const listApplicationsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PaginatedApplicationsDTO>>
): Promise<void> => {
  const actor = getAuthUser(req);
  const query = validateAdminListQuery(req.query);
  const data = await listAdminApplications(query, actor);
  res.status(200).json({ success: true, data });
};

export const getApplicationHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ApplicationDTO>>
): Promise<void> => {
  const actor = getAuthUser(req);
  const applicationId = requireParam(req.params.id, "id");
  const data = await getAdminApplicationById(applicationId, actor);
  res.status(200).json({ success: true, data });
};

export const listVolunteersHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PaginatedVolunteersDTO>>
): Promise<void> => {
  const query = validateAdminVolunteersQuery(req.query);
  const data = await listVolunteers(query);
  res.status(200).json({ success: true, data });
};

export const listPaymentsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PaginatedPaymentsDTO>>
): Promise<void> => {
  const query = validateAdminPaymentsQuery(req.query);
  const data = await listPayments(query);
  res.status(200).json({ success: true, data });
};
