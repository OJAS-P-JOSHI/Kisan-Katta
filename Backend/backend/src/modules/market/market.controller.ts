import { Request, Response } from "express";
import { getAuthUser } from "../auth/auth.middleware";
import { getFavoriteMarketPrices, getMarketPrices } from "./market.service";
import { MarketPriceDTO, MarketPricesQuery } from "./market.types";
import { ApiSuccessResponse } from "../../types/api-response";
import { AppError } from "../../utils/AppError";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parseStringParam = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseLimit = (value: unknown): number => {
  if (value === undefined) return DEFAULT_LIMIT;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > MAX_LIMIT) {
    throw new AppError(`limit must be an integer between 1 and ${MAX_LIMIT}`, 400);
  }
  return parsed;
};

const parseOffset = (value: unknown): number => {
  if (value === undefined) return 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new AppError("offset must be an integer >= 0", 400);
  }
  return parsed;
};

const parseQuery = (req: Request): MarketPricesQuery => ({
  state: parseStringParam(req.query.state),
  district: parseStringParam(req.query.district),
  commodity: parseStringParam(req.query.commodity),
  limit: parseLimit(req.query.limit),
  offset: parseOffset(req.query.offset),
});

export const getPrices = async (
  req: Request,
  res: Response<ApiSuccessResponse<MarketPriceDTO[]>>
): Promise<void> => {
  const query = parseQuery(req);
  const data = await getMarketPrices(query);
  res.status(200).json({
    success: true,
    data,
  });
};

export const getFavoritePrices = async (
  req: Request,
  res: Response<ApiSuccessResponse<MarketPriceDTO[]>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const data = await getFavoriteMarketPrices(userId);
  res.status(200).json({
    success: true,
    data,
  });
};
