import type { IUserSubscription } from "../interfaces/subscription.interface";
import type { SubscriptionStatus } from "../types/subscription.types";
import { hasSubscriptionAccess } from "../utils/access";

export interface SubscriptionDTO {
  id: string;
  userId: string;
  planId: string;
  subscriptionId: string | null;
  customerId: string | null;
  status: SubscriptionStatus;
  /** True when the user may enter the mobile app Home stack. */
  isActive: boolean;
  amount: number;
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

const toIso = (value: Date | null | undefined): string | null =>
  value ? value.toISOString() : null;

export const toSubscriptionDTO = (
  doc: IUserSubscription
): SubscriptionDTO => ({
  id: String(doc._id),
  userId: String(doc.userId),
  planId: doc.planId,
  subscriptionId: doc.subscriptionId,
  customerId: doc.customerId,
  status: doc.status,
  isActive: hasSubscriptionAccess(doc),
  amount: doc.amount,
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
