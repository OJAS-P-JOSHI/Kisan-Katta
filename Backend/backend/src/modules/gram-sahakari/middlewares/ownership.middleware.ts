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

/**
 * Guards payment-finalization endpoints (verify). A farmer uses these during a
 * normal payment. But when the Razorpay webhook wins the webhook-vs-verify race,
 * it finalizes the payment and promotes the user to GRAM_SAHAKARI *before* the
 * browser's verify call arrives. That follow-up verify must still be allowed
 * through to the idempotent handler, which returns the already-completed state
 * (HTTP 200) — never a misleading 403. ADMIN/TEAM never pay, so they stay
 * blocked. Ownership is enforced in the service (payments are scoped to req.user).
 */
export const requirePaymentActor = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const { role } = getAuthUser(req);

    if (role === "ADMIN" || role === "TEAM") {
      throw new AppError("This action is only available to farmer applicants.", 403);
    }

    next();
  }
);
