import { AppError } from "../../../utils/AppError";
import { AuthUser } from "../../auth/auth.model";
import { PAYMENT_STATUSES } from "../../gram-sahakari/gram-sahakari.constants";
import type { IGramSahakariApplication } from "../../gram-sahakari/interfaces/application.interface";
import type { PaymentStatus } from "../../gram-sahakari/types/application.types";
import type { IPaymentEvent } from "../interfaces/payment.interface";
import {
  ALLOWED_PAYMENT_TRANSITIONS,
  PAYMENT_CURRENCY,
  PAYMENT_GATEWAY,
  REGISTRATION_FEE_PAISE,
} from "../payment.constants";
import {
  findApplicationById,
  transitionPayment,
} from "../repository/payment.repository";
import { RAZORPAY_SDK_VERSION } from "./razorpay.service";
import { logAuditEvent } from "./audit.service";
import { logAuditEvent as logApplicationAudit } from "../../gram-sahakari/service/audit.service";
import type {
  NormalizedPaymentEvent,
  PaymentEventType,
  ProcessingSource,
} from "../types/payment.types";
import { paymentDebug, paymentDebugError } from "../payment-debug";

export interface CompletePaymentOptions {
  application: IGramSahakariApplication;
  event: NormalizedPaymentEvent;
  source: ProcessingSource;
  actor: { userId: string; role: string };
  /** Only frontend-reported failures increment the attempt counter. */
  incrementAttempt?: boolean;
  /** Extra timeline events (e.g. VERIFY_REQUEST_RECEIVED) prepended to the primary ones. */
  extraEvents?: PaymentEventType[];
}

export interface CompletePaymentResult {
  application: IGramSahakariApplication;
  /** True only when this call performed the state write (first writer wins). */
  changed: boolean;
  /** Terminal payment status after the call. */
  paymentStatus: PaymentStatus;
}

/** All valid predecessor states from which `target` is reachable. */
const predecessorsOf = (target: PaymentStatus): PaymentStatus[] =>
  (PAYMENT_STATUSES as readonly PaymentStatus[]).filter(
    (state) => state !== target && ALLOWED_PAYMENT_TRANSITIONS[state].includes(target)
  );

const targetFor = (kind: NormalizedPaymentEvent["kind"]): PaymentStatus | null => {
  switch (kind) {
    case "AUTHORIZED":
      return "AUTHORIZED";
    case "PAID":
      return "PAID";
    case "FAILED":
      return "FAILED";
    case "REFUNDED":
      return "REFUNDED";
    case "REFUND_CREATED":
    case "REFUND_FAILED":
      return null; // metadata/timeline only; state unchanged
  }
};

const primaryHistoryFor = (
  kind: NormalizedPaymentEvent["kind"]
): PaymentEventType[] => {
  switch (kind) {
    case "AUTHORIZED":
      return ["PAYMENT_AUTHORIZED"];
    case "PAID":
      return ["PAYMENT_CAPTURED", "PAYMENT_COMPLETED"];
    case "FAILED":
      return ["PAYMENT_FAILED"];
    case "REFUND_CREATED":
      return ["REFUND_CREATED"];
    case "REFUNDED":
      return ["REFUND_PROCESSED"];
    case "REFUND_FAILED":
      return ["REFUND_FAILED"];
  }
};

/**
 * The ONE and ONLY place that mutates payment state, application status,
 * payment metadata, the payment timeline, and payment audit logs. Both the
 * frontend verify endpoint and the Razorpay webhook (and reconciliation) funnel
 * through here, so completion logic is never duplicated.
 *
 * Idempotent and concurrency-safe:
 *  - a transition to the current state is a no-op success (duplicate delivery);
 *  - an atomic guarded write means only the first of N concurrent/replayed
 *    callers performs the mutation; the rest observe `changed: false`;
 *  - invalid transitions (e.g. FAILED -> AUTHORIZED) are rejected.
 */
export const completePayment = async (
  options: CompletePaymentOptions
): Promise<CompletePaymentResult> => {
  const { application, event, source, actor } = options;
  const applicationId = String(application._id);
  const current = application.paymentStatus;
  const target = targetFor(event.kind);

  paymentDebug("completePayment: entered", {
    applicationId,
    applicationNumber: application.applicationNumber,
    previousPaymentStatus: current,
    previousApplicationStatus: application.status,
    targetPaymentStatus: target,
    eventKind: event.kind,
    source,
    razorpayOrderId: event.razorpayOrderId ?? application.razorpayOrderId,
    razorpayPaymentId: event.razorpayPaymentId ?? null,
    amount: event.amount ?? null,
    currency: event.currency ?? null,
  });

  // --- Security cross-checks (never trust the caller's identifiers) ---------
  if (
    event.razorpayOrderId &&
    application.razorpayOrderId &&
    event.razorpayOrderId !== application.razorpayOrderId
  ) {
    throw new AppError("Payment order does not match this application.", 400);
  }

  // Payment-id equality is only enforced once the application is already PAID.
  // Razorpay issues a NEW payment id on every attempt against the same order
  // (and webhooks may persist the first attempt's id via payment.authorized).
  // Rejecting a later successful payment id here caused false 400s after a
  // fresh create-order / retry. Cross-order spoofing is already blocked above.
  if (
    event.razorpayPaymentId &&
    application.razorpayPaymentId &&
    event.razorpayPaymentId !== application.razorpayPaymentId &&
    (application.paymentStatus === "PAID" || application.paymentVerified)
  ) {
    throw new AppError("Payment id does not match this application.", 400);
  }

  // Never mark PAID unless the amount/currency match the server-defined fee.
  // Applies to webhook and reconciliation deliveries — the frontend cannot
  // influence these fields, but a tampered gateway payload must not pass.
  if (event.kind === "PAID") {
    if (event.amount != null && event.amount !== REGISTRATION_FEE_PAISE) {
      throw new AppError("Invalid payment amount.", 400);
    }
    if (event.currency && event.currency.toUpperCase() !== PAYMENT_CURRENCY) {
      throw new AppError("Invalid payment currency.", 400);
    }
  }

  const now = new Date();
  const meta = {
    paymentGateway: PAYMENT_GATEWAY,
    gatewayVersion: RAZORPAY_SDK_VERSION,
    gatewayResponse: event.gatewayResponse ?? null,
    processingSource: source,
  };

  // --- Idempotent no-op for a repeat of the same terminal state -------------
  if (target && current === target) {
    paymentDebug("completePayment: idempotent no-op (already at target state)", {
      applicationId,
      paymentStatus: current,
      changed: false,
    });
    return { application, changed: false, paymentStatus: current };
  }

  // --- Validate the transition ----------------------------------------------
  if (target && !ALLOWED_PAYMENT_TRANSITIONS[current].includes(target)) {
    paymentDebugError(
      "completePayment: invalid transition rejected",
      new AppError(`Invalid payment transition: ${current} -> ${target}.`, 409),
      { applicationId, current, target }
    );
    throw new AppError(
      `Invalid payment transition: ${current} -> ${target}.`,
      409
    );
  }

  // --- Build the atomic write ------------------------------------------------
  const set: Record<string, unknown> = { paymentMeta: meta };
  const fromStates: PaymentStatus[] = target ? predecessorsOf(target) : ["PAID"];

  // FAILED only records status + reason — never mutates payment/order identity,
  // amount, currency, or reference (client-reported or webhook-delivered).
  if (event.kind !== "FAILED") {
    if (event.razorpayOrderId) set.razorpayOrderId = event.razorpayOrderId;
    if (event.razorpayPaymentId) set.razorpayPaymentId = event.razorpayPaymentId;
    if (event.paymentMethod) set.paymentMethod = event.paymentMethod;
    if (event.amount != null) set.paymentAmount = event.amount;
    if (event.currency) set.paymentCurrency = event.currency;
  }

  switch (event.kind) {
    case "AUTHORIZED":
      set.paymentStatus = "AUTHORIZED";
      set.authorizedAt = now;
      break;
    case "PAID":
      set.paymentStatus = "PAID";
      set.status = "SUBMITTED";
      set.submittedAt = application.submittedAt ?? now;
      set.paymentVerified = true;
      set.paidAt = now;
      set.paymentFailureReason = null;
      if (event.razorpayPaymentId) set.paymentReference = event.razorpayPaymentId;
      break;
    case "FAILED":
      set.paymentStatus = "FAILED";
      if (event.failureReason) set.paymentFailureReason = event.failureReason;
      break;
    case "REFUNDED":
      set.paymentStatus = "REFUNDED";
      set.refundedAt = now;
      if (event.refundId) set.refundId = event.refundId;
      break;
    case "REFUND_CREATED":
      if (event.refundId) set.refundId = event.refundId;
      break;
    case "REFUND_FAILED":
      break;
  }

  const eventTypes: PaymentEventType[] = [
    ...(options.extraEvents ?? []),
    ...primaryHistoryFor(event.kind),
  ];
  const events: IPaymentEvent[] = eventTypes.map((type) => ({
    type,
    source,
    details: {
      razorpayOrderId: event.razorpayOrderId ?? application.razorpayOrderId,
      razorpayPaymentId: event.razorpayPaymentId ?? null,
      refundId: event.refundId ?? null,
      failureReason: event.failureReason ?? null,
    },
    timestamp: now,
  }));

  const updated = await transitionPayment(applicationId, {
    fromStates,
    set,
    events,
    ...(options.incrementAttempt ? { incrementAttempt: true } : {}),
  });

  // Lost the race / already transitioned: re-read and report as idempotent.
  if (!updated) {
    const fresh = (await findApplicationById(applicationId)) ?? application;
    paymentDebug("completePayment: transition lost race / already applied", {
      applicationId,
      changed: false,
      paymentStatus: fresh.paymentStatus,
      applicationStatus: fresh.status,
    });
    return { application: fresh, changed: false, paymentStatus: fresh.paymentStatus };
  }

  paymentDebug("completePayment: transition succeeded", {
    applicationId,
    changed: true,
    paymentStatus: updated.paymentStatus,
    applicationStatus: updated.status,
    timelineEvents: eventTypes,
    willEmitAuditLog: true,
  });

  emitCompletionAudit(event.kind, source, applicationId, actor, {
    razorpayPaymentId: event.razorpayPaymentId ?? null,
    razorpayOrderId: event.razorpayOrderId ?? updated.razorpayOrderId,
    refundId: event.refundId ?? null,
  });

  // Official registration: promote the farmer to GRAM_SAHAKARI exactly once,
  // when payment completion flips the application to SUBMITTED.
  if (event.kind === "PAID" && updated.status === "SUBMITTED") {
    paymentDebug("completePayment: role promotion to GRAM_SAHAKARI", {
      applicationId,
      userId: String(updated.userId),
    });
    await AuthUser.findByIdAndUpdate(updated.userId, { role: "GRAM_SAHAKARI" });

    logApplicationAudit({
      action: "APPLICATION_SUBMITTED",
      applicationId,
      actorUserId: actor.userId,
      actorRole: actor.role,
      details: { via: source, paymentStatus: "PAID" },
    });

    logApplicationAudit({
      action: "ROLE_CHANGED",
      applicationId,
      actorUserId: actor.userId,
      actorRole: actor.role,
      details: {
        userId: String(updated.userId),
        from: "FARMER",
        to: "GRAM_SAHAKARI",
      },
    });
  }

  return { application: updated, changed: true, paymentStatus: updated.paymentStatus };
};

const emitCompletionAudit = (
  kind: NormalizedPaymentEvent["kind"],
  source: ProcessingSource,
  applicationId: string,
  actor: { userId: string; role: string },
  details: Record<string, unknown>
): void => {
  const base = {
    applicationId,
    actorUserId: actor.userId,
    actorRole: actor.role,
    details,
  };

  if (kind === "PAID") {
    logAuditEvent({ action: "PAYMENT_SUCCESS", ...base });
    if (source === "VERIFY") {
      logAuditEvent({ action: "PAYMENT_COMPLETED_FROM_VERIFY", ...base });
    } else if (source === "WEBHOOK") {
      logAuditEvent({ action: "PAYMENT_COMPLETED_FROM_WEBHOOK", ...base });
    }
    return;
  }
  if (kind === "AUTHORIZED") {
    logAuditEvent({ action: "PAYMENT_VERIFIED", ...base });
    return;
  }
  if (kind === "FAILED") {
    logAuditEvent({ action: "PAYMENT_FAILED", ...base });
    return;
  }
  if (kind === "REFUNDED") {
    logAuditEvent({ action: "PAYMENT_REFUNDED", ...base });
  }
};
