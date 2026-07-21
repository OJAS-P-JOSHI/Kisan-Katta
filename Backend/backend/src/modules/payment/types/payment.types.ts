import type {
  EVENT_DELIVERY_SOURCES,
  EVENT_PROCESSING_RESULTS,
  PAYMENT_AUDIT_ACTIONS,
  PAYMENT_EVENT_TYPES,
  PROCESSING_SOURCES,
} from "../payment.constants";

export type PaymentAuditAction = (typeof PAYMENT_AUDIT_ACTIONS)[number];
export type PaymentEventType = (typeof PAYMENT_EVENT_TYPES)[number];
export type ProcessingSource = (typeof PROCESSING_SOURCES)[number];
export type EventDeliverySource = (typeof EVENT_DELIVERY_SOURCES)[number];
export type EventProcessingResult = (typeof EVENT_PROCESSING_RESULTS)[number];

/** Body for POST /application/payment/verify (Razorpay Checkout callback). */
export interface VerifyPaymentBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Body for POST /application/payment/failure. Identity is never accepted from the client. */
export interface PaymentFailureBody {
  reason: string;
}

/**
 * Normalised description of a payment lifecycle change, consumed by the single
 * `completePayment` finalization service regardless of where it originated
 * (frontend verify, webhook, or reconciliation).
 */
export type PaymentEventKind =
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUND_CREATED"
  | "REFUNDED"
  | "REFUND_FAILED";

export interface NormalizedPaymentEvent {
  kind: PaymentEventKind;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  paymentMethod?: string | null;
  amount?: number | null;
  currency?: string | null;
  refundId?: string | null;
  failureReason?: string | null;
  gatewayResponse?: Record<string, unknown>;
}
