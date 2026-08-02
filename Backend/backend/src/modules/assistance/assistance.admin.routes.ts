import { NextFunction, Request, Response, Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { authenticate } from "../auth/auth.middleware";
import {
  getPortalAdmin,
  requireAdminPermission,
  requirePortalAdmin,
} from "../admin/admin.middleware";
import {
  approveHelpRequestHandler,
  archiveHelpRequestHandler,
  listAdminHelpRequestsHandler,
  rejectHelpRequestHandler,
} from "./assistance.admin.controller";

/**
 * Moderation queue for farmer help requests. Approving is the only way a
 * request becomes publicly visible, so every route here is admin-gated.
 */
const router = Router();

/** READ_ONLY may list the queue but must not change request status. */
const requireWritableAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const admin = getPortalAdmin(req);
    if (admin.role === "READ_ONLY") {
      next(new AppError("Read-only admins cannot moderate help requests.", 403));
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
};

router.use(authenticate, requirePortalAdmin);

router.get(
  "/",
  requireAdminPermission("assistance"),
  asyncHandler(listAdminHelpRequestsHandler)
);

router.patch(
  "/:id/approve",
  requireAdminPermission("assistance"),
  requireWritableAdmin,
  asyncHandler(approveHelpRequestHandler)
);

router.patch(
  "/:id/reject",
  requireAdminPermission("assistance"),
  requireWritableAdmin,
  asyncHandler(rejectHelpRequestHandler)
);

router.patch(
  "/:id/archive",
  requireAdminPermission("assistance"),
  requireWritableAdmin,
  asyncHandler(archiveHelpRequestHandler)
);

export default router;
