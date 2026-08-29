import { Request, Response } from "express";
import { getAuthUser } from "../../auth/auth.middleware";
import type { ApiSuccessResponse } from "../../../types/api-response";
import type { RepresentativeDiscoveryDTO } from "../dto/representative.dto";
import { discoverRepresentativesForFarmer } from "../service/representative.service";

export const getRepresentativeDiscoveryHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<RepresentativeDiscoveryDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const data = await discoverRepresentativesForFarmer(userId);
  res.status(200).json({ success: true, data });
};
