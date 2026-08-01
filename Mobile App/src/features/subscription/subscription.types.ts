/** Subscription DTOs mirroring backend `/api/v1/subscription` + `/auth/me`. */

export type SubscriptionStatus =
  | 'CREATED'
  | 'AUTHENTICATED'
  | 'ACTIVE'
  | 'PENDING'
  | 'HALTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'PAUSED';

export type MeSubscription = {
  isActive: boolean;
  status: SubscriptionStatus | string | null;
  currentPeriodEnd: string | null;
  subscriptionId: string | null;
};

export type CreateSubscriptionResponse = {
  subscriptionId: string;
  planId: string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  key: string;
  shortUrl: string | null;
};

export type SubscriptionDTO = {
  id: string;
  userId: string;
  planId: string;
  subscriptionId: string | null;
  customerId: string | null;
  status: SubscriptionStatus;
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
};

export type VerifySubscriptionBody = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

export type VerifySubscriptionResponse = {
  subscription: SubscriptionDTO;
  paymentId: string;
};

export type SubscriptionStatusDTO = {
  isActive: boolean;
  status: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
  subscriptionId: string | null;
};

export type PaymentPhase =
  | 'idle'
  | 'creating'
  | 'checkout'
  | 'verifying'
  | 'refreshing'
  | 'failed'
  | 'success';
