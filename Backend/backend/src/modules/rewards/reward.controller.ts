import type { Request, Response } from "express";
import type { ApiSuccessResponse } from "../../types/api-response";
import { AppError } from "../../utils/AppError";
import { getPortalAdmin } from "../admin/admin.middleware";
import type {
  PaginatedRewardsDTO,
  RepresentativeRewardSummaryDTO,
  RewardDetailDTO,
  RewardSummaryDTO,
} from "./reward.dto";
import {
  cancelReward,
  createReward,
  exportRewardsCsv,
  getRepresentativeRewards,
  getRewardById,
  getRewardSummary,
  listRewards,
  markRewardPaid,
  updateReward,
} from "./reward.service";
import {
  validateCancelReward,
  validateCreateReward,
  validateMarkPaid,
  validateRewardListQuery,
  validateUpdateReward,
} from "./reward.validators";

const requireParam = (value: string | undefined, name: string): string => {
  if (!value?.trim()) {
    throw new AppError(`${name} is required.`, 400);
  }
  return value;
};

export const listRewardsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PaginatedRewardsDTO>>
): Promise<void> => {
  const query = validateRewardListQuery(req.query);
  const data = await listRewards(query);
  res.status(200).json({ success: true, data });
};

export const getRewardSummaryHandler = async (
  _req: Request,
  res: Response<ApiSuccessResponse<RewardSummaryDTO>>
): Promise<void> => {
  const data = await getRewardSummary();
  res.status(200).json({ success: true, data });
};

export const getRewardHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<RewardDetailDTO>>
): Promise<void> => {
  const data = await getRewardById(requireParam(req.params.id, "Reward id"));
  res.status(200).json({ success: true, data });
};

export const getRepresentativeRewardsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<RepresentativeRewardSummaryDTO>>
): Promise<void> => {
  const data = await getRepresentativeRewards(
    requireParam(req.params.applicationId, "Application id")
  );
  res.status(200).json({ success: true, data });
};

export const createRewardHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<RewardDetailDTO>>
): Promise<void> => {
  const admin = getPortalAdmin(req);
  const body = validateCreateReward(req.body);
  const data = await createReward(body, admin.name);
  res.status(201).json({ success: true, data });
};

export const updateRewardHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<RewardDetailDTO>>
): Promise<void> => {
  const admin = getPortalAdmin(req);
  const body = validateUpdateReward(req.body);
  const data = await updateReward(
    requireParam(req.params.id, "Reward id"),
    body,
    admin.name
  );
  res.status(200).json({ success: true, data });
};

export const markRewardPaidHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<RewardDetailDTO>>
): Promise<void> => {
  const admin = getPortalAdmin(req);
  const body = validateMarkPaid(req.body);
  const data = await markRewardPaid(
    requireParam(req.params.id, "Reward id"),
    body,
    admin.name
  );
  res.status(200).json({ success: true, data });
};

export const cancelRewardHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<RewardDetailDTO>>
): Promise<void> => {
  const admin = getPortalAdmin(req);
  const body = validateCancelReward(req.body ?? {});
  const data = await cancelReward(
    requireParam(req.params.id, "Reward id"),
    body,
    admin.name
  );
  res.status(200).json({ success: true, data });
};

export const exportRewardsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = validateRewardListQuery(req.query);
  const csv = await exportRewardsCsv(query);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="reward-history-${Date.now()}.csv"`
  );
  res.status(200).send(csv);
};
