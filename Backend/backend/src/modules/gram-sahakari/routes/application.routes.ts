import { Router } from "express";
import { authenticate } from "../../auth/auth.middleware";
import { asyncHandler } from "../../../utils/asyncHandler";
import {
  getApplicationStatusHandler,
  getMyApplicationHandler,
  startApplicationHandler,
  submitApplicationHandler,
  updateApplicationHandler,
  uploadDocumentHandler,
} from "../controller/application.controller";
import {
  gramSahakariDocumentUpload,
} from "../middlewares/upload.middleware";
import { requireFarmerApplicant } from "../middlewares/ownership.middleware";

const router = Router();

router.post(
  "/application/start",
  authenticate,
  requireFarmerApplicant,
  asyncHandler(startApplicationHandler)
);

router.get(
  "/application/me",
  authenticate,
  // Own-application read — applicants only (ADMIN manages via /admin/*).
  requireFarmerApplicant,
  asyncHandler(getMyApplicationHandler)
);

router.put(
  "/application",
  authenticate,
  requireFarmerApplicant,
  asyncHandler(updateApplicationHandler)
);

router.post(
  "/application/upload",
  authenticate,
  requireFarmerApplicant,
  gramSahakariDocumentUpload,
  asyncHandler(uploadDocumentHandler)
);

router.post(
  "/application/submit",
  authenticate,
  requireFarmerApplicant,
  asyncHandler(submitApplicationHandler)
);

router.get(
  "/application/status",
  authenticate,
  // Own-application status — applicants only (ADMIN manages via /admin/*).
  requireFarmerApplicant,
  asyncHandler(getApplicationStatusHandler)
);

export default router;
