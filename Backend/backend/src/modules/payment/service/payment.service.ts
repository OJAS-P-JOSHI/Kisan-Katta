import { AppError } from "../../../utils/AppError";
import { getRazorpayKeyId } from "../../../config/razorpay";
import type { UserRole } from "../../auth/auth.constants";
import type { IGramSahakariApplication } from "../../gram-sahakari/interfaces/application.interface";
import type { IPaymentEvent } from "../interfaces/payment.interface";
import { assertSubmitReady } from "../../gram-sahakari/validation/application.validation";
import {
  PAYMENT_CURRENCY,
  REGISTRATION_FEE_PAISE,
} from "../payment.constants";
import {
  attachOrderToApplication,
  findApplicationByUserId,
} from "../repository/payment.repository";
import { claimEvent, completeEvent } from "../repository/event.repository";
import {
  createRazorpayOrder,
  fetchPaymentMethod,
  verifyPaymentSignature,
} from "./razorpay.service";
import { completePayment } from "./finalize.service";
import { logAuditEvent } from "./audit.service";
import type {
  CreateOrderResponseDTO,
  PaymentDetailsDTO,
  PaymentFailureResponseDTO,
  VerifyPaymentResponseDTO,
} from "../dto/payment.dto";
import {
  toPaymentDetailsDTO,
  toPaymentFailureResponseDTO,
  toVerifyPaymentResponseDTO,
} from "../dto/payment.dto";
import type {
  PaymentFailureBody,
  VerifyPaymentBody,
} from "../types/payment.types";
import { paymentDebug, paymentDebugError } from "../payment-debug";

/**
 * Loads the authenticated farmer's application or throws 404. Payments are
 * always scoped to `req.user`, so a user can only ever act on their own
 * application — an attacker cannot target someone else's by id.
 */
const getOwnApplicationOrThrow = async (
  userId: string
): Promise<IGramSahakariApplication> => {
  const application = await findApplicationByUserId(userId);
  if (!application) {
    throw new AppError("Application not found. Start an application first.", 404);
  }
  return application;
};

// ---------------------------------------------------------------------------
// Create order
// ---------------------------------------------------------------------------

export const createPaymentOrder = async (
  userId: string,
  actorRole: UserRole
): Promise<CreateOrderResponseDTO> => {
  const application = await getOwnApplicationOrThrow(userId);
  const applicationId = String(application._id);

  paymentDebug("Create Order: request received", {
    applicationId,
    applicationNumber: application.applicationNumber,
    currentPaymentStatus: application.paymentStatus,
    currentApplicationStatus: application.status,
    existingOrderId: application.razorpayOrderId,
    actorUserId: userId,
    actorRole,
  });

  if (
    application.paymentStatus === "PAID" ||
    application.paymentStatus === "REFUNDED" ||
    application.paymentVerified
  ) {
    throw new AppError("Payment has already been completed for this application.", 409);
  }

  if (application.status === "SUBMITTED") {
    throw new AppError("This application has already been submitted.", 409);
  }

  if (application.status !== "PAYMENT_PENDING") {
    throw new AppError(
      "Payment can only be initiated after the application is submitted for payment.",
      409
    );
  }

  if (
    application.paymentStatus !== "PENDING" &&
    application.paymentStatus !== "FAILED" &&
    application.paymentStatus !== "AUTHORIZED"
  ) {
    throw new AppError(
      "Application is not awaiting payment.",
      409
    );
  }

  // Completeness was validated at submit; re-check defensively before charging.
  assertSubmitReady(application);

  // Idempotency: reuse an existing open order (double-click, refresh, AUTHORIZED).
  if (
    application.razorpayOrderId &&
    (application.paymentStatus === "PENDING" ||
      application.paymentStatus === "AUTHORIZED")
  ) {
    const response = {
      orderId: application.razorpayOrderId,
      amount: application.paymentAmount ?? REGISTRATION_FEE_PAISE,
      currency: application.paymentCurrency ?? PAYMENT_CURRENCY,
      key: getRazorpayKeyId(),
      applicationNumber: application.applicationNumber,
    };
    paymentDebug("Create Order: reusing existing order", {
      applicationId,
      newOrderCreated: false,
      response,
    });
    return response;
  }

  const order = await createRazorpayOrder({
    amount: REGISTRATION_FEE_PAISE,
    currency: PAYMENT_CURRENCY,
    receipt: application.applicationNumber,
    notes: {
      applicationId,
      applicationNumber: application.applicationNumber,
      userId,
    },
  });

  const orderCreatedEvent: IPaymentEvent = {
    type: "ORDER_CREATED",
    source: "VERIFY",
    details: { razorpayOrderId: order.id, amount: order.amount, currency: order.currency },
    timestamp: new Date(),
  };

  const updated = await attachOrderToApplication(
    applicationId,
    {
      razorpayOrderId: order.id,
      paymentAmount: order.amount,
      paymentCurrency: order.currency,
    },
    orderCreatedEvent
  );

  if (!updated) {
    throw new AppError(
      "Application state changed. Please refresh and try again.",
      409
    );
  }

  logAuditEvent({
    action: "PAYMENT_ORDER_CREATED",
    applicationId,
    actorUserId: userId,
    actorRole,
    details: {
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
    },
  });

  const response = {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: getRazorpayKeyId(),
    applicationNumber: application.applicationNumber,
  };
  paymentDebug("Create Order: new order created", {
    applicationId,
    newOrderCreated: true,
    razorpayOrderId: order.id,
    response,
  });
  return response;
};

// ---------------------------------------------------------------------------
// Verify payment (frontend Checkout callback) — idempotent
// ---------------------------------------------------------------------------

export const verifyPayment = async (
  userId: string,
  body: VerifyPaymentBody,
  actorRole: UserRole
): Promise<VerifyPaymentResponseDTO> => {
  paymentDebug("Verify: request received", {
    incomingBody: body,
    authenticatedUserId: userId,
    actorRole,
  });

  const application = await getOwnApplicationOrThrow(userId);
  const applicationId = String(application._id);

  paymentDebug("Verify: application found", {
    applicationId,
    applicationNumber: application.applicationNumber,
    paymentStatus: application.paymentStatus,
    applicationStatus: application.status,
    razorpayOrderId: application.razorpayOrderId,
    paymentVerified: application.paymentVerified,
  });

  // Idempotency guard for the webhook-vs-verify race. If the payment is already
  // finalized — by a winning webhook, by reconciliation, or by a prior verify —
  // report the current (PAID/SUBMITTED) state as success. We deliberately return
  // BEFORE calling completePayment(), so no audit logs, timeline events, or event
  // ledger entries are duplicated. This is what turns the old 403 into a 200.
  if (application.paymentStatus === "PAID" || application.paymentVerified) {
    paymentDebug("Verify: already PAID — idempotent early return", {
      applicationId,
      paymentStatus: application.paymentStatus,
    });
    return toVerifyPaymentResponseDTO(application);
  }

  if (!application.razorpayOrderId) {
    throw new AppError("No payment order found. Create an order first.", 400);
  }

  // The order id in the callback MUST match the one we issued (blocks replaying
  // another application's/user's order against this account).
  if (body.razorpay_order_id !== application.razorpayOrderId) {
    logAuditEvent({
      action: "PAYMENT_FAILED",
      applicationId,
      actorUserId: userId,
      actorRole,
      details: { reason: "order_id_mismatch" },
    });
    throw new AppError("Payment order does not match this application.", 400);
  }

  // Amount tamper guard: the stored amount must be the server-defined fee.
  if (
    application.paymentAmount !== null &&
    application.paymentAmount !== REGISTRATION_FEE_PAISE
  ) {
    throw new AppError("Invalid payment amount for this application.", 400);
  }

  // Signature verification — the single source of truth for "did they pay".
  const isValid = verifyPaymentSignature({
    razorpay_order_id: body.razorpay_order_id,
    razorpay_payment_id: body.razorpay_payment_id,
    razorpay_signature: body.razorpay_signature,
  });

  paymentDebug("Verify: signature verification result", {
    applicationId,
    signatureValid: isValid,
    razorpayOrderId: body.razorpay_order_id,
    razorpayPaymentId: body.razorpay_payment_id,
  });

  if (!isValid) {
    logAuditEvent({
      action: "PAYMENT_FAILED",
      applicationId,
      actorUserId: userId,
      actorRole,
      details: {
        reason: "invalid_signature",
        razorpayPaymentId: body.razorpay_payment_id,
      },
    });
    // Do NOT touch the database on a failed verification.
    throw new AppError("Payment signature verification failed.", 400);
  }

  const eventId = `verify_${body.razorpay_order_id}_${body.razorpay_payment_id}`;
  const claim = await claimEvent(eventId, "verify", "VERIFY");
  paymentDebug("Verify: event ledger claim", {
    eventId,
    duplicate: claim.duplicate,
    claimed: claim.claimed,
    existingProcessingResult: claim.existing?.processingResult ?? null,
  });
  if (claim.duplicate) {
    const fresh = await getOwnApplicationOrThrow(userId);
    // Already settled — idempotent success.
    if (fresh.paymentStatus === "PAID" || fresh.paymentVerified) {
      return toVerifyPaymentResponseDTO(fresh);
    }
    // Prior delivery finished without changing payment state (e.g. ignored).
    if (claim.existing?.processingResult === "PROCESSED") {
      return toVerifyPaymentResponseDTO(fresh);
    }
    // PROCESSING (crash mid-flight) or FAILED: fall through and retry
    // completePayment, which is idempotent and guarded atomically.
  }

  const paymentMethod = await fetchPaymentMethod(body.razorpay_payment_id);

  paymentDebug("Verify: payment fetched from Razorpay (method lookup)", {
    applicationId,
    razorpayPaymentId: body.razorpay_payment_id,
    paymentMethod,
    amount: application.paymentAmount ?? REGISTRATION_FEE_PAISE,
    currency: application.paymentCurrency ?? PAYMENT_CURRENCY,
  });

  try {
    paymentDebug("Verify: calling completePayment", { applicationId, eventId });
    const result = await completePayment({
      application: claim.duplicate
        ? await getOwnApplicationOrThrow(userId)
        : application,
      event: {
        kind: "PAID",
        razorpayOrderId: body.razorpay_order_id,
        razorpayPaymentId: body.razorpay_payment_id,
        paymentMethod,
        amount: application.paymentAmount ?? REGISTRATION_FEE_PAISE,
        currency: application.paymentCurrency ?? PAYMENT_CURRENCY,
        gatewayResponse: { via: "verify" },
      },
      source: "VERIFY",
      actor: { userId, role: actorRole },
      extraEvents: ["VERIFY_REQUEST_RECEIVED", "VERIFY_SUCCESS"],
    });

    await completeEvent(eventId, "PROCESSED", applicationId);
    paymentDebug("Verify: completePayment returned", {
      applicationId,
      changed: result.changed,
      paymentStatus: result.paymentStatus,
      applicationStatus: result.application.status,
      paymentVerified: result.application.paymentVerified,
    });
    return toVerifyPaymentResponseDTO(result.application);
  } catch (error) {
    paymentDebugError("Verify: completePayment failed", error, { applicationId, eventId });
    await completeEvent(eventId, "FAILED", applicationId);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Record failure (frontend-reported)
// ---------------------------------------------------------------------------

export const recordPaymentFailure = async (
  userId: string,
  body: PaymentFailureBody,
  actorRole: UserRole
): Promise<PaymentFailureResponseDTO> => {
  paymentDebug("Payment failure: request received", {
    userId,
    actorRole,
    reason: body.reason,
  });

  const application = await getOwnApplicationOrThrow(userId);

  if (
    application.paymentStatus === "PAID" ||
    application.paymentStatus === "REFUNDED" ||
    application.paymentVerified
  ) {
    throw new AppError("Payment is already completed for this application.", 409);
  }

  if (!application.razorpayOrderId) {
    throw new AppError("No payment order found. Create an order first.", 400);
  }

  const result = await completePayment({
    application,
    event: {
      kind: "FAILED",
      failureReason: body.reason,
      gatewayResponse: { via: "verify_failure" },
    },
    source: "VERIFY",
    actor: { userId, role: actorRole },
    incrementAttempt: true,
  });

  return toPaymentFailureResponseDTO(result.application);
};

// ---------------------------------------------------------------------------
// Details
// ---------------------------------------------------------------------------

export const getPaymentDetails = async (
  userId: string
): Promise<PaymentDetailsDTO> => {
  const application = await getOwnApplicationOrThrow(userId);
  return toPaymentDetailsDTO(application);
};
