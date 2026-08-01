import type { SubscriptionAuditAction } from "../types/subscription.types";

export interface SubscriptionAuditEntry {
  action: SubscriptionAuditAction;
  userId: string;
  subscriptionId?: string | null;
  actorUserId: string;
  actorRole: string;
  details?: Record<string, unknown>;
}

/**
 * Fire-and-forget structured audit log — same style as the payment module.
 * Secrets and signatures are never logged.
 */
export const logSubscriptionAudit = (entry: SubscriptionAuditEntry): void => {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      module: "subscription",
      audit: true,
      action: entry.action,
      userId: entry.userId,
      subscriptionId: entry.subscriptionId ?? null,
      actorUserId: entry.actorUserId,
      actorRole: entry.actorRole,
      details: entry.details ?? {},
      timestamp: new Date().toISOString(),
    })
  );
};
