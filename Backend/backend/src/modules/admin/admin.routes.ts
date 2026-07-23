import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../auth/auth.middleware";
import {
  getAnalyticsHandler,
  getApplicationHandler,
  getDashboardHandler,
  getMeAdminHandler,
  listApplicationsHandler,
  listPaymentsHandler,
  listVolunteersHandler,
} from "./admin.controller";
import {
  requireAdminPermission,
  requirePortalAdmin,
} from "./admin.middleware";

const router = Router();

router.use(authenticate, requirePortalAdmin);

router.get("/me", asyncHandler(getMeAdminHandler));

router.get(
  "/dashboard",
  requireAdminPermission("dashboard"),
  asyncHandler(getDashboardHandler)
);

router.get(
  "/analytics",
  requireAdminPermission("analytics"),
  asyncHandler(getAnalyticsHandler)
);

router.get(
  "/applications",
  requireAdminPermission("applications"),
  asyncHandler(listApplicationsHandler)
);

router.get(
  "/applications/:id",
  requireAdminPermission("applications"),
  asyncHandler(getApplicationHandler)
);

router.get(
  "/volunteers",
  requireAdminPermission("volunteers"),
  asyncHandler(listVolunteersHandler)
);

router.get(
  "/payments",
  requireAdminPermission("payments"),
  asyncHandler(listPaymentsHandler)
);

export default router;
