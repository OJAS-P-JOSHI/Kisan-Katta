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
  AnalyticsLocationBreakdownDTO,
  AnalyticsSummaryDTO,
  DashboardSummaryDTO,
  FarmerDetailDTO,
  PaginatedFarmersDTO,
  PaginatedPaymentsDTO,
  PaginatedVolunteersDTO,
  SystemInfoDTO,
} from "./admin.dto";
import {
  getAdminApplicationById,
  getAnalyticsLocationBreakdown,
  getAnalyticsSummary,
  getDashboardSummary,
  listAdminApplications,
  listPayments,
  listVolunteers,
} from "./admin.service";
import {
  getFarmerById,
  getSystemInfo,
  listFarmers,
} from "./admin.farmers.service";
import {
  validateAdminFarmersQuery,
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

export const getAnalyticsLocationsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<AnalyticsLocationBreakdownDTO>>
): Promise<void> => {
  const district =
    typeof req.query.district === "string" ? req.query.district : undefined;
  const taluka =
    typeof req.query.taluka === "string" ? req.query.taluka : undefined;
  const limitRaw =
    typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
  const data = await getAnalyticsLocationBreakdown({
    district,
    taluka,
    limit: Number.isFinite(limitRaw) ? limitRaw : undefined,
  });
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

export const listFarmersHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PaginatedFarmersDTO>>
): Promise<void> => {
  const query = validateAdminFarmersQuery(req.query);
  const data = await listFarmers(query);
  res.status(200).json({ success: true, data });
};

export const getFarmerHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<FarmerDetailDTO>>
): Promise<void> => {
  const farmerId = requireParam(req.params.id, "id");
  const data = await getFarmerById(farmerId);
  res.status(200).json({ success: true, data });
};

export const getSystemInfoHandler = async (
  _req: Request,
  res: Response<ApiSuccessResponse<SystemInfoDTO>>
): Promise<void> => {
  const data = await getSystemInfo();
  res.status(200).json({ success: true, data });
};
