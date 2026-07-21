import type { Types } from "mongoose";
import type {
  EventDeliverySource,
  EventProcessingResult,
  PaymentAuditAction,
  PaymentEventType,
  ProcessingSource,
} from "../types/payment.types";

export interface IPaymentAuditLogEntry {
  action: PaymentAuditAction;
  applicationId: string;
  actorUserId: string;
  actorRole: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

/** A single entry in the application's payment timeline (support/debugging). */
export interface IPaymentEvent {
  type: PaymentEventType;
  source: ProcessingSource;
  details?: Record<string, unknown>;
  timestamp: Date;
}

/** Payment metadata stored on the application. */
export interface IPaymentMeta {
  paymentGateway?: string;
  gatewayVersion?: string;
  gatewayResponse?: Record<string, unknown> | null;
  processingSource?: ProcessingSource | null;
}

/** Persisted Razorpay event used for exactly-once processing. */
export interface IRazorpayEvent {
  _id?: Types.ObjectId;
  razorpayEventId: string;
  eventType: string;
  deliverySource: EventDeliverySource;
  processingResult: EventProcessingResult;
  applicationId?: Types.ObjectId | null;
  receivedAt: Date;
  processedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
