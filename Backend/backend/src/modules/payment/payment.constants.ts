import type { PaymentStatus } from "../gram-sahakari/types/application.types";

/**
 * Gram Sahakari registration fee, expressed in the smallest currency subunit
 * (paise) as required by the Razorpay Orders API. ₹500 => 50000 paise.
 *
 * The amount is defined ONLY here on the backend and is never accepted from the
 * client, so the frontend can never influence how much is charged or verified.
 */
export const REGISTRATION_FEE_PAISE = 50000;

/** ISO currency code for every registration payment. */
export const PAYMENT_CURRENCY = "INR";

/**
 * Human-readable rupee amount, derived from the paise value so the two can
 * never drift apart.
 */
export const REGISTRATION_FEE_RUPEES = REGISTRATION_FEE_PAISE / 100;

/** Razorpay caps `receipt` at 40 characters. */
export const RAZORPAY_RECEIPT_MAX_LENGTH = 40;

/** Payment gateway identifier stored in payment metadata. */
export const PAYMENT_GATEWAY = "RAZORPAY";

/**
 * How often the background reconciliation sweep runs. It is the safety net for
 * payments where neither the webhook nor the browser verify ever reached us
 * (webhook dropped, browser closed, network died): the sweep asks Razorpay for
 * the truth and completes the payment automatically.
 */
export const PAYMENT_RECONCILIATION_INTERVAL_MINUTES = 15;

/** Max applications reconciled per sweep, oldest-pending first. */
export const PAYMENT_RECONCILIATION_BATCH_LIMIT = 100;

// ---------------------------------------------------------------------------
// Payment state machine
// ---------------------------------------------------------------------------

/**
 * Allowed payment state transitions. Any transition not listed here is rejected
 * by the finalization service, e.g. FAILED -> AUTHORIZED can never happen.
 *
 * FAILED -> PENDING is permitted so a farmer can retry after a failed attempt
 * (a brand-new Razorpay order is created for the retry).
 */
export const ALLOWED_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  NOT_REQUIRED: ["PENDING"],
  PENDING: ["AUTHORIZED", "PAID", "FAILED"],
  AUTHORIZED: ["PAID", "FAILED"],
  PAID: ["REFUNDED"],
  FAILED: ["PENDING"],
  REFUNDED: [],
};

/** Terminal-ish states that indicate money has been collected. */
export const PAID_STATES: readonly PaymentStatus[] = ["PAID"];

// ---------------------------------------------------------------------------
// Payment event history (support / debugging timeline)
// ---------------------------------------------------------------------------

export const PAYMENT_EVENT_TYPES = [
  "ORDER_CREATED",
  "VERIFY_REQUEST_RECEIVED",
  "VERIFY_SUCCESS",
  "WEBHOOK_RECEIVED",
  "WEBHOOK_VERIFIED",
  "PAYMENT_AUTHORIZED",
  "PAYMENT_CAPTURED",
  "PAYMENT_FAILED",
  "REFUND_CREATED",
  "REFUND_PROCESSED",
  "REFUND_FAILED",
  "PAYMENT_COMPLETED",
  "RECONCILIATION_REPAIR",
] as const;

/** Where a completion/processing action originated. */
export const PROCESSING_SOURCES = ["VERIFY", "WEBHOOK", "RECONCILIATION"] as const;

// ---------------------------------------------------------------------------
// Razorpay event storage (deduplication)
// ---------------------------------------------------------------------------

/** How a Razorpay event reached us. */
export const EVENT_DELIVERY_SOURCES = ["WEBHOOK", "VERIFY"] as const;

/** Lifecycle result of processing a stored Razorpay event. */
export const EVENT_PROCESSING_RESULTS = [
  "PROCESSING",
  "PROCESSED",
  "IGNORED",
  "DUPLICATE",
  "FAILED",
] as const;

/**
 * The only Razorpay webhook events we act on. Any other event type is stored
 * and acknowledged with 200 but otherwise ignored.
 */
export const SUPPORTED_WEBHOOK_EVENTS = [
  "payment.authorized",
  "payment.captured",
  "payment.failed",
  "order.paid",
  "refund.created",
  "refund.processed",
  "refund.failed",
] as const;

// ---------------------------------------------------------------------------
// Audit actions
// ---------------------------------------------------------------------------

export const PAYMENT_AUDIT_ACTIONS = [
  "PAYMENT_ORDER_CREATED",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "PAYMENT_VERIFIED",
  "WEBHOOK_RECEIVED",
  "WEBHOOK_VERIFIED",
  "WEBHOOK_REJECTED",
  "RECONCILIATION_STARTED",
  "RECONCILIATION_SUCCESS",
  "RECONCILIATION_FAILED",
  "PAYMENT_COMPLETED_FROM_VERIFY",
  "PAYMENT_COMPLETED_FROM_WEBHOOK",
  "PAYMENT_REFUNDED",
] as const;
