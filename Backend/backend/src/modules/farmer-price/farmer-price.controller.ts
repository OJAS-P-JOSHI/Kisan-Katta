import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { getAuthUser } from "../auth/auth.middleware";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from "./farmer-price.constants";
import {
  createPoll,
  getHistory,
  getMyPolls,
  getPoll,
  getPolls,
  submitVote,
} from "./farmer-price.service";
import { validateCreatePoll } from "./farmer-price.validation";
import type {
  HistoryResponseDTO,
  PaginatedPollsDTO,
  PollDetailResponseDTO,
  PollResponseDTO,
  PollsQuery,
} from "./farmer-price.types";
import type { ApiSuccessResponse } from "../../types/api-response";

// ---------------------------------------------------------------------------
// Query parsers
// ---------------------------------------------------------------------------

const parseStringParam = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError("Query parameter must be a non-empty string.", 400);
  }
  return value.trim();
};

const parsePage = (value: unknown): number => {
  if (value === undefined) return DEFAULT_PAGE;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError("page must be an integer >= 1.", 400);
  }
  return parsed;
};

const parseLimit = (value: unknown): number => {
  if (value === undefined) return DEFAULT_LIMIT;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > MAX_LIMIT) {
    throw new AppError(`limit must be an integer between 1 and ${MAX_LIMIT}.`, 400);
  }
  return parsed;
};

const parsePollsQuery = (req: Request): PollsQuery => ({
  district: parseStringParam(req.query.district),
  crop: parseStringParam(req.query.crop),
  page: parsePage(req.query.page),
  limit: parseLimit(req.query.limit),
});

const requireParam = (value: string | undefined, field: string): string => {
  if (!value || value.trim().length === 0) {
    throw new AppError(`${field} is required.`, 400);
  }
  return value.trim();
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const createPollHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PollResponseDTO>>
): Promise<void> => {
  getAuthUser(req);
  const body = validateCreatePoll(req.body as Record<string, unknown>);
  const data = await createPoll(body);
  res.status(201).json({ success: true, data });
};

export const getPollsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PaginatedPollsDTO>>
): Promise<void> => {
  getAuthUser(req);
  const query = parsePollsQuery(req);
  const data = await getPolls(query);
  res.status(200).json({ success: true, data });
};

export const getMyPollsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PollResponseDTO[]>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const data = await getMyPolls(userId);
  res.status(200).json({ success: true, data });
};

export const getPollHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PollDetailResponseDTO>>
): Promise<void> => {
  getAuthUser(req);
  const pollId = requireParam(req.params["pollId"], "pollId");
  const data = await getPoll(pollId);
  res.status(200).json({ success: true, data });
};

export const submitVoteHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PollDetailResponseDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const pollId = requireParam(req.params["pollId"], "pollId");
  const data = await submitVote(userId, pollId, req.body as Record<string, unknown>);
  res.status(201).json({ success: true, data });
};

export const getHistoryHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<HistoryResponseDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const crop = requireParam(req.params["crop"], "crop");
  const data = await getHistory(userId, crop);
  res.status(200).json({ success: true, data });
};
