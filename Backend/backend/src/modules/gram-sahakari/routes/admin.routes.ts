import { Router } from "express";
import { authenticate } from "../../auth/auth.middleware";
import { asyncHandler } from "../../../utils/asyncHandler";
import {
  getApplicationByIdHandler,
  listApplicationsHandler,
} from "../controller/admin.controller";
import { requireAdminOrTeam } from "../middlewares/role.middleware";

const router = Router();

// Read-only admin/team support endpoints. Manual review has been removed.
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

export default router;
