import { Router } from "express";
import healthRoutes from "./health.routes";
import marketRoutes from "../modules/market/market.routes";
import weatherRoutes from "../modules/weather/weather.routes";
import authRoutes from "../modules/auth/auth.routes";
import profileRoutes from "../modules/profile/profile.routes";
import marketplaceRoutes from "../modules/marketplace/marketplace.routes";
import farmerPriceRoutes from "../modules/farmer-price/farmer-price.routes";
import gramSahakariRoutes from "../modules/gram-sahakari/routes";
import paymentRoutes from "../modules/payment/routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/api/v1/market", marketRoutes);
router.use("/api/v1/weather", weatherRoutes);
router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/profile", profileRoutes);
router.use("/api/v1/marketplace", marketplaceRoutes);
router.use("/api/v1/farmer-price", farmerPriceRoutes);
router.use("/api/v1/gram-sahakari", gramSahakariRoutes);
router.use("/api/v1/gram-sahakari", paymentRoutes);

export default router;
