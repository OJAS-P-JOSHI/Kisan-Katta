import type {
  ApplicationStatus,
  PaymentStatus,
} from "../../gram-sahakari/types/application.types";
import type { IGramSahakariApplication } from "../../gram-sahakari/interfaces/application.interface";
import type {
  PaymentEventType,
  ProcessingSource,
} from "../types/payment.types";

/** Returned by POST /application/payment/create-order. */
export interface CreateOrderResponseDTO {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  applicationNumber: string;
}

/** Returned by POST /application/payment/verify. */
export interface VerifyPaymentResponseDTO {
  applicationNumber: string;
  status: ApplicationStatus;
  paymentStatus: PaymentStatus;
  paymentVerified: boolean;
  razorpayPaymentId: string | null;
  paidAt: string | null;
}

/** Returned by POST /application/payment/failure. */
export interface PaymentFailureResponseDTO {
  applicationNumber: string;
  status: ApplicationStatus;
  paymentStatus: PaymentStatus;
  paymentAttemptCount: number;
  paymentFailureReason: string | null;
}

export interface PaymentEventDTO {
  type: PaymentEventType;
  source: ProcessingSource;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface PaymentMetaDTO {
  paymentGateway: string | null;
  gatewayVersion: string | null;
  processingSource: ProcessingSource | null;
}

/** Returned by GET /application/payment/details. */
export interface PaymentDetailsDTO {
  applicationNumber: string;
  status: ApplicationStatus;
  paymentStatus: PaymentStatus;
  paymentVerified: boolean;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  paymentReference: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  paymentMethod: string | null;
  paymentFailureReason: string | null;
  paymentAttemptCount: number;
  paidAt: string | null;
  authorizedAt: string | null;
  refundedAt: string | null;
  refundId: string | null;
  events: PaymentEventDTO[];
  meta: PaymentMetaDTO;
}

/** Returned by GET /application/payment/reconcile/:applicationId (admin). */
export interface ReconciliationResultDTO {
  applicationId: string;
  applicationNumber: string;
  repaired: boolean;
  previousStatus: PaymentStatus;
  currentStatus: PaymentStatus;
  gatewayStatus: string | null;
  detail: string;
}

/** Returned by the webhook route (ack only — no sensitive data). */
export interface WebhookAckDTO {
  received: true;
  status: string;
}

const toIsoString = (value: Date | null | undefined): string | null =>
  value ? value.toISOString() : null;

export const toPaymentDetailsDTO = (
  application: IGramSahakariApplication
): PaymentDetailsDTO => ({
  applicationNumber: application.applicationNumber,
  status: application.status,
  paymentStatus: application.paymentStatus,
  paymentVerified: application.paymentVerified,
  paymentAmount: application.paymentAmount,
  paymentCurrency: application.paymentCurrency,
  paymentReference: application.paymentReference,
  razorpayOrderId: application.razorpayOrderId,
  razorpayPaymentId: application.razorpayPaymentId,
  paymentMethod: application.paymentMethod,
  paymentFailureReason: application.paymentFailureReason,
  paymentAttemptCount: application.paymentAttemptCount,
  paidAt: toIsoString(application.paidAt),
  authorizedAt: toIsoString(application.authorizedAt),
  refundedAt: toIsoString(application.refundedAt),
  refundId: application.refundId,
  events: (application.paymentEvents ?? []).map((event) => ({
    type: event.type,
    source: event.source,
    details: event.details ?? {},
    timestamp: event.timestamp.toISOString(),
  })),
  meta: {
    paymentGateway: application.paymentMeta?.paymentGateway ?? null,
    gatewayVersion: application.paymentMeta?.gatewayVersion ?? null,
    processingSource: application.paymentMeta?.processingSource ?? null,
  },
});

export const toVerifyPaymentResponseDTO = (
  application: IGramSahakariApplication
): VerifyPaymentResponseDTO => ({
  applicationNumber: application.applicationNumber,
  status: application.status,
  paymentStatus: application.paymentStatus,
  paymentVerified: application.paymentVerified,
  razorpayPaymentId: application.razorpayPaymentId,
  paidAt: toIsoString(application.paidAt),
});

export const toPaymentFailureResponseDTO = (
  application: IGramSahakariApplication
): PaymentFailureResponseDTO => ({
  applicationNumber: application.applicationNumber,
  status: application.status,
  paymentStatus: application.paymentStatus,
  paymentAttemptCount: application.paymentAttemptCount,
  paymentFailureReason: application.paymentFailureReason,
});
