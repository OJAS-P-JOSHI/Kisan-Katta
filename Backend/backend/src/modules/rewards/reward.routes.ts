import { NextFunction, Request, Response, Router } from "express";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../auth/auth.middleware";
import {
  requireAdminPermission,
  requirePortalAdmin,
} from "../admin/admin.middleware";
import {
  cancelRewardHandler,
  createRewardHandler,
  exportRewardsHandler,
  getRepresentativeRewardsHandler,
  getRewardHandler,
  getRewardSummaryHandler,
  listRewardsHandler,
  markRewardPaidHandler,
  updateRewardHandler,
} from "./reward.controller";

/**
 * Write operations (create / edit / mark paid / cancel) are SUPER_ADMIN only.
 * Read operations require the `rewards` permission.
 */
const requireSuperAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.admin) {
    next(new AppError("Admin access required.", 403));
    return;
  }
  if (req.admin.role !== "SUPER_ADMIN") {
    next(
      new AppError(
        "Only SUPER_ADMIN can create, edit, mark paid, or cancel rewards.",
        403
      )
    );
    return;
  }
  next();
};

const router = Router();

router.use(authenticate, requirePortalAdmin);

router.get(
  "/",
  requireAdminPermission("rewards"),
  asyncHandler(listRewardsHandler)
);

router.get(
  "/summary",
  requireAdminPermission("rewards"),
  asyncHandler(getRewardSummaryHandler)
);

router.get(
  "/export",
  requireAdminPermission("rewards"),
  asyncHandler(exportRewardsHandler)
);

router.get(
  "/by-representative/:applicationId",
  requireAdminPermission("rewards"),
  asyncHandler(getRepresentativeRewardsHandler)
);

router.get(
  "/:id",
  requireAdminPermission("rewards"),
  asyncHandler(getRewardHandler)
);

router.post(
  "/",
  requireAdminPermission("rewards"),
  requireSuperAdmin,
  asyncHandler(createRewardHandler)
);

router.patch(
  "/:id",
  requireAdminPermission("rewards"),
  requireSuperAdmin,
  asyncHandler(updateRewardHandler)
);

router.post(
  "/:id/mark-paid",
  requireAdminPermission("rewards"),
  requireSuperAdmin,
  asyncHandler(markRewardPaidHandler)
);

router.post(
  "/:id/cancel",
  requireAdminPermission("rewards"),
  requireSuperAdmin,
  asyncHandler(cancelRewardHandler)
);

export default router;
