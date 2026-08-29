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
import { getRepresentativeDiscoveryHandler } from "../controller/representative.controller";
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

/** Farmer app: discover paid Village Representatives near the farmer's profile location. */
router.get(
  "/representative",
  authenticate,
  asyncHandler(getRepresentativeDiscoveryHandler)
);

export default router;
