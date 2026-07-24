import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyVolunteerHandler } from "./verification.controller";
import { verificationRateLimit } from "./verification.rate-limit";

const router = Router();

/**
 * Public Gram Sahakari verification.
 * GET /api/v1/verify/:volunteerId
 * No authentication.
 */
router.get(
  "/:volunteerId",
  verificationRateLimit,
  asyncHandler(verifyVolunteerHandler)
);

export default router;
