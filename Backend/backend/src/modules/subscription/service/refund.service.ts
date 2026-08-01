/**
 * Refund architecture placeholder for future Razorpay refunds on subscription
 * charges. Automatic refunds are intentionally NOT implemented yet.
 *
 * Future work:
 * 1. Accept admin/user refund requests with paymentId + amount/reason.
 * 2. Call Razorpay Refunds API via the shared getRazorpayClient().
 * 3. Persist refund ids on the subscription event timeline.
 * 4. Decide whether a full refund should halt/cancel the subscription.
 */

import { AppError } from "../../../utils/AppError";
import { logSubscriptionAudit } from "./audit.service";

export interface CreateSubscriptionRefundInput {
  userId: string;
  subscriptionId: string;
  paymentId: string;
  amountPaise?: number;
  reason?: string;
  actorUserId: string;
  actorRole: string;
}

export const createSubscriptionRefund = async (
  _input: CreateSubscriptionRefundInput
): Promise<never> => {
  logSubscriptionAudit({
    action: "SUBSCRIPTION_REFUND_PLACEHOLDER",
    userId: _input.userId,
    subscriptionId: _input.subscriptionId,
    actorUserId: _input.actorUserId,
    actorRole: _input.actorRole,
    details: {
      paymentId: _input.paymentId,
      amountPaise: _input.amountPaise ?? null,
      reason: _input.reason ?? null,
    },
  });

  throw new AppError(
    "Subscription refunds are not enabled yet. Contact support.",
    501
  );
};
