import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  getCurrentWeatherHandler,
  getForecastHandler,
  getAlertsHandler,
} from "./weather.controller";

const router = Router();

// GET /api/v1/weather/current?district=Pune
router.get("/current", asyncHandler(getCurrentWeatherHandler));

// GET /api/v1/weather/forecast?district=Nashik&days=7
router.get("/forecast", asyncHandler(getForecastHandler));

// GET /api/v1/weather/alerts?district=Pune
router.get("/alerts", asyncHandler(getAlertsHandler));


export default router;
