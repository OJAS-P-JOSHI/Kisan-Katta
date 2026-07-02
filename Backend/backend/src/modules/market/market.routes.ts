import { Router } from "express";
import { getPrices } from "./market.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

// GET /api/v1/market/prices
router.get("/prices", asyncHandler(getPrices));

export default router;
