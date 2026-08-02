import { Request, Response } from "express";
import { getPortalAdmin } from "../admin/admin.middleware";
import {
  parseAnyStatus,
  parseLimit,
  parsePage,
  parseStringParam,
  requireRequestId,
} from "./assistance.query";
import {
  approveHelpRequest,
  archiveHelpRequest,
  listHelpRequestsForAdmin,
  rejectHelpRequest,
} from "./assistance.service";
import { validateModerationBody } from "./assistance.validation";
import type { ApiSuccessResponse } from "../../types/api-response";
import type {
  AdminHelpRequestDTO,
  AdminHelpRequestsQuery,
  PaginatedAdminHelpRequestsDTO,
} from "./assistance.types";

const parseAdminHelpRequestsQuery = (req: Request): AdminHelpRequestsQuery => {
  const query: AdminHelpRequestsQuery = {
    page: parsePage(req.query["page"]),
    limit: parseLimit(req.query["limit"]),
  };

  const search = parseStringParam(req.query["search"]);
  if (search !== undefined) query.search = search;

  const district = parseStringParam(req.query["district"]);
  if (district !== undefined) query.district = district;

  const status = parseAnyStatus(req.query["status"]);
  if (status !== undefined) query.status = status;

  return query;
};

export const listAdminHelpRequestsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PaginatedAdminHelpRequestsDTO>>
): Promise<void> => {
  const query = parseAdminHelpRequestsQuery(req);
  const data = await listHelpRequestsForAdmin(query);
  res.status(200).json({ success: true, data });
};

export const approveHelpRequestHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<AdminHelpRequestDTO>>
): Promise<void> => {
  const admin = getPortalAdmin(req);
  const requestId = requireRequestId(req);
  const body = validateModerationBody(req.body as Record<string, unknown>);
  const data = await approveHelpRequest(requestId, admin.id, body);
  res.status(200).json({ success: true, data });
};

export const rejectHelpRequestHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<AdminHelpRequestDTO>>
): Promise<void> => {
  const admin = getPortalAdmin(req);
  const requestId = requireRequestId(req);
  const body = validateModerationBody(req.body as Record<string, unknown>);
  const data = await rejectHelpRequest(requestId, admin.id, body);
  res.status(200).json({ success: true, data });
};

export const archiveHelpRequestHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<AdminHelpRequestDTO>>
): Promise<void> => {
  const admin = getPortalAdmin(req);
  const requestId = requireRequestId(req);
  const body = validateModerationBody(req.body as Record<string, unknown>);
  const data = await archiveHelpRequest(requestId, admin.id, body);
  res.status(200).json({ success: true, data });
};
