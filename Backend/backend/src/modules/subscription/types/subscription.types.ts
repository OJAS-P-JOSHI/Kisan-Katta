import type {
  SUBSCRIPTION_AUDIT_ACTIONS,
  SUBSCRIPTION_STATUSES,
} from "../subscription.constants";

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export type SubscriptionAuditAction = (typeof SUBSCRIPTION_AUDIT_ACTIONS)[number];

/** Body for POST /subscription/verify (Razorpay Subscriptions Checkout). */
export interface VerifySubscriptionBody {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

export interface CancelSubscriptionBody {
  /** When true, cancel at cycle end; when false, cancel immediately. Default true. */
  cancelAtCycleEnd?: boolean;
}

export type SubscriptionProcessingSource =
  | "VERIFY"
  | "WEBHOOK"
  | "RECONCILIATION"
  | "API";
