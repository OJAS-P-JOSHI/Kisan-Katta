import { Request, Response } from "express";
import { getAuthUser } from "../auth/auth.middleware";
import {
  parseAnyStatus,
  parseFeedStatus,
  parseLimit,
  parsePage,
  parseSort,
  parseStringParam,
  requireRequestId,
} from "./assistance.query";
import {
  createHelpRequest,
  deleteHelpRequest,
  getHelpRequestById,
  getHelpRequests,
  getMyAssistanceSummary,
  getMyHelpRequests,
  reportHelpRequest,
  resolveHelpRequest,
  supportHelpRequest,
  updateHelpRequest,
} from "./assistance.service";
import {
  validateCreateHelpRequest,
  validateReportHelpRequest,
  validateUpdateHelpRequest,
} from "./assistance.validation";
import type { ApiSuccessResponse } from "../../types/api-response";
import type {
  HelpRequestResponseDTO,
  HelpRequestsQuery,
  MyAssistanceSummaryDTO,
  MyHelpRequestsQuery,
  PaginatedHelpRequestsDTO,
  ReportHelpRequestDTO,
  SupportHelpRequestDTO,
} from "./assistance.types";

// ---------------------------------------------------------------------------
// Query parsing
// ---------------------------------------------------------------------------

const parseHelpRequestsQuery = (req: Request): HelpRequestsQuery => {
  const query: HelpRequestsQuery = {
    page: parsePage(req.query["page"]),
    limit: parseLimit(req.query["limit"]),
    sort: parseSort(req.query["sort"]),
  };

  const search = parseStringParam(req.query["search"]);
  if (search !== undefined) query.search = search;

  const district = parseStringParam(req.query["district"]);
  if (district !== undefined) query.district = district;

  const status = parseFeedStatus(req.query["status"]);
  if (status !== undefined) query.status = status;

  return query;
};

const parseMyHelpRequestsQuery = (req: Request): MyHelpRequestsQuery => {
  const query: MyHelpRequestsQuery = {
    page: parsePage(req.query["page"]),
    limit: parseLimit(req.query["limit"]),
  };

  const status = parseAnyStatus(req.query["status"]);
  if (status !== undefined) query.status = status;

  return query;
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const createHelpRequestHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<HelpRequestResponseDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const body = validateCreateHelpRequest(
    req.body as Record<string, unknown>,
    userId
  );
  const data = await createHelpRequest(userId, body);
  res.status(201).json({ success: true, data });
};

export const getHelpRequestsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PaginatedHelpRequestsDTO>>
): Promise<void> => {
  const query = parseHelpRequestsQuery(req);
  const data = await getHelpRequests(query, req.user?.userId);
  res.status(200).json({ success: true, data });
};

export const getHelpRequestByIdHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<HelpRequestResponseDTO>>
): Promise<void> => {
  const requestId = requireRequestId(req);
  const data = await getHelpRequestById(requestId, req.user?.userId);
  res.status(200).json({ success: true, data });
};

export const updateHelpRequestHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<HelpRequestResponseDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const requestId = requireRequestId(req);
  const body = validateUpdateHelpRequest(
    req.body as Record<string, unknown>,
    userId
  );
  const data = await updateHelpRequest(userId, requestId, body);
  res.status(200).json({ success: true, data });
};

export const resolveHelpRequestHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<HelpRequestResponseDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const requestId = requireRequestId(req);
  const data = await resolveHelpRequest(userId, requestId);
  res.status(200).json({ success: true, data });
};

export const deleteHelpRequestHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<{ id: string }>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const requestId = requireRequestId(req);
  const data = await deleteHelpRequest(userId, requestId);
  res.status(200).json({ success: true, data });
};

export const supportHelpRequestHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<SupportHelpRequestDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const requestId = requireRequestId(req);
  const data = await supportHelpRequest(userId, requestId);
  res.status(201).json({ success: true, data });
};

export const reportHelpRequestHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ReportHelpRequestDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const requestId = requireRequestId(req);
  const body = validateReportHelpRequest(req.body as Record<string, unknown>);
  const data = await reportHelpRequest(userId, requestId, body);
  res.status(201).json({ success: true, data });
};

export const getMyHelpRequestsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PaginatedHelpRequestsDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const query = parseMyHelpRequestsQuery(req);
  const data = await getMyHelpRequests(userId, query);
  res.status(200).json({ success: true, data });
};

export const getMyAssistanceSummaryHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<MyAssistanceSummaryDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const data = await getMyAssistanceSummary(userId);
  res.status(200).json({ success: true, data });
};
