import { Router } from "express";
import { authenticate } from "../../auth/auth.middleware";
import { asyncHandler } from "../../../utils/asyncHandler";
import {
  approveApplicationHandler,
  getApplicationByIdHandler,
  listApplicationsHandler,
  rejectApplicationHandler,
  reviewApplicationHandler,
  suspendApplicationHandler,
} from "../controller/admin.controller";
import {
  requireAdmin,
  requireAdminOrTeam,
} from "../middlewares/role.middleware";

const router = Router();

router.get(
  "/applications",
  authenticate,
  requireAdminOrTeam,
  asyncHandler(listApplicationsHandler)
);

router.get(
  "/application/:id",
  authenticate,
  requireAdminOrTeam,
  asyncHandler(getApplicationByIdHandler)
);

router.patch(
  "/application/:id/review",
  authenticate,
  requireAdminOrTeam,
  asyncHandler(reviewApplicationHandler)
);

router.patch(
  "/application/:id/approve",
  authenticate,
  requireAdmin,
  asyncHandler(approveApplicationHandler)
);

router.patch(
  "/application/:id/reject",
  authenticate,
  requireAdmin,
  asyncHandler(rejectApplicationHandler)
);

router.patch(
  "/application/:id/suspend",
  authenticate,
  requireAdmin,
  asyncHandler(suspendApplicationHandler)
);

export default router;
