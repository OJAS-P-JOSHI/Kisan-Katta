import { Router } from "express";
import { authenticate } from "../../auth/auth.middleware";
import { asyncHandler } from "../../../utils/asyncHandler";
import {
  requireFarmerApplicant,
  requirePaymentActor,
} from "../../gram-sahakari/middlewares/ownership.middleware";
import { requireAdmin } from "../../gram-sahakari/middlewares/role.middleware";
import {
  createOrderHandler,
  paymentDetailsHandler,
  paymentFailureHandler,
  reconcileHandler,
  verifyPaymentHandler,
  webhookHandler,
} from "../controller/payment.controller";

const router = Router();

router.post(
  "/application/payment/create-order",
  authenticate,
  requireFarmerApplicant,
  asyncHandler(createOrderHandler)
);

// Uses requirePaymentActor (not requireFarmerApplicant): if the webhook wins the
// race it promotes the user to GRAM_SAHAKARI before this call lands, and the
// idempotent handler must still return the completed state (200), not 403.
router.post(
  "/application/payment/verify",
  authenticate,
  requirePaymentActor,
  asyncHandler(verifyPaymentHandler)
);

router.post(
  "/application/payment/failure",
  authenticate,
  requireFarmerApplicant,
  asyncHandler(paymentFailureHandler)
);

// Public: called by Razorpay servers. Authenticated by webhook signature only.
router.post("/application/payment/webhook", asyncHandler(webhookHandler));

router.get(
  "/application/payment/details",
  authenticate,
  asyncHandler(paymentDetailsHandler)
);

// Admin-only reconciliation against Razorpay's source of truth.
router.get(
  "/application/payment/reconcile/:applicationId",
  authenticate,
  requireAdmin,
  asyncHandler(reconcileHandler)
);

export default router;
