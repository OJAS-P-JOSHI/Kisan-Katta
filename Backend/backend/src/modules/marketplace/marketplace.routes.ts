import { NextFunction, Request, Response, Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../auth/auth.middleware";
import { verifyToken } from "../auth/jwt.service";
import { AuthUser } from "../auth/auth.model";
import {
  archiveListingHandler,
  contactListingHandler,
  createListingHandler,
  getListingByIdHandler,
  getListingsHandler,
  getMyListingsHandler,
  getSavedListingsHandler,
  saveListingHandler,
  unsaveListingHandler,
  updateListingHandler,
} from "./marketplace.controller";
import {
  deleteMarketplaceImageHandler,
  uploadMarketplaceImagesHandler,
} from "./marketplace.image.controller";
import { marketplaceImageUpload } from "./marketplace.upload.middleware";

const router = Router();

/**
 * Optionally attaches req.user when a valid Bearer token is present.
 * Invalid or missing tokens are ignored so the route stays public.
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

router.get("/listings", optionalAuthenticate, asyncHandler(getListingsHandler));
router.post("/listings", authenticate, asyncHandler(createListingHandler));
router.post(
  "/images/upload",
  authenticate,
  marketplaceImageUpload,
  asyncHandler(uploadMarketplaceImagesHandler)
);
router.delete("/images", authenticate, asyncHandler(deleteMarketplaceImageHandler));
router.get("/my-listings", authenticate, asyncHandler(getMyListingsHandler));
router.get("/saved", authenticate, asyncHandler(getSavedListingsHandler));

router.get("/listings/:id", optionalAuthenticate, asyncHandler(getListingByIdHandler));
router.post("/listings/:id/contact", asyncHandler(contactListingHandler));
router.put("/listings/:id", authenticate, asyncHandler(updateListingHandler));
router.delete("/listings/:id", authenticate, asyncHandler(archiveListingHandler));

router.post("/listings/:id/save", authenticate, asyncHandler(saveListingHandler));
router.delete("/listings/:id/save", authenticate, asyncHandler(unsaveListingHandler));

export default router;
