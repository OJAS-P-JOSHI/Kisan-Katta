import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { ApiSuccessResponse } from "../../types/api-response";
import {
  listDistricts,
  listTalukasByDistrictCode,
  listVillagesByTalukaCode,
} from "./location.service";
import type {
  DistrictListItemDTO,
  TalukaListItemDTO,
  VillageListItemDTO,
} from "./location.types";

/**
 * Parses a path parameter as a positive integer LGD code.
 * Invalid / non-numeric values become 404 (never 500).
 */
const parseLgdCode = (value: unknown, label: "district" | "taluka"): number => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`Invalid ${label} code`, 404);
  }

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new AppError(`Invalid ${label} code`, 404);
  }

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new AppError(`Invalid ${label} code`, 404);
  }

  return parsed;
};

/** GET /api/v1/location/districts */
export const listDistrictsHandler = async (
  _req: Request,
  res: Response<ApiSuccessResponse<DistrictListItemDTO[]>>
): Promise<void> => {
  const data = listDistricts();
  res.status(200).json({ success: true, data });
};

/** GET /api/v1/location/talukas/:districtCode */
export const listTalukasHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<TalukaListItemDTO[]>>
): Promise<void> => {
  const districtCode = parseLgdCode(req.params.districtCode, "district");
  const data = listTalukasByDistrictCode(districtCode);
  res.status(200).json({ success: true, data });
};

/** GET /api/v1/location/villages/:talukaCode */
export const listVillagesHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<VillageListItemDTO[]>>
): Promise<void> => {
  const talukaCode = parseLgdCode(req.params.talukaCode, "taluka");
  const data = listVillagesByTalukaCode(talukaCode);
  res.status(200).json({ success: true, data });
};
