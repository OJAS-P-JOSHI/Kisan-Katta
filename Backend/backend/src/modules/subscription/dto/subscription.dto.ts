import type { IBillingPayment } from "../interfaces/subscription.interface";
import type { IUserSubscription } from "../interfaces/subscription.interface";
import {
  SUBSCRIPTION_BILLING_FREQUENCY_LABEL,
  SUBSCRIPTION_FEE_RUPEES,
  SUBSCRIPTION_PLAN_DISPLAY_NAME,
} from "../subscription.constants";
import { hasSubscriptionAccess } from "../utils/access";
import type { SubscriptionStatus } from "../types/subscription.types";

export interface SubscriptionDTO {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  billingFrequency: string;
  subscriptionId: string | null;
  customerId: string | null;
  status: SubscriptionStatus;
  /** True when the user may enter the mobile app Home stack. */
  isActive: boolean;
  /** True when Razorpay will continue charging next cycle. */
  autoRenewalEnabled: boolean;
  amount: number;
  amountRupees: number;
  currency: string;
  quantity: number;
  totalCount: number;
  paidCount: number;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  nextChargeAt: string | null;
  paymentMethod: string | null;
  latestPaymentId: string | null;
  cancelledAt: string | null;
  cancelAtCycleEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Returned by POST /subscription/create. */
export interface CreateSubscriptionResponseDTO {
  subscriptionId: string;
  planId: string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  /** Public Razorpay key for Checkout. */
  key: string;
  shortUrl: string | null;
}

export interface VerifySubscriptionResponseDTO {
  subscription: SubscriptionDTO;
  paymentId: string;
}

export interface SubscriptionStatusDTO {
  isActive: boolean;
  status: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
  subscriptionId: string | null;
}

export interface BillingPaymentDTO {
  paymentId: string;
  invoiceId: string | null;
  amount: number;
  amountRupees: number;
  currency: string;
  status: IBillingPayment["status"];
  paymentMethod: string | null;
  paidAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  gateway: string;
  subscriptionId: string | null;
}

const toIso = (value: Date | null | undefined): string | null =>
  value ? value.toISOString() : null;

const isAutoRenewalEnabled = (doc: IUserSubscription): boolean => {
  if (!hasSubscriptionAccess(doc)) return false;
  if (doc.status === "CANCELLED" || doc.status === "COMPLETED") return false;
  if (doc.cancelledAt) return false;
  if (doc.cancelAtCycleEnd) return false;
  return doc.status === "ACTIVE" || doc.status === "AUTHENTICATED";
};

export const toBillingPaymentDTO = (
  payment: IBillingPayment
): BillingPaymentDTO => ({
  paymentId: payment.paymentId,
  invoiceId: payment.invoiceId,
  amount: payment.amount,
  amountRupees: payment.amount / 100,
  currency: payment.currency,
  status: payment.status,
  paymentMethod: payment.paymentMethod,
  paidAt: payment.paidAt.toISOString(),
  periodStart: toIso(payment.periodStart),
  periodEnd: toIso(payment.periodEnd),
  gateway: payment.gateway,
  subscriptionId: payment.subscriptionId,
});

export const toSubscriptionDTO = (
  doc: IUserSubscription
): SubscriptionDTO => ({
  id: String(doc._id),
  userId: String(doc.userId),
  planId: doc.planId,
  planName: SUBSCRIPTION_PLAN_DISPLAY_NAME,
  billingFrequency: SUBSCRIPTION_BILLING_FREQUENCY_LABEL,
  subscriptionId: doc.subscriptionId,
  customerId: doc.customerId,
  status: doc.status,
  isActive: hasSubscriptionAccess(doc),
  autoRenewalEnabled: isAutoRenewalEnabled(doc),
  amount: doc.amount,
  amountRupees: doc.amount / 100 || SUBSCRIPTION_FEE_RUPEES,
  currency: doc.currency,
  quantity: doc.quantity,
  totalCount: doc.totalCount,
  paidCount: doc.paidCount,
  currentPeriodStart: toIso(doc.currentPeriodStart),
  currentPeriodEnd: toIso(doc.currentPeriodEnd),
  nextChargeAt: toIso(doc.nextChargeAt),
  paymentMethod: doc.paymentMethod,
  latestPaymentId: doc.latestPaymentId,
  cancelledAt: toIso(doc.cancelledAt),
  cancelAtCycleEnd: doc.cancelAtCycleEnd,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

export const toSubscriptionStatusDTO = (
  doc: IUserSubscription | null
): SubscriptionStatusDTO => {
  if (!doc) {
    return {
      isActive: false,
      status: null,
      currentPeriodEnd: null,
      subscriptionId: null,
    };
  }
  return {
    isActive: hasSubscriptionAccess(doc),
    status: doc.status,
    currentPeriodEnd: toIso(doc.currentPeriodEnd),
    subscriptionId: doc.subscriptionId,
  };
};
