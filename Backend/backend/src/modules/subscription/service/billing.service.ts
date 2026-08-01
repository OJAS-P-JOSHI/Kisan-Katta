import { AppError } from "../../../utils/AppError";
import type { IBillingPayment } from "../interfaces/subscription.interface";
import {
  SUBSCRIPTION_CURRENCY,
  SUBSCRIPTION_FEE_PAISE,
} from "../subscription.constants";
import {
  toBillingPaymentDTO,
  type BillingPaymentDTO,
} from "../dto/subscription.dto";
import { findLatestByUserId } from "../repository/subscription.repository";

/**
 * Builds billing history from the dedicated billingPayments array.
 * Falls back to reconstructing entries from timeline events for older docs
 * that were created before billingPayments existed.
 */
const collectBillingPayments = (
  doc: NonNullable<Awaited<ReturnType<typeof findLatestByUserId>>>
): IBillingPayment[] => {
  const stored = [...(doc.billingPayments ?? [])];
  if (stored.length > 0) {
    return stored.sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    );
  }

  // Legacy fallback: unique payment ids from events.
  const seen = new Set<string>();
  const derived: IBillingPayment[] = [];
  for (const event of [...(doc.events ?? [])].reverse()) {
    const paymentId =
      typeof event.details?.paymentId === "string"
        ? event.details.paymentId
        : null;
    if (!paymentId || seen.has(paymentId)) continue;
    seen.add(paymentId);
    derived.push({
      paymentId,
      invoiceId: null,
      amount: doc.amount || SUBSCRIPTION_FEE_PAISE,
      currency: doc.currency || SUBSCRIPTION_CURRENCY,
      status: "PAID",
      paymentMethod: doc.paymentMethod,
      paidAt: event.timestamp,
      periodStart: doc.currentPeriodStart,
      periodEnd: doc.currentPeriodEnd,
      gateway: "RAZORPAY",
      subscriptionId: doc.subscriptionId,
    });
  }

  // If we only have latestPaymentId and no events with ids, surface that one.
  if (derived.length === 0 && doc.latestPaymentId) {
    derived.push({
      paymentId: doc.latestPaymentId,
      invoiceId: null,
      amount: doc.amount || SUBSCRIPTION_FEE_PAISE,
      currency: doc.currency || SUBSCRIPTION_CURRENCY,
      status: "PAID",
      paymentMethod: doc.paymentMethod,
      paidAt: doc.updatedAt,
      periodStart: doc.currentPeriodStart,
      periodEnd: doc.currentPeriodEnd,
      gateway: "RAZORPAY",
      subscriptionId: doc.subscriptionId,
    });
  }

  return derived;
};

export const getBillingHistory = async (
  userId: string
): Promise<BillingPaymentDTO[]> => {
  const doc = await findLatestByUserId(userId);
  if (!doc) return [];
  return collectBillingPayments(doc).map(toBillingPaymentDTO);
};

export const getBillingPaymentDetail = async (
  userId: string,
  paymentId: string
): Promise<BillingPaymentDTO> => {
  const doc = await findLatestByUserId(userId);
  if (!doc) {
    throw new AppError("No subscription found.", 404);
  }

  const match = collectBillingPayments(doc).find(
    (p) => p.paymentId === paymentId
  );
  if (!match) {
    throw new AppError("Billing payment not found.", 404);
  }
  return toBillingPaymentDTO(match);
};
