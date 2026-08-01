import type { IUserSubscription } from "../interfaces/subscription.interface";
import type { ISubscriptionEvent } from "../interfaces/subscription.interface";
import type {
  SubscriptionProcessingSource,
  SubscriptionStatus,
} from "../types/subscription.types";
import {
  findById,
  updateSubscriptionById,
} from "../repository/subscription.repository";
import type { RazorpaySubscriptionSnapshot } from "./razorpay-subscription.service";
import { RAZORPAY_SDK_VERSION } from "../../payment/service/razorpay.service";

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
  gatewayResponse?: Record<string, unknown>;
  extraSet?: Record<string, unknown>;
}

/**
 * Single writer for subscription state derived from Razorpay snapshots.
 * Used by verify, webhook, and reconciliation so logic is never duplicated.
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
    gatewayResponse,
    extraSet,
  } = options;

  const mapped = mapRazorpayStatus(snapshot.status) ?? local.status;
  const now = new Date();

  const set: Record<string, unknown> = {
    status: mapped,
    planId: snapshot.planId ?? local.planId,
    customerId: snapshot.customerId ?? local.customerId,
    totalCount: snapshot.totalCount ?? local.totalCount,
    paidCount: snapshot.paidCount ?? local.paidCount,
    quantity: snapshot.quantity ?? local.quantity,
    currentPeriodStart:
      unixToDate(snapshot.currentStart) ?? local.currentPeriodStart,
    currentPeriodEnd: unixToDate(snapshot.currentEnd) ?? local.currentPeriodEnd,
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

  const updated = await updateSubscriptionById(String(local._id), set, [event]);
  if (!updated) {
    const fresh = await findById(String(local._id));
    return fresh ?? local;
  }
  return updated;
};
