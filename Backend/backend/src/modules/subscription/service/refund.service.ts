/**
 * Admin and (future) support flows for Razorpay subscription charge refunds.
 * Persists into user_subscriptions.billingPayments — no separate refunds collection.
 */

import { AppError } from "../../../utils/AppError";
import { getRazorpayClient } from "../../../config/razorpay";
import { claimEvent, completeEvent } from "../../payment/repository/event.repository";
import type { IBillingPayment, IUserSubscription } from "../interfaces/subscription.interface";
import {
  findById,
  findBySubscriptionId,
  findLatestByUserId,
  findByBillingPaymentId,
  updateSubscriptionById,
  upsertBillingPayment,
} from "../repository/subscription.repository";
import { toSubscriptionDTO, type SubscriptionDTO } from "../dto/subscription.dto";
import { logSubscriptionAudit } from "./audit.service";
import {
  cancelRazorpaySubscription,
  fetchRazorpaySubscription,
} from "./razorpay-subscription.service";
import { applyGatewaySnapshot } from "./finalize.service";

export interface CreateSubscriptionRefundInput {
  userId: string;
  subscriptionId?: string;
  paymentId?: string;
  amountPaise?: number;
  reason?: string;
  actorUserId: string;
  actorRole: string;
  /** When true (default), cancel subscription immediately before refund. */
  cancelImmediately?: boolean;
  /** When true (default), revoke premium access after successful refund. */
  revokeAccess?: boolean;
}

export interface SubscriptionRefundResult {
  subscription: SubscriptionDTO;
  refundId: string;
  paymentId: string;
  refundAmount: number;
}

const pickLatestPaidPayment = (
  doc: IUserSubscription,
  preferredPaymentId?: string
): IBillingPayment | null => {
  const payments = [...(doc.billingPayments ?? [])];
  if (preferredPaymentId) {
    const match = payments.find((p) => p.paymentId === preferredPaymentId);
    if (!match) {
      throw new AppError("Billing payment not found on this subscription.", 404);
    }
    return match;
  }

  const paid = payments
    .filter((p) => p.status === "PAID")
    .sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    );
  if (paid[0]) return paid[0];

  if (doc.latestPaymentId) {
    return (
      payments.find((p) => p.paymentId === doc.latestPaymentId) ?? {
        paymentId: doc.latestPaymentId,
        invoiceId: null,
        amount: doc.amount,
        currency: doc.currency,
        status: "PAID" as const,
        paymentMethod: doc.paymentMethod,
        paidAt: doc.updatedAt,
        periodStart: doc.currentPeriodStart,
        periodEnd: doc.currentPeriodEnd,
        gateway: "RAZORPAY",
        subscriptionId: doc.subscriptionId,
      }
    );
  }

  return null;
};

const createRazorpayRefund = async (
  paymentId: string,
  amountPaise: number | undefined,
  notes: Record<string, string>
): Promise<{ id: string; amount: number }> => {
  try {
    const client = getRazorpayClient();
    const payload: Record<string, unknown> = {
      notes,
    };
    if (typeof amountPaise === "number" && amountPaise > 0) {
      payload.amount = amountPaise;
    }
    const refund = (await client.payments.refund(
      paymentId,
      payload
    )) as unknown as Record<string, unknown>;
    const id = typeof refund.id === "string" ? refund.id : "";
    const amount =
      typeof refund.amount === "number"
        ? refund.amount
        : typeof amountPaise === "number"
          ? amountPaise
          : 0;
    if (!id) {
      throw new AppError("Payment gateway returned an invalid refund.", 502);
    }
    return { id, amount };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Unable to refund the payment with the payment gateway. Please try again.",
      502
    );
  }
};

/**
 * Cancels immediately (optional), refunds a subscription charge, updates billing
 * row, and revokes premium access. Idempotent on paymentId when already REFUNDED.
 */
export const createSubscriptionRefund = async (
  input: CreateSubscriptionRefundInput
): Promise<SubscriptionRefundResult> => {
  const cancelImmediately = input.cancelImmediately !== false;
  const revokeAccess = input.revokeAccess !== false;

  let local =
    (input.subscriptionId
      ? await findBySubscriptionId(input.subscriptionId)
      : null) ?? (await findLatestByUserId(input.userId));

  if (!local) {
    throw new AppError("No subscription found for this user.", 404);
  }
  if (String(local.userId) !== input.userId && !input.subscriptionId) {
    // When resolved by subscriptionId, still bind to document user.
  }
  if (input.subscriptionId && String(local.userId) !== input.userId) {
    // Admin may pass vault userId that owns the subscription — re-check ownership.
    const owned = await findLatestByUserId(input.userId);
    if (owned && String(owned._id) === String(local._id)) {
      local = owned;
    } else if (String(local.userId) !== input.userId) {
      // Allow admin refund by subscription document owner
      input = { ...input, userId: String(local.userId) };
    }
  }

  const payment = pickLatestPaidPayment(local, input.paymentId);
  if (!payment) {
    throw new AppError("No refundable payment found on this subscription.", 404);
  }

  if (payment.status === "REFUNDED" && payment.refundId) {
    const fresh = (await findById(String(local._id))) ?? local;
    return {
      subscription: toSubscriptionDTO(fresh),
      refundId: payment.refundId,
      paymentId: payment.paymentId,
      refundAmount: payment.refundAmount ?? payment.amount,
    };
  }

  if (
    typeof input.amountPaise === "number" &&
    (input.amountPaise <= 0 || input.amountPaise > payment.amount)
  ) {
    throw new AppError(
      "Refund amount must be between 1 and the original payment amount.",
      400
    );
  }

  const eventId = `sub_refund_${payment.paymentId}`;
  const claim = await claimEvent(eventId, "subscription.refund", "VERIFY");
  if (claim.duplicate && claim.existing?.processingResult === "PROCESSED") {
    const fresh = (await findById(String(local._id))) ?? local;
    const paid = pickLatestPaidPayment(fresh, payment.paymentId);
    return {
      subscription: toSubscriptionDTO(fresh),
      refundId: paid?.refundId ?? claim.existing.razorpayEventId,
      paymentId: payment.paymentId,
      refundAmount: paid?.refundAmount ?? payment.amount,
    };
  }

  logSubscriptionAudit({
    action: "SUBSCRIPTION_REFUND_REQUESTED",
    userId: String(local.userId),
    subscriptionId: local.subscriptionId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    details: {
      paymentId: payment.paymentId,
      amountPaise: input.amountPaise ?? payment.amount,
      reason: input.reason ?? null,
    },
  });

  try {
    if (cancelImmediately && local.subscriptionId) {
      try {
        const snapshot = await cancelRazorpaySubscription(
          local.subscriptionId,
          false
        );
        local = await applyGatewaySnapshot({
          local,
          snapshot,
          source: "API",
          eventType: "SUBSCRIPTION_CANCELLED",
          extraSet: {
            cancelAtCycleEnd: false,
            cancelledAt: new Date(),
          },
        });
      } catch {
        // Already cancelled at gateway — continue with refund.
        const snapshot = await fetchRazorpaySubscription(
          local.subscriptionId as string
        );
        local = await applyGatewaySnapshot({
          local,
          snapshot,
          source: "API",
          eventType: "SUBSCRIPTION_CANCELLED",
          extraSet: {
            cancelAtCycleEnd: false,
            cancelledAt: local.cancelledAt ?? new Date(),
          },
        });
      }
    }

    const gatewayRefund = await createRazorpayRefund(
      payment.paymentId,
      input.amountPaise,
      {
        purpose: "APP_SUBSCRIPTION_REFUND",
        userId: String(local.userId),
        reason: (input.reason ?? "admin_goodwill").slice(0, 200),
      }
    );

    const now = new Date();
    const refundAmount = gatewayRefund.amount || payment.amount;

    await upsertBillingPayment(String(local._id), {
      ...payment,
      status: "REFUNDED",
      refundId: gatewayRefund.id,
      refundedAt: now,
      refundAmount,
      refundReason: input.reason ?? null,
    });

    const set: Record<string, unknown> = {};
    if (revokeAccess) {
      set.accessRevokedAt = now;
      set.currentPeriodEnd = now;
    }

    const updated =
      (await updateSubscriptionById(
        String(local._id),
        set,
        [
          {
            type: "SUBSCRIPTION_REFUND_PROCESSED",
            source: "API",
            details: {
              paymentId: payment.paymentId,
              refundId: gatewayRefund.id,
              refundAmount,
              reason: input.reason ?? null,
            },
            timestamp: now,
          },
        ]
      )) ?? ((await findById(String(local._id))) as IUserSubscription);

    await completeEvent(eventId, "PROCESSED");

    logSubscriptionAudit({
      action: "SUBSCRIPTION_REFUND_PROCESSED",
      userId: String(local.userId),
      subscriptionId: local.subscriptionId,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      details: {
        paymentId: payment.paymentId,
        refundId: gatewayRefund.id,
        refundAmount,
      },
    });

    if (revokeAccess) {
      logSubscriptionAudit({
        action: "SUBSCRIPTION_ACCESS_REVOKED",
        userId: String(local.userId),
        subscriptionId: local.subscriptionId,
        actorUserId: input.actorUserId,
        actorRole: input.actorRole,
        details: { via: "refund" },
      });
    }

    return {
      subscription: toSubscriptionDTO(updated),
      refundId: gatewayRefund.id,
      paymentId: payment.paymentId,
      refundAmount,
    };
  } catch (error) {
    await completeEvent(eventId, "FAILED");
    logSubscriptionAudit({
      action: "SUBSCRIPTION_REFUND_FAILED",
      userId: String(local.userId),
      subscriptionId: local.subscriptionId,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      details: {
        paymentId: payment.paymentId,
        message: error instanceof Error ? error.message : "unknown",
      },
    });
    throw error;
  }
};

/** Apply refund.* webhook onto a subscription billing payment (idempotent). */
export const applySubscriptionRefundFromWebhook = async (params: {
  paymentId: string;
  refundId: string | null;
  refundAmount?: number | null;
  processed: boolean;
}): Promise<IUserSubscription | null> => {
  const doc = await findSubscriptionByBillingPaymentId(params.paymentId);
  if (!doc) return null;

  const payment = (doc.billingPayments ?? []).find(
    (p) => p.paymentId === params.paymentId
  );
  if (!payment) return null;

  if (payment.status === "REFUNDED" && payment.refundId) {
    return doc;
  }

  if (!params.processed) {
    await updateSubscriptionById(String(doc._id), {}, [
      {
        type: "subscription.refund.created",
        source: "WEBHOOK",
        details: {
          paymentId: params.paymentId,
          refundId: params.refundId,
        },
        timestamp: new Date(),
      },
    ]);
    return findById(String(doc._id));
  }

  const now = new Date();
  await upsertBillingPayment(String(doc._id), {
    ...payment,
    status: "REFUNDED",
    refundId: params.refundId,
    refundedAt: now,
    refundAmount: params.refundAmount ?? payment.amount,
    refundReason: payment.refundReason ?? "webhook",
  });

  return updateSubscriptionById(
    String(doc._id),
    {
      accessRevokedAt: doc.accessRevokedAt ?? now,
      currentPeriodEnd: now,
    },
    [
      {
        type: "subscription.refund.processed",
        source: "WEBHOOK",
        details: {
          paymentId: params.paymentId,
          refundId: params.refundId,
        },
        timestamp: now,
      },
    ]
  );
};

export const findSubscriptionByBillingPaymentId = (
  paymentId: string
): Promise<IUserSubscription | null> => findByBillingPaymentId(paymentId);
