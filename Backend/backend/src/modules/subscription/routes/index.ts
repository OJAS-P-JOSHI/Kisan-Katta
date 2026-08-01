import { Router } from "express";
import { authenticate } from "../../auth/auth.middleware";
import { asyncHandler } from "../../../utils/asyncHandler";
import {
  cancelSubscriptionHandler,
  createSubscriptionHandler,
  getCurrentSubscriptionHandler,
  getSubscriptionStatusHandler,
  refreshSubscriptionHandler,
  refundSubscriptionHandler,
  resumeSubscriptionHandler,
  subscriptionWebhookHandler,
  verifySubscriptionHandler,
  billingHistoryHandler,
  billingDetailHandler,
} from "../controller/subscription.controller";

const router = Router();

router.post(
  "/create",
  authenticate,
  asyncHandler(createSubscriptionHandler)
);

router.get(
  "/current",
  authenticate,
  asyncHandler(getCurrentSubscriptionHandler)
);

router.get(
  "/status",
  authenticate,
  asyncHandler(getSubscriptionStatusHandler)
);

router.get(
  "/billing/history",
  authenticate,
  asyncHandler(billingHistoryHandler)
);

router.get(
  "/billing/history/:paymentId",
  authenticate,
  asyncHandler(billingDetailHandler)
);

router.post(
  "/verify",
  authenticate,
  asyncHandler(verifySubscriptionHandler)
);

router.post(
  "/cancel",
  authenticate,
  asyncHandler(cancelSubscriptionHandler)
);

router.post(
  "/resume",
  authenticate,
  asyncHandler(resumeSubscriptionHandler)
);

router.post(
  "/refresh",
  authenticate,
  asyncHandler(refreshSubscriptionHandler)
);

// Public: Razorpay servers. Authenticated by webhook signature only.
router.post("/webhook", asyncHandler(subscriptionWebhookHandler));

// Placeholder for future refunds (always 501).
router.post(
  "/refund",
  authenticate,
  asyncHandler(refundSubscriptionHandler)
);

export default router;
