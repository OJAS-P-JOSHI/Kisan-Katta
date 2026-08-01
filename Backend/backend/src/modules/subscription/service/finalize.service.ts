import type { IUserSubscription } from "../interfaces/subscription.interface";
import type { ISubscriptionEvent } from "../interfaces/subscription.interface";
import type {
  SubscriptionProcessingSource,
  SubscriptionStatus,
} from "../types/subscription.types";
import {
  findById,
  updateSubscriptionById,
  upsertBillingPayment,
} from "../repository/subscription.repository";
import type { RazorpaySubscriptionSnapshot } from "./razorpay-subscription.service";
import { RAZORPAY_SDK_VERSION } from "../../payment/service/razorpay.service";
import {
  SUBSCRIPTION_CURRENCY,
  SUBSCRIPTION_FEE_PAISE,
} from "../subscription.constants";

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  created: "CREATED",
  authenticated: "AUTHENTICATED",
  active: "ACTIVE",
  pending: "PENDING",
  halted: "HALTED",
  cancelled: "CANCELLED",
  completed: "COMPLETED",
  expired: "EXPIRED",
  paused: "PAUSED",
};

export const mapRazorpayStatus = (
  status: string | null | undefined
): SubscriptionStatus | null => {
  if (!status) return null;
  return STATUS_MAP[status.toLowerCase()] ?? null;
};

const unixToDate = (unix: number | null | undefined): Date | null => {
  if (unix == null || !Number.isFinite(unix) || unix <= 0) return null;
  return new Date(unix * 1000);
};

export interface ApplyGatewaySnapshotOptions {
  local: IUserSubscription;
  snapshot: RazorpaySubscriptionSnapshot;
  source: SubscriptionProcessingSource;
  eventType: string;
  paymentId?: string | null;
  paymentMethod?: string | null;
  invoiceId?: string | null;
  gatewayResponse?: Record<string, unknown>;
  extraSet?: Record<string, unknown>;
}

/**
 * Single writer for subscription state derived from Razorpay snapshots.
 * Used by verify, webhook, and reconciliation so logic is never duplicated.
 * Also upserts billing history when a payment id is present.
 */
export const applyGatewaySnapshot = async (
  options: ApplyGatewaySnapshotOptions
): Promise<IUserSubscription> => {
  const {
    local,
    snapshot,
    source,
    eventType,
    paymentId,
    paymentMethod,
    invoiceId,
    gatewayResponse,
    extraSet,
  } = options;

  const mapped = mapRazorpayStatus(snapshot.status) ?? local.status;
  const now = new Date();
  const periodStart =
    unixToDate(snapshot.currentStart) ?? local.currentPeriodStart;
  const periodEnd = unixToDate(snapshot.currentEnd) ?? local.currentPeriodEnd;

  const set: Record<string, unknown> = {
    status: mapped,
    planId: snapshot.planId ?? local.planId,
    customerId: snapshot.customerId ?? local.customerId,
    totalCount: snapshot.totalCount ?? local.totalCount,
    paidCount: snapshot.paidCount ?? local.paidCount,
    quantity: snapshot.quantity ?? local.quantity,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    nextChargeAt: unixToDate(snapshot.chargeAt) ?? local.nextChargeAt,
    shortUrl: snapshot.shortUrl ?? local.shortUrl,
    meta: {
      paymentGateway: "RAZORPAY",
      gatewayVersion: RAZORPAY_SDK_VERSION,
      gatewayResponse: gatewayResponse ?? snapshot.raw,
      processingSource: source,
    },
    ...(extraSet ?? {}),
  };

  if (paymentId) set.latestPaymentId = paymentId;
  if (paymentMethod) set.paymentMethod = paymentMethod;
  if (mapped === "CANCELLED" && !local.cancelledAt) {
    set.cancelledAt = now;
  }

  const event: ISubscriptionEvent = {
    type: eventType,
    source,
    details: {
      razorpayStatus: snapshot.status,
      subscriptionId: snapshot.id,
      paymentId: paymentId ?? null,
      paidCount: snapshot.paidCount,
    },
    timestamp: now,
  };

  let updated = await updateSubscriptionById(String(local._id), set, [event]);
  if (!updated) {
    updated = (await findById(String(local._id))) ?? local;
  }

  // Persist billing history for successful / charged payments (idempotent).
  const shouldRecordBilling =
    Boolean(paymentId) &&
    (eventType === "SUBSCRIPTION_VERIFY_SUCCESS" ||
      eventType === "subscription.authenticated" ||
      eventType === "subscription.charged" ||
      eventType === "subscription.activated");

  if (shouldRecordBilling && paymentId) {
    const withBilling = await upsertBillingPayment(String(local._id), {
      paymentId,
      invoiceId: invoiceId ?? null,
      amount: local.amount || SUBSCRIPTION_FEE_PAISE,
      currency: local.currency || SUBSCRIPTION_CURRENCY,
      status: "PAID",
      paymentMethod: paymentMethod ?? local.paymentMethod,
      paidAt: now,
      periodStart,
      periodEnd,
      gateway: "RAZORPAY",
      subscriptionId: snapshot.id || local.subscriptionId,
    });
    if (withBilling) updated = withBilling;
  }

  return updated;
};
