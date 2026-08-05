/**
 * Mobile-app monthly subscription (Razorpay Subscriptions).
 * Plan is created in the Razorpay Dashboard; we never create plans via API.
 */

/** Plan amount in paise — must match the Dashboard plan (₹100). */
export const SUBSCRIPTION_FEE_PAISE = 10000;

export const SUBSCRIPTION_CURRENCY = "INR";

export const SUBSCRIPTION_FEE_RUPEES = SUBSCRIPTION_FEE_PAISE / 100;

/** Human-readable plan label for billing UI (Dashboard plan: App Payment). */
export const SUBSCRIPTION_PLAN_DISPLAY_NAME = "Kisan Katta Monthly";

export const SUBSCRIPTION_BILLING_FREQUENCY_LABEL = "Every 1 Month";

export const BILLING_PAYMENT_STATUSES = [
  "PAID",
  "FAILED",
  "PENDING",
  "REFUNDED",
] as const;

/** Billing cycles configured on the Dashboard plan (Every 1 Month × 120). */
export const SUBSCRIPTION_TOTAL_COUNT = 120;

export const SUBSCRIPTION_QUANTITY = 1;

/** Razorpay notes.purpose — distinguishes subscription orders from GS payments. */
export const SUBSCRIPTION_PURPOSE = "APP_SUBSCRIPTION";

/**
 * Local mirror of Razorpay subscription statuses.
 * @see https://razorpay.com/docs/payments/subscriptions/
 */
export const SUBSCRIPTION_STATUSES = [
  "CREATED",
  "AUTHENTICATED",
  "ACTIVE",
  "PENDING",
  "HALTED",
  "CANCELLED",
  "COMPLETED",
  "EXPIRED",
  "PAUSED",
] as const;

/** Webhook events we act on (Razorpay Subscriptions). */
export const SUPPORTED_SUBSCRIPTION_WEBHOOK_EVENTS = [
  "subscription.authenticated",
  "subscription.activated",
  "subscription.charged",
  "subscription.pending",
  "subscription.halted",
  "subscription.cancelled",
  "subscription.completed",
  "subscription.updated",
  "subscription.paused",
  "subscription.resumed",
] as const;

export const SUBSCRIPTION_AUDIT_ACTIONS = [
  "SUBSCRIPTION_CREATED",
  "SUBSCRIPTION_VERIFY_SUCCESS",
  "SUBSCRIPTION_VERIFY_FAILED",
  "SUBSCRIPTION_CANCELLED",
  "SUBSCRIPTION_RESUMED",
  "SUBSCRIPTION_REFRESHED",
  "SUBSCRIPTION_WEBHOOK_RECEIVED",
  "SUBSCRIPTION_WEBHOOK_REJECTED",
  "SUBSCRIPTION_RECONCILIATION_STARTED",
  "SUBSCRIPTION_RECONCILIATION_SUCCESS",
  "SUBSCRIPTION_RECONCILIATION_FAILED",
  "SUBSCRIPTION_REFUND_PLACEHOLDER",
  "SUBSCRIPTION_REFUND_REQUESTED",
  "SUBSCRIPTION_REFUND_PROCESSED",
  "SUBSCRIPTION_REFUND_FAILED",
  "SUBSCRIPTION_ACCESS_REVOKED",
  "SUBSCRIPTION_FREE_MONTH_GRANTED",
  "SUBSCRIPTION_ADMIN_SYNC",
] as const;

export const SUBSCRIPTION_RECONCILIATION_INTERVAL_MINUTES = 15;
export const SUBSCRIPTION_RECONCILIATION_BATCH_LIMIT = 100;

/**
 * Statuses that still need a Checkout authorisation (or a brand-new sub).
 * `created` = waiting for first payment; failed auth can leave it here.
 */
export const OPEN_CHECKOUT_STATUSES = ["CREATED"] as const;

/** Statuses where the user already has (or had) a live Razorpay subscription id. */
export const LIVING_SUBSCRIPTION_STATUSES = [
  "CREATED",
  "AUTHENTICATED",
  "ACTIVE",
  "PENDING",
  "HALTED",
  "PAUSED",
] as const;
