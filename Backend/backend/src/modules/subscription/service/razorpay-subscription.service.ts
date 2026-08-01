import { getRazorpayClient } from "../../../config/razorpay";
import { AppError } from "../../../utils/AppError";
import {
  SUBSCRIPTION_PURPOSE,
  SUBSCRIPTION_QUANTITY,
  SUBSCRIPTION_TOTAL_COUNT,
} from "../subscription.constants";

export interface RazorpaySubscriptionSnapshot {
  id: string;
  planId: string | null;
  status: string | null;
  customerId: string | null;
  totalCount: number | null;
  paidCount: number | null;
  remainingCount: number | null;
  currentStart: number | null;
  currentEnd: number | null;
  chargeAt: number | null;
  quantity: number | null;
  shortUrl: string | null;
  notes: Record<string, unknown>;
  raw: Record<string, unknown>;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const str = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const num = (value: unknown): number | null =>
  typeof value === "number" ? value : null;

export const toSubscriptionSnapshot = (
  raw: Record<string, unknown>
): RazorpaySubscriptionSnapshot => ({
  id: String(raw.id ?? ""),
  planId: str(raw.plan_id),
  status: str(raw.status),
  customerId: str(raw.customer_id),
  totalCount: num(raw.total_count),
  paidCount: num(raw.paid_count),
  remainingCount: num(raw.remaining_count),
  currentStart: num(raw.current_start),
  currentEnd: num(raw.current_end),
  chargeAt: num(raw.charge_at),
  quantity: num(raw.quantity),
  shortUrl: str(raw.short_url),
  notes: asRecord(raw.notes),
  raw,
});

/**
 * Creates a Razorpay Subscription against the pre-configured Dashboard plan.
 * @see https://razorpay.com/docs/api/payments/subscriptions/#create-a-subscription
 */
export const createRazorpaySubscription = async (params: {
  planId: string;
  userId: string;
  totalCount?: number;
  quantity?: number;
  notes?: Record<string, string>;
}): Promise<RazorpaySubscriptionSnapshot> => {
  try {
    const client = getRazorpayClient();
    const created = (await client.subscriptions.create({
      plan_id: params.planId,
      total_count: params.totalCount ?? SUBSCRIPTION_TOTAL_COUNT,
      quantity: params.quantity ?? SUBSCRIPTION_QUANTITY,
      customer_notify: 1,
      notes: {
        purpose: SUBSCRIPTION_PURPOSE,
        userId: params.userId,
        ...(params.notes ?? {}),
      },
    })) as unknown as Record<string, unknown>;

    const snapshot = toSubscriptionSnapshot(created);
    if (!snapshot.id) {
      throw new AppError("Payment gateway returned an invalid subscription.", 502);
    }
    return snapshot;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Unable to create subscription with the payment gateway. Please try again.",
      502
    );
  }
};

export const fetchRazorpaySubscription = async (
  subscriptionId: string
): Promise<RazorpaySubscriptionSnapshot> => {
  try {
    const client = getRazorpayClient();
    const raw = (await client.subscriptions.fetch(
      subscriptionId
    )) as unknown as Record<string, unknown>;
    return toSubscriptionSnapshot(raw);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Unable to reach the payment gateway.", 502);
  }
};

/**
 * @see https://razorpay.com/docs/api/payments/subscriptions/#cancel-a-subscription
 */
export const cancelRazorpaySubscription = async (
  subscriptionId: string,
  cancelAtCycleEnd: boolean
): Promise<RazorpaySubscriptionSnapshot> => {
  try {
    const client = getRazorpayClient();
    // SDK typings accept boolean | number for the second arg depending on version.
    const cancel = client.subscriptions.cancel.bind(client.subscriptions) as (
      id: string,
      cancelAtCycleEnd?: boolean | number | Record<string, unknown>
    ) => Promise<unknown>;
    const raw = (await cancel(subscriptionId, {
      cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0,
    })) as Record<string, unknown>;
    return toSubscriptionSnapshot(raw);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Unable to cancel the subscription. Please try again.", 502);
  }
};

/**
 * Resumes a paused subscription.
 * @see https://razorpay.com/docs/api/payments/subscriptions/#resume-a-subscription
 */
export const resumeRazorpaySubscription = async (
  subscriptionId: string
): Promise<RazorpaySubscriptionSnapshot> => {
  try {
    const client = getRazorpayClient();
    // SDK typings vary across versions; cast keeps us compatible.
    const subscriptions = client.subscriptions as {
      resume: (
        id: string,
        params?: Record<string, unknown>
      ) => Promise<unknown>;
    };
    const raw = (await subscriptions.resume(subscriptionId, {
      resume_at: "now",
    })) as Record<string, unknown>;
    return toSubscriptionSnapshot(raw);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Unable to resume the subscription. Please try again.", 502);
  }
};
