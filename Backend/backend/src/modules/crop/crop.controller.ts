import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { ApiSuccessResponse } from "../../types/api-response";
import { listCrops, searchCrops } from "./crop.service";
import type { CropListItemDTO, CropSearchResultDTO } from "./crop.types";

const parseLimit = (value: unknown): number => {
  if (value === undefined) return 50;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new AppError('"limit" must be an integer between 1 and 100.', 400);
  }
  return parsed;
};

/** GET /api/v1/crops */
export const listCropsHandler = async (
  _req: Request,
  res: Response<ApiSuccessResponse<CropListItemDTO[]>>
): Promise<void> => {
  const data = listCrops();
  res.status(200).json({ success: true, data });
};

/** GET /api/v1/crops/search?q=... */
export const searchCropsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<CropSearchResultDTO[]>>
): Promise<void> => {
  const q = req.query.q;
  if (typeof q !== "string" || q.trim().length === 0) {
    throw new AppError('Query parameter "q" is required and must be non-empty.', 400);
  }

  const limit = parseLimit(req.query.limit);
  const data = searchCrops(q, limit);
  res.status(200).json({ success: true, data });
};
