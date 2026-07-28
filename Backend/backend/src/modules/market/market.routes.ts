import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { getFavoritePrices, getIntelligence, getPrices } from "./market.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

// GET /api/v1/market/prices — flat mandi list (backward compatible)
router.get("/prices", asyncHandler(getPrices));

// GET /api/v1/market/intelligence — crop intelligence (markets + summary)
router.get("/intelligence", asyncHandler(getIntelligence));

// GET /api/v1/market/favourites
router.get("/favourites", authenticate, asyncHandler(getFavoritePrices));

export default router;
