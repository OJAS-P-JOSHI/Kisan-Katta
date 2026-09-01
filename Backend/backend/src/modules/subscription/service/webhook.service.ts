import { AppError } from "../../../utils/AppError";
import { claimEvent, completeEvent } from "../../payment/repository/event.repository";
import { verifyWebhookSignature } from "../../payment/service/razorpay.service";
import { SUPPORTED_SUBSCRIPTION_WEBHOOK_EVENTS } from "../subscription.constants";
import { findBySubscriptionId } from "../repository/subscription.repository";
import { logSubscriptionAudit } from "./audit.service";
import { applyGatewaySnapshot } from "./finalize.service";
import {
  fetchRazorpaySubscription,
  toSubscriptionSnapshot,
} from "./razorpay-subscription.service";

export interface SubscriptionWebhookResult {
  status: "ok" | "ignored" | "duplicate" | "rejected";
  httpStatus: number;
  detail: string;
}

const SYSTEM_ACTOR = { userId: "system", role: "SYSTEM" };

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const entityOf = (
  payload: Record<string, unknown>,
  key: string
): Record<string, unknown> => asRecord(asRecord(payload[key]).entity);

const str = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

/**
 * Processes Razorpay Subscription webhook deliveries.
 * Reuses payment-module HMAC verification + razorpay_events ledger.
 */
export const handleSubscriptionWebhook = async (
  rawBody: string,
  signature: string | undefined,
  eventIdHeader: string | undefined,
  body: Record<string, unknown>
): Promise<SubscriptionWebhookResult> => {
  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    logSubscriptionAudit({
      action: "SUBSCRIPTION_WEBHOOK_REJECTED",
      userId: "unknown",
      actorUserId: SYSTEM_ACTOR.userId,
      actorRole: SYSTEM_ACTOR.role,
      details: { reason: "invalid_signature" },
    });
    return {
      status: "rejected",
      httpStatus: 400,
      detail: "Invalid webhook signature.",
    };
  }

  const eventType = str(body.event) ?? "unknown";
  const payload = asRecord(body.payload);
  const subscriptionEntity = entityOf(payload, "subscription");
  const paymentEntity = entityOf(payload, "payment");

  const subscriptionId =
    str(subscriptionEntity.id) ??
    str(paymentEntity.subscription_id);
  const paymentId = str(paymentEntity.id);
  const paymentMethod = str(paymentEntity.method);
  const invoiceId =
    str(paymentEntity.invoice_id) ??
    str(entityOf(payload, "invoice").id);

  const eventId =
    str(eventIdHeader) ??
    `${eventType}_${subscriptionId ?? paymentId ?? "na"}`;

  logSubscriptionAudit({
    action: "SUBSCRIPTION_WEBHOOK_RECEIVED",
    userId: "unknown",
    subscriptionId,
    actorUserId: SYSTEM_ACTOR.userId,
    actorRole: SYSTEM_ACTOR.role,
    details: { eventType, eventId },
  });

  const claim = await claimEvent(eventId, eventType, "WEBHOOK");
  if (claim.duplicate && claim.existing?.processingResult !== "PROCESSING") {
    return { status: "duplicate", httpStatus: 200, detail: "Duplicate event." };
  }

  const supported = (
    SUPPORTED_SUBSCRIPTION_WEBHOOK_EVENTS as readonly string[]
  ).includes(eventType);

  if (!supported) {
    await completeEvent(eventId, "IGNORED");
    return { status: "ignored", httpStatus: 200, detail: "Unsupported event." };
  }

  if (!subscriptionId) {
    await completeEvent(eventId, "IGNORED");
    return {
      status: "ignored",
      httpStatus: 200,
      detail: "No subscription id in payload.",
    };
  }

  const local = await findBySubscriptionId(subscriptionId);
  if (!local) {
    await completeEvent(eventId, "IGNORED");
    return {
      status: "ignored",
      httpStatus: 200,
      detail: "No matching local subscription.",
    };
  }

  if (local.notes?.testerAccess === true) {
    await completeEvent(eventId, "IGNORED");
    return {
      status: "ignored",
      httpStatus: 200,
      detail: "Tester complimentary access — skipped.",
    };
  }

  try {
    // Prefer a live fetch so we never trust webhook ordering for period fields.
    let snapshot;
    try {
      snapshot = await fetchRazorpaySubscription(subscriptionId);
    } catch {
      snapshot = toSubscriptionSnapshot(subscriptionEntity);
    }

    await applyGatewaySnapshot({
      local,
      snapshot,
      source: "WEBHOOK",
      eventType,
      paymentId,
      paymentMethod,
      invoiceId,
      gatewayResponse: body,
    });

    await completeEvent(eventId, "PROCESSED");
    return { status: "ok", httpStatus: 200, detail: "Processed." };
  } catch (error) {
    await completeEvent(eventId, "FAILED");
    if (error instanceof AppError) {
      return { status: "ignored", httpStatus: 200, detail: error.message };
    }
    throw error;
  }
};

/** True when a Razorpay webhook event belongs to Subscriptions. */
export const isSubscriptionWebhookEvent = (eventType: unknown): boolean =>
  typeof eventType === "string" && eventType.startsWith("subscription.");
