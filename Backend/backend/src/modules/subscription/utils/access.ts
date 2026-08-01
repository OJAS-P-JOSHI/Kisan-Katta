import type { IUserSubscription } from "../interfaces/subscription.interface";

/**
 * Home / app access rule for mobile gating.
 *
 * - ACTIVE / AUTHENTICATED: first payment succeeded (or recurring live).
 * - CANCELLED / COMPLETED / PAUSED: remain usable until currentPeriodEnd
 *   (cancel stops future renewals; current period stays valid).
 * - PENDING / HALTED: still allow until the paid period ends, if known.
 */
export const hasSubscriptionAccess = (
  subscription: Pick<
    IUserSubscription,
    "status" | "currentPeriodEnd"
  > | null
): boolean => {
  if (!subscription) return false;

  const { status, currentPeriodEnd } = subscription;
  const now = Date.now();
  const periodOpen =
    currentPeriodEnd != null && currentPeriodEnd.getTime() > now;

  if (status === "ACTIVE" || status === "AUTHENTICATED") {
    return true;
  }

  if (
    status === "CANCELLED" ||
    status === "COMPLETED" ||
    status === "PAUSED" ||
    status === "PENDING" ||
    status === "HALTED"
  ) {
    return periodOpen;
  }

  return false;
};
