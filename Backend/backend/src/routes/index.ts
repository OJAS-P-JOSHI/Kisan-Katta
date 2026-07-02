import { Router } from "express";
import healthRoutes from "./health.routes";
import marketRoutes from "../modules/market/market.routes";
import weatherRoutes from "../modules/weather/weather.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/api/v1/market", marketRoutes);
router.use("/api/v1/weather", weatherRoutes);

export default router;
