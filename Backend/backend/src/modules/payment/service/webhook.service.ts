import { AppError } from "../../../utils/AppError";
import type { IGramSahakariApplication } from "../../gram-sahakari/interfaces/application.interface";
import { SUPPORTED_WEBHOOK_EVENTS } from "../payment.constants";
import {
  findApplicationByRazorpayOrderId,
  findApplicationByRazorpayPaymentId,
} from "../repository/payment.repository";
import { claimEvent, completeEvent } from "../repository/event.repository";
import { verifyWebhookSignature } from "./razorpay.service";
import { completePayment } from "./finalize.service";
import { logAuditEvent } from "./audit.service";
import type { NormalizedPaymentEvent } from "../types/payment.types";
import { paymentDebug, paymentDebugError } from "../payment-debug";

export interface WebhookResult {
  status: "ok" | "ignored" | "duplicate" | "rejected";
  httpStatus: number;
  detail: string;
}

const SYSTEM_ACTOR = { userId: "system", role: "SYSTEM" };

interface ParsedEntities {
  orderId: string | null;
  paymentId: string | null;
  refundId: string | null;
  method: string | null;
  amount: number | null;
  currency: string | null;
  failureReason: string | null;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const entityOf = (payload: Record<string, unknown>, key: string): Record<string, unknown> =>
  asRecord(asRecord(payload[key]).entity);

const str = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const num = (value: unknown): number | null =>
  typeof value === "number" ? value : null;

const parseEntities = (body: Record<string, unknown>): ParsedEntities => {
  const payload = asRecord(body.payload);
  const payment = entityOf(payload, "payment");
  const order = entityOf(payload, "order");
  const refund = entityOf(payload, "refund");

  return {
    orderId: str(payment.order_id) ?? str(order.id) ?? str(refund.order_id),
    paymentId: str(payment.id) ?? str(refund.payment_id),
    refundId: str(refund.id),
    method: str(payment.method),
    amount: num(payment.amount) ?? num(order.amount),
    currency: str(payment.currency),
    failureReason:
      str(payment.error_description) ?? str(payment.error_reason),
  };
};

const kindForEvent = (
  eventType: string
): NormalizedPaymentEvent["kind"] | null => {
  switch (eventType) {
    case "payment.authorized":
      return "AUTHORIZED";
    case "payment.captured":
    case "order.paid":
      return "PAID";
    case "payment.failed":
      return "FAILED";
    case "refund.created":
      return "REFUND_CREATED";
    case "refund.processed":
      return "REFUNDED";
    case "refund.failed":
      return "REFUND_FAILED";
    default:
      return null;
  }
};

const findApplication = async (
  entities: ParsedEntities
): Promise<IGramSahakariApplication | null> => {
  if (entities.orderId) {
    const byOrder = await findApplicationByRazorpayOrderId(entities.orderId);
    if (byOrder) return byOrder;
  }
  if (entities.paymentId) {
    return findApplicationByRazorpayPaymentId(entities.paymentId);
  }
  return null;
};

/**
 * Processes a Razorpay webhook delivery end-to-end. The payload is never
 * trusted until its signature is verified; every event is deduplicated via the
 * RazorpayEvent ledger; and all state changes go through the shared
 * `completePayment` service. Always returns a well-defined HTTP status — it
 * never throws for unknown/duplicate/unrelated events.
 */
export const handleWebhook = async (
  rawBody: string,
  signature: string | undefined,
  eventIdHeader: string | undefined,
  body: Record<string, unknown>
): Promise<WebhookResult> => {
  paymentDebug("Webhook: delivery received", {
    hasSignature: Boolean(signature),
    eventIdHeader: eventIdHeader ?? null,
    eventType: str(body.event) ?? "unknown",
  });

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    logAuditEvent({
      action: "WEBHOOK_REJECTED",
      applicationId: "unknown",
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
  const entities = parseEntities(body);
  // Prefer Razorpay's delivery id header; fall back to a deterministic key so
  // dedup still works if the header is missing.
  const eventId =
    str(eventIdHeader) ??
    `${eventType}_${entities.paymentId ?? entities.orderId ?? entities.refundId ?? "na"}`;

  logAuditEvent({
    action: "WEBHOOK_RECEIVED",
    applicationId: "unknown",
    actorUserId: SYSTEM_ACTOR.userId,
    actorRole: SYSTEM_ACTOR.role,
    details: { eventType, eventId },
  });
  logAuditEvent({
    action: "WEBHOOK_VERIFIED",
    applicationId: "unknown",
    actorUserId: SYSTEM_ACTOR.userId,
    actorRole: SYSTEM_ACTOR.role,
    details: { eventType, eventId },
  });

  const supported = (SUPPORTED_WEBHOOK_EVENTS as readonly string[]).includes(
    eventType
  );

  const claim = await claimEvent(eventId, eventType, "WEBHOOK");
  paymentDebug("Webhook: event ledger claim", {
    eventId,
    eventType,
    duplicate: claim.duplicate,
    claimed: claim.claimed,
    processingResult: claim.existing?.processingResult ?? null,
    isProcessing: claim.existing?.processingResult === "PROCESSING",
    isFailed: claim.existing?.processingResult === "FAILED",
  });
  if (claim.duplicate && claim.existing?.processingResult !== "PROCESSING") {
    paymentDebug("Webhook: duplicate event — skipping reprocess", { eventId });
    // A prior delivery already finished this event (PROCESSED / IGNORED /
    // DUPLICATE) — acknowledge without reprocessing.
    return { status: "duplicate", httpStatus: 200, detail: "Duplicate event." };
  }
  // If we reach here with a duplicate claim, the existing record is stuck in
  // PROCESSING: a previous delivery crashed after claiming the event but before
  // it could finalize. Mirror the verify endpoint and fall through to retry
  // completePayment. That write is atomic and idempotent (the paymentStatus
  // `fromStates` guard), so a genuinely concurrent in-flight delivery still
  // cannot double-apply the completion — the loser observes `changed: false`.
  // (A FAILED claim is returned as claimed by claimEvent, so it also retries.)

  if (!supported) {
    await completeEvent(eventId, "IGNORED");
    return { status: "ignored", httpStatus: 200, detail: "Unsupported event." };
  }

  const kind = kindForEvent(eventType);
  if (!kind) {
    await completeEvent(eventId, "IGNORED");
    return { status: "ignored", httpStatus: 200, detail: "Unsupported event." };
  }

  const application = await findApplication(entities);
  if (!application) {
    await completeEvent(eventId, "IGNORED");
    return {
      status: "ignored",
      httpStatus: 200,
      detail: "No matching application.",
    };
  }

  const applicationId = String(application._id);

  paymentDebug("Webhook: application matched", {
    eventId,
    eventType,
    applicationId,
    applicationNumber: application.applicationNumber,
    orderId: entities.orderId,
    paymentId: entities.paymentId,
    amount: entities.amount,
    currency: entities.currency,
    kind,
  });

  try {
    paymentDebug("Webhook: calling completePayment", { eventId, applicationId });
    // payment.failed is attempt-level: record the failure and bump attempt count,
    // but do NOT treat the attached order as terminal (same-order Checkout retry
    // may still authorize/capture).
    const result = await completePayment({
      application,
      event: {
        kind,
        razorpayOrderId: entities.orderId,
        razorpayPaymentId: entities.paymentId,
        paymentMethod: entities.method,
        amount: entities.amount,
        currency: entities.currency,
        refundId: entities.refundId,
        failureReason: entities.failureReason,
        gatewayResponse: body,
      },
      source: "WEBHOOK",
      actor: SYSTEM_ACTOR,
      extraEvents: ["WEBHOOK_RECEIVED", "WEBHOOK_VERIFIED"],
      ...(kind === "FAILED" ? { incrementAttempt: true } : {}),
    });

    await completeEvent(eventId, "PROCESSED", applicationId);
    paymentDebug("Webhook: completePayment returned", {
      eventId,
      applicationId,
      changed: result.changed,
      paymentStatus: result.paymentStatus,
      applicationStatus: result.application.status,
    });
    return { status: "ok", httpStatus: 200, detail: "Processed." };
  } catch (error) {
    paymentDebugError("Webhook: completePayment failed", error, {
      eventId,
      applicationId,
    });
    await completeEvent(eventId, "FAILED", applicationId);
    // Logic/validation errors (invalid transition, id mismatch) are terminal —
    // acknowledge with 200 so Razorpay does not retry pointlessly. Unexpected
    // errors bubble up as 500 so the delivery is retried later.
    if (error instanceof AppError) {
      return {
        status: "ignored",
        httpStatus: 200,
        detail: error.message,
      };
    }
    throw error;
  }
};
