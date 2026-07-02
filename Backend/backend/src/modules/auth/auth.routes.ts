import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "./auth.middleware";
import {
  sendOtpHandler,
  verifyOtpHandler,
  getMeHandler,
  logoutHandler,
} from "./auth.controller";

const router = Router();

// Public
router.post("/send-otp", asyncHandler(sendOtpHandler));
router.post("/verify-otp", asyncHandler(verifyOtpHandler));

// Protected
router.get("/me", authenticate, asyncHandler(getMeHandler));
router.post("/logout", authenticate, asyncHandler(logoutHandler));

export default router;
