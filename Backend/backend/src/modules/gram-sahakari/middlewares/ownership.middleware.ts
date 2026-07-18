import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../utils/AppError";
import { asyncHandler } from "../../../utils/asyncHandler";
import { getAuthUser } from "../../auth/auth.middleware";
import { findApplicationByUserId } from "../repository/application.repository";
import { assertApplicationOwnership } from "../service/application.service";

/**
 * Ensures the authenticated user owns the application referenced in params.id.
 * ADMIN and TEAM bypass ownership checks (handled in service layer for TEAM).
 */
export const requireApplicationOwnership = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const { userId, role } = getAuthUser(req);

    if (role === "ADMIN" || role === "TEAM") {
      next();
      return;
    }

    const applicationId = req.params.id;
    if (applicationId) {
      next();
      return;
    }

    const application = await findApplicationByUserId(userId);
    if (!application) {
      throw new AppError("Application not found.", 404);
    }

    assertApplicationOwnership(application, userId);
    next();
  }
);

/**
 * Restricts applicant routes to users who do not already hold GRAM_SAHAKARI role
 * for start/submit flows, while allowing existing GS users to view their profile.
 */
export const requireFarmerApplicant = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const { role } = getAuthUser(req);

    if (role === "ADMIN" || role === "TEAM") {
      throw new AppError("This action is only available to farmer applicants.", 403);
    }

    if (role === "GRAM_SAHAKARI" && req.method !== "GET") {
      throw new AppError("Gram Sahakari members cannot modify onboarding applications.", 403);
    }

    next();
  }
);
