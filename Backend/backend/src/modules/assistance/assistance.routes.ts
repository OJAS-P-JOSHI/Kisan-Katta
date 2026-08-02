import { NextFunction, Request, Response, Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../auth/auth.middleware";
import { verifyToken } from "../auth/jwt.service";
import { AuthUser } from "../auth/auth.model";
import {
  createHelpRequestHandler,
  deleteHelpRequestHandler,
  getHelpRequestByIdHandler,
  getHelpRequestsHandler,
  getMyAssistanceSummaryHandler,
  getMyHelpRequestsHandler,
  reportHelpRequestHandler,
  resolveHelpRequestHandler,
  supportHelpRequestHandler,
  updateHelpRequestHandler,
} from "./assistance.controller";
import {
  deleteAssistanceImageHandler,
  uploadAssistanceImagesHandler,
} from "./assistance.image.controller";
import {
  assistanceUploadRateLimit,
  assistanceWriteRateLimit,
} from "./assistance.rate-limit";
import { assistanceImageUpload } from "./assistance.upload.middleware";

const router = Router();

/**
 * Optionally attaches req.user when a valid Bearer token is present.
 * Invalid or missing tokens are ignored so browsing the feed stays public,
 * while signed-in farmers still receive their own support / owner flags.
 */
const optionalAuthenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.slice(7);

    try {
      const payload = verifyToken(token);
      const user = await AuthUser.findById(payload.userId).select("mobile role").lean();

      if (user) {
        req.user = {
          userId: payload.userId,
          mobile: user.mobile,
          role: user.role ?? "FARMER",
        };
      }
    } catch {
      // Public browse endpoint — ignore invalid tokens.
    }

    next();
  }
);

// Static segments must be registered before "/:id" so they are not swallowed.
router.get("/my-assistance", authenticate, asyncHandler(getMyHelpRequestsHandler));
router.get("/my-summary", authenticate, asyncHandler(getMyAssistanceSummaryHandler));

router.post(
  "/images/upload",
  authenticate,
  assistanceUploadRateLimit,
  assistanceImageUpload,
  asyncHandler(uploadAssistanceImagesHandler)
);
router.delete(
  "/images",
  authenticate,
  assistanceWriteRateLimit,
  asyncHandler(deleteAssistanceImageHandler)
);

router.get("/", optionalAuthenticate, asyncHandler(getHelpRequestsHandler));
router.post(
  "/",
  authenticate,
  assistanceWriteRateLimit,
  asyncHandler(createHelpRequestHandler)
);

router.get("/:id", optionalAuthenticate, asyncHandler(getHelpRequestByIdHandler));
router.patch(
  "/:id",
  authenticate,
  assistanceWriteRateLimit,
  asyncHandler(updateHelpRequestHandler)
);
router.patch(
  "/:id/resolve",
  authenticate,
  assistanceWriteRateLimit,
  asyncHandler(resolveHelpRequestHandler)
);
router.delete(
  "/:id",
  authenticate,
  assistanceWriteRateLimit,
  asyncHandler(deleteHelpRequestHandler)
);

router.post(
  "/:id/support",
  authenticate,
  assistanceWriteRateLimit,
  asyncHandler(supportHelpRequestHandler)
);
router.post(
  "/:id/report",
  authenticate,
  assistanceWriteRateLimit,
  asyncHandler(reportHelpRequestHandler)
);

export default router;
