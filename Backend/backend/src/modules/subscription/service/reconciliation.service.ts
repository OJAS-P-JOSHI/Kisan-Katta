import {
  findReconcileCandidates,
  findById,
} from "../repository/subscription.repository";
import { applyGatewaySnapshot } from "./finalize.service";
import { fetchRazorpaySubscription } from "./razorpay-subscription.service";
import { logSubscriptionAudit } from "./audit.service";
import {
  SUBSCRIPTION_RECONCILIATION_BATCH_LIMIT,
} from "../subscription.constants";

const SYSTEM_ACTOR = { userId: "system", role: "SYSTEM" };

export interface SubscriptionReconcileResult {
  id: string;
  subscriptionId: string | null;
  previousStatus: string;
  currentStatus: string;
  repaired: boolean;
  detail: string;
}

export const reconcileSubscriptionById = async (
  id: string,
  actor = SYSTEM_ACTOR
): Promise<SubscriptionReconcileResult> => {
  const local = await findById(id);
  if (!local) {
    return {
      id,
      subscriptionId: null,
      previousStatus: "unknown",
      currentStatus: "unknown",
      repaired: false,
      detail: "Not found.",
    };
  }

  logSubscriptionAudit({
    action: "SUBSCRIPTION_RECONCILIATION_STARTED",
    userId: String(local.userId),
    subscriptionId: local.subscriptionId,
    actorUserId: actor.userId,
    actorRole: actor.role,
  });

  if (local.notes?.testerAccess === true) {
    return {
      id,
      subscriptionId: local.subscriptionId,
      previousStatus: local.status,
      currentStatus: local.status,
      repaired: false,
      detail: "Tester complimentary access — skipped.",
    };
  }

  if (!local.subscriptionId) {
    return {
      id,
      subscriptionId: null,
      previousStatus: local.status,
      currentStatus: local.status,
      repaired: false,
      detail: "No Razorpay subscription id.",
    };
  }

  try {
    const snapshot = await fetchRazorpaySubscription(local.subscriptionId);
    const previousStatus = local.status;
    const updated = await applyGatewaySnapshot({
      local,
      snapshot,
      source: "RECONCILIATION",
      eventType: "SUBSCRIPTION_RECONCILIATION",
    });

    logSubscriptionAudit({
      action: "SUBSCRIPTION_RECONCILIATION_SUCCESS",
      userId: String(local.userId),
      subscriptionId: local.subscriptionId,
      actorUserId: actor.userId,
      actorRole: actor.role,
      details: { previousStatus, currentStatus: updated.status },
    });

    return {
      id,
      subscriptionId: local.subscriptionId,
      previousStatus,
      currentStatus: updated.status,
      repaired: previousStatus !== updated.status,
      detail: "Synced from Razorpay.",
    };
  } catch (error) {
    logSubscriptionAudit({
      action: "SUBSCRIPTION_RECONCILIATION_FAILED",
      userId: String(local.userId),
      subscriptionId: local.subscriptionId,
      actorUserId: actor.userId,
      actorRole: actor.role,
      details: {
        message: error instanceof Error ? error.message : "unknown",
      },
    });
    throw error;
  }
};

export const reconcilePendingSubscriptions = async (
  limit = SUBSCRIPTION_RECONCILIATION_BATCH_LIMIT
): Promise<{
  scanned: number;
  repaired: number;
  failed: number;
  results: SubscriptionReconcileResult[];
}> => {
  const docs = await findReconcileCandidates(limit);
  const summary = {
    scanned: docs.length,
    repaired: 0,
    failed: 0,
    results: [] as SubscriptionReconcileResult[],
  };

  for (const doc of docs) {
    try {
      const result = await reconcileSubscriptionById(String(doc._id));
      if (result.repaired) summary.repaired += 1;
      summary.results.push(result);
    } catch {
      summary.failed += 1;
    }
  }

  return summary;
};
