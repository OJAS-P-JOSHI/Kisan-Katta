import { Router } from "express";
import applicationRoutes from "./application.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.use(applicationRoutes);
router.use("/admin", adminRoutes);

export default router;
