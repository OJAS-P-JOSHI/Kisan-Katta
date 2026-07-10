import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { getFavoritePrices, getPrices } from "./market.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

// GET /api/v1/market/prices
router.get("/prices", asyncHandler(getPrices));

// GET /api/v1/market/favourites
router.get("/favourites", authenticate, asyncHandler(getFavoritePrices));

export default router;
