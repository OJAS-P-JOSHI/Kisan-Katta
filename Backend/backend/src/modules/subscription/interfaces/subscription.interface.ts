import type { Types } from "mongoose";
import type {
  SubscriptionProcessingSource,
  SubscriptionStatus,
} from "../types/subscription.types";

export interface ISubscriptionEvent {
  type: string;
  source: SubscriptionProcessingSource;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface ISubscriptionMeta {
  paymentGateway?: string;
  gatewayVersion?: string;
  gatewayResponse?: Record<string, unknown> | null;
  processingSource?: SubscriptionProcessingSource | null;
}

/** One charged (or attempted) payment on a subscription — billing history. */
export interface IBillingPayment {
  paymentId: string;
  invoiceId: string | null;
  amount: number;
  currency: string;
  status: "PAID" | "FAILED" | "PENDING" | "REFUNDED";
  paymentMethod: string | null;
  paidAt: Date;
  periodStart: Date | null;
  periodEnd: Date | null;
  gateway: string;
  subscriptionId: string | null;
}

export interface IUserSubscription {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  planId: string;
  subscriptionId: string | null;
  customerId: string | null;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  quantity: number;
  totalCount: number;
  paidCount: number;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  nextChargeAt: Date | null;
  paymentMethod: string | null;
  latestPaymentId: string | null;
  cancelledAt: Date | null;
  cancelAtCycleEnd: boolean;
  shortUrl: string | null;
  notes: Record<string, unknown>;
  events: ISubscriptionEvent[];
  billingPayments: IBillingPayment[];
  meta: ISubscriptionMeta;
  createdAt: Date;
  updatedAt: Date;
}
