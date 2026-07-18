import { Router } from "express";
import { authenticate } from "../../auth/auth.middleware";
import { asyncHandler } from "../../../utils/asyncHandler";
import {
  getApplicationStatusHandler,
  getMyApplicationHandler,
  paymentSuccessHandler,
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
  asyncHandler(getApplicationStatusHandler)
);

router.post(
  "/application/payment-success",
  authenticate,
  asyncHandler(paymentSuccessHandler)
);

export default router;
