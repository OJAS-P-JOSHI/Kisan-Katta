import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../auth/auth.middleware";
import {
  createProfileHandler,
  getProfileHandler,
  updateProfileHandler,
} from "./profile.controller";

const router = Router();

// All profile routes are protected
router.post("/", authenticate, asyncHandler(createProfileHandler));
router.get("/me", authenticate, asyncHandler(getProfileHandler));
router.put("/me", authenticate, asyncHandler(updateProfileHandler));

export default router;
