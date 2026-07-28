import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { listCropsHandler, searchCropsHandler } from "./crop.controller";

/**
 * Crop Master routes — public, read-only Agmarknet catalog.
 *
 * Mounted at /api/v1/crops
 */
const router = Router();

// GET /api/v1/crops/search?q=onion  (must be before /:id patterns)
router.get("/search", asyncHandler(searchCropsHandler));

// GET /api/v1/crops
router.get("/", asyncHandler(listCropsHandler));

export default router;
