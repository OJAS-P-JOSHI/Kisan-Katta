import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../auth/auth.middleware";
import {
  createProfileHandler,
  getProfileHandler,
  updateProfileHandler,
} from "./profile.controller";
import {
  deleteProfileImageHandler,
  uploadProfileImageHandler,
} from "./profile.image.controller";
import { profileImageUpload } from "./profile.upload.middleware";

const router = Router();

// All profile routes are protected
router.post("/", authenticate, asyncHandler(createProfileHandler));
router.get("/me", authenticate, asyncHandler(getProfileHandler));
router.put("/me", authenticate, asyncHandler(updateProfileHandler));

router.post(
  "/image",
  authenticate,
  profileImageUpload,
  asyncHandler(uploadProfileImageHandler)
);
router.delete("/image", authenticate, asyncHandler(deleteProfileImageHandler));

export default router;
