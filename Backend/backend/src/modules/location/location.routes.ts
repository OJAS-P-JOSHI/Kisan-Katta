import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  listDistrictsHandler,
  listTalukasHandler,
  listVillagesHandler,
} from "./location.controller";

/**
 * Location Master routes — public, read-only LGD hierarchy.
 *
 * Mounted at /api/v1/location
 */
const router = Router();

// GET /api/v1/location/districts
router.get("/districts", asyncHandler(listDistrictsHandler));

// GET /api/v1/location/talukas/:districtCode
router.get("/talukas/:districtCode", asyncHandler(listTalukasHandler));

// GET /api/v1/location/villages/:talukaCode
router.get("/villages/:talukaCode", asyncHandler(listVillagesHandler));

export default router;
