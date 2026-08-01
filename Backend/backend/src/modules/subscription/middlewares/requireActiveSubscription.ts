import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../utils/AppError";
import { asyncHandler } from "../../../utils/asyncHandler";
import { getAuthUser } from "../../auth/auth.middleware";
import { getSubscriptionStatus } from "../service/subscription.service";

/**
 * Blocks access to protected mobile APIs unless the user has an active
 * subscription (or is ADMIN/TEAM). Navigation gating on the client is the
 * primary UX; this middleware is for defense-in-depth on sensitive routes.
 */
export const requireActiveSubscription = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const { userId, role } = getAuthUser(req);

    if (role === "ADMIN" || role === "TEAM") {
      next();
      return;
    }

    const status = await getSubscriptionStatus(userId);
    if (!status.isActive) {
      throw new AppError(
        "An active subscription is required to access this resource.",
        402
      );
    }

    next();
  }
);
