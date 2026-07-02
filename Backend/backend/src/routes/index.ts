import { Router } from "express";
import healthRoutes from "./health.routes";
import marketRoutes from "../modules/market/market.routes";
import weatherRoutes from "../modules/weather/weather.routes";
import authRoutes from "../modules/auth/auth.routes";
import profileRoutes from "../modules/profile/profile.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/api/v1/market", marketRoutes);
router.use("/api/v1/weather", weatherRoutes);
router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/profile", profileRoutes);

export default router;
