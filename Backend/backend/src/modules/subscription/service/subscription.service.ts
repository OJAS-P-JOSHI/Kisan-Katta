import { Types } from "mongoose";
import { env } from "../../../config/env";
import { getRazorpayKeyId } from "../../../config/razorpay";
import { AppError } from "../../../utils/AppError";
import { AuthUser } from "../../auth/auth.model";
import {
  fetchPaymentMethod,
  verifySubscriptionPaymentSignature,
} from "../../payment/service/razorpay.service";
import { claimEvent, completeEvent } from "../../payment/repository/event.repository";
import {
  SUBSCRIPTION_FEE_PAISE,
  SUBSCRIPTION_CURRENCY,
  SUBSCRIPTION_TOTAL_COUNT,
  SUBSCRIPTION_QUANTITY,
} from "../subscription.constants";
import {
  toSubscriptionDTO,
  toSubscriptionStatusDTO,
  type CreateSubscriptionResponseDTO,
  type SubscriptionDTO,
  type SubscriptionStatusDTO,
  type VerifySubscriptionResponseDTO,
} from "../dto/subscription.dto";
import {
  createSubscriptionDoc,
  findBySubscriptionId,
  findLatestByUserId,
  findLivingByUserId,
} from "../repository/subscription.repository";
import type {
  CancelSubscriptionBody,
  VerifySubscriptionBody,
} from "../types/subscription.types";
import { hasSubscriptionAccess } from "../utils/access";
import { logSubscriptionAudit } from "./audit.service";
import { applyGatewaySnapshot } from "./finalize.service";
import {
  cancelRazorpaySubscription,
  createRazorpaySubscription,
  fetchRazorpaySubscription,
  resumeRazorpaySubscription,
} from "./razorpay-subscription.service";

const assertPlanConfigured = (): string => {
  if (!env.razorpaySubscriptionPlanId) {
    throw new AppError(
      "Subscription plan is not configured on the server.",
      503
    );
  }
  return env.razorpaySubscriptionPlanId;
};

/**
 * Creates (or reuses) a Razorpay Subscription for Checkout authorisation.
 * Idempotent: returns an existing CREATED subscription instead of minting another.
 */
export const createSubscription = async (
  userId: string,
  actorRole: string
): Promise<CreateSubscriptionResponseDTO> => {
  const planId = assertPlanConfigured();

  const living = await findLivingByUserId(userId);
  if (living && hasSubscriptionAccess(living)) {
    throw new AppError("You already have an active subscription.", 409);
  }

  if (living?.subscriptionId && living.status === "CREATED") {
    return {
      subscriptionId: living.subscriptionId,
      planId: living.planId,
      status: living.status,
      amount: living.amount,
      currency: living.currency,
      key: getRazorpayKeyId(),
      shortUrl: living.shortUrl,
    };
  }

  const user = await AuthUser.findById(userId).lean();
  if (!user) {
    throw new AppError("Authenticated user not found.", 401);
  }

  const gateway = await createRazorpaySubscription({
    planId,
    userId,
    totalCount: SUBSCRIPTION_TOTAL_COUNT,
    quantity: SUBSCRIPTION_QUANTITY,
    notes: { mobile: user.mobile },
  });

  await createSubscriptionDoc({
    userId: new Types.ObjectId(userId),
    planId,
    subscriptionId: gateway.id,
    customerId: gateway.customerId,
    status: "CREATED",
    amount: SUBSCRIPTION_FEE_PAISE,
    currency: SUBSCRIPTION_CURRENCY,
    quantity: SUBSCRIPTION_QUANTITY,
    totalCount: gateway.totalCount ?? SUBSCRIPTION_TOTAL_COUNT,
    paidCount: gateway.paidCount ?? 0,
    shortUrl: gateway.shortUrl,
    notes: gateway.notes,
    events: [
      {
        type: "SUBSCRIPTION_CREATED",
        source: "API",
        details: { razorpaySubscriptionId: gateway.id },
        timestamp: new Date(),
      },
    ],
    meta: {
      paymentGateway: "RAZORPAY",
      processingSource: "API",
      gatewayResponse: gateway.raw,
    },
  });

  logSubscriptionAudit({
    action: "SUBSCRIPTION_CREATED",
    userId,
    subscriptionId: gateway.id,
    actorUserId: userId,
    actorRole,
    details: { planId, amount: SUBSCRIPTION_FEE_PAISE },
  });

  return {
    subscriptionId: gateway.id,
    planId,
    status: "CREATED",
    amount: SUBSCRIPTION_FEE_PAISE,
    currency: SUBSCRIPTION_CURRENCY,
    key: getRazorpayKeyId(),
    shortUrl: gateway.shortUrl,
  };
};

export const getCurrentSubscription = async (
  userId: string
): Promise<SubscriptionDTO | null> => {
  const doc = await findLatestByUserId(userId);
  return doc ? toSubscriptionDTO(doc) : null;
};

export const getSubscriptionStatus = async (
  userId: string
): Promise<SubscriptionStatusDTO> => {
  const doc = await findLatestByUserId(userId);
  return toSubscriptionStatusDTO(doc);
};

/**
 * Verifies Checkout authorisation signature then syncs local state from Razorpay.
 * Signature: HMAC(payment_id|subscription_id) — official Subscriptions guide.
 */
export const verifySubscriptionAuth = async (
  userId: string,
  body: VerifySubscriptionBody,
  actorRole: string
): Promise<VerifySubscriptionResponseDTO> => {
  const local = await findBySubscriptionId(body.razorpay_subscription_id);
  if (!local) {
    throw new AppError("Subscription not found.", 404);
  }
  if (String(local.userId) !== userId) {
    throw new AppError("Subscription does not belong to this user.", 403);
  }

  if (hasSubscriptionAccess(local) && local.status !== "CREATED") {
    return {
      subscription: toSubscriptionDTO(local),
      paymentId: body.razorpay_payment_id,
    };
  }

  const valid = verifySubscriptionPaymentSignature({
    razorpay_subscription_id: body.razorpay_subscription_id,
    razorpay_payment_id: body.razorpay_payment_id,
    razorpay_signature: body.razorpay_signature,
  });

  if (!valid) {
    logSubscriptionAudit({
      action: "SUBSCRIPTION_VERIFY_FAILED",
      userId,
      subscriptionId: body.razorpay_subscription_id,
      actorUserId: userId,
      actorRole,
      details: { reason: "invalid_signature" },
    });
    throw new AppError("Subscription payment signature verification failed.", 400);
  }

  const eventId = `sub_verify_${body.razorpay_subscription_id}_${body.razorpay_payment_id}`;
  const claim = await claimEvent(eventId, "subscription.verify", "VERIFY");
  if (claim.duplicate && claim.existing?.processingResult === "PROCESSED") {
    const fresh = (await findBySubscriptionId(body.razorpay_subscription_id)) ?? local;
    return {
      subscription: toSubscriptionDTO(fresh),
      paymentId: body.razorpay_payment_id,
    };
  }

  try {
    const snapshot = await fetchRazorpaySubscription(body.razorpay_subscription_id);
    const method = await fetchPaymentMethod(body.razorpay_payment_id);
    const updated = await applyGatewaySnapshot({
      local: claim.duplicate
        ? ((await findBySubscriptionId(body.razorpay_subscription_id)) ?? local)
        : local,
      snapshot,
      source: "VERIFY",
      eventType: "SUBSCRIPTION_VERIFY_SUCCESS",
      paymentId: body.razorpay_payment_id,
      paymentMethod: method,
    });

    await completeEvent(eventId, "PROCESSED", undefined);
    logSubscriptionAudit({
      action: "SUBSCRIPTION_VERIFY_SUCCESS",
      userId,
      subscriptionId: body.razorpay_subscription_id,
      actorUserId: userId,
      actorRole,
      details: { paymentId: body.razorpay_payment_id, status: updated.status },
    });

    return {
      subscription: toSubscriptionDTO(updated),
      paymentId: body.razorpay_payment_id,
    };
  } catch (error) {
    await completeEvent(eventId, "FAILED", undefined);
    throw error;
  }
};

export const cancelSubscription = async (
  userId: string,
  body: CancelSubscriptionBody,
  actorRole: string
): Promise<SubscriptionDTO> => {
  const local = await findLivingByUserId(userId);
  if (!local?.subscriptionId) {
    throw new AppError("No active subscription to cancel.", 404);
  }

  const cancelAtCycleEnd = body.cancelAtCycleEnd !== false;
  const snapshot = await cancelRazorpaySubscription(
    local.subscriptionId,
    cancelAtCycleEnd
  );

  const updated = await applyGatewaySnapshot({
    local,
    snapshot,
    source: "API",
    eventType: "SUBSCRIPTION_CANCELLED",
    extraSet: { cancelAtCycleEnd, cancelledAt: new Date() },
  });

  logSubscriptionAudit({
    action: "SUBSCRIPTION_CANCELLED",
    userId,
    subscriptionId: local.subscriptionId,
    actorUserId: userId,
    actorRole,
    details: { cancelAtCycleEnd },
  });

  return toSubscriptionDTO(updated);
};

export const resumeSubscription = async (
  userId: string,
  actorRole: string
): Promise<SubscriptionDTO> => {
  const local = await findLatestByUserId(userId);
  if (!local?.subscriptionId) {
    throw new AppError("No subscription found to resume.", 404);
  }
  if (local.status !== "PAUSED") {
    throw new AppError("Only a paused subscription can be resumed.", 409);
  }

  const snapshot = await resumeRazorpaySubscription(local.subscriptionId);
  const updated = await applyGatewaySnapshot({
    local,
    snapshot,
    source: "API",
    eventType: "SUBSCRIPTION_RESUMED",
  });

  logSubscriptionAudit({
    action: "SUBSCRIPTION_RESUMED",
    userId,
    subscriptionId: local.subscriptionId,
    actorUserId: userId,
    actorRole,
  });

  return toSubscriptionDTO(updated);
};

/** Pulls Razorpay source of truth and updates the local document. */
export const refreshSubscriptionState = async (
  userId: string,
  actorRole: string
): Promise<SubscriptionDTO> => {
  const local = await findLatestByUserId(userId);
  if (!local?.subscriptionId) {
    throw new AppError("No subscription found.", 404);
  }

  const snapshot = await fetchRazorpaySubscription(local.subscriptionId);
  const updated = await applyGatewaySnapshot({
    local,
    snapshot,
    source: "API",
    eventType: "SUBSCRIPTION_REFRESHED",
  });

  logSubscriptionAudit({
    action: "SUBSCRIPTION_REFRESHED",
    userId,
    subscriptionId: local.subscriptionId,
    actorUserId: userId,
    actorRole,
    details: { status: updated.status },
  });

  return toSubscriptionDTO(updated);
};
