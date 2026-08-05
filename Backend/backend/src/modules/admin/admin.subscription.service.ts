import { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { AuthUser } from "../auth/auth.model";
import { FarmerProfile } from "../profile/profile.model";
import type { AdminProfileDTO } from "./admin.dto";
import { writeAdminAudit } from "./audit/admin-audit.service";
import {
  cancelSubscription,
  refreshSubscriptionState,
} from "../subscription/service/subscription.service";
import { createSubscriptionRefund } from "../subscription/service/refund.service";
import {
  findById,
  findLatestByUserId,
  listSubscriptionsAdmin,
  updateSubscriptionById,
} from "../subscription/repository/subscription.repository";
import {
  toBillingPaymentDTO,
  toSubscriptionDTO,
  type SubscriptionDTO,
} from "../subscription/dto/subscription.dto";
import type { IUserSubscription } from "../subscription/interfaces/subscription.interface";
import { fetchRazorpaySubscription } from "../subscription/service/razorpay-subscription.service";
import { applyGatewaySnapshot } from "../subscription/service/finalize.service";
import { logSubscriptionAudit } from "../subscription/service/audit.service";

export type AdminSubscriptionListQuery = {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
};

const enrichWithUser = async (doc: IUserSubscription) => {
  const [user, profile] = await Promise.all([
    AuthUser.findById(doc.userId).select("mobile role").lean(),
    FarmerProfile.findOne({ userId: doc.userId }).select("name district").lean(),
  ]);
  return {
    ...toSubscriptionDTO(doc),
    userMobile: user?.mobile ?? null,
    userName: profile?.name ?? null,
    userDistrict: profile?.district ?? null,
    events: (doc.events ?? []).slice(-50).map((e) => ({
      type: e.type,
      source: e.source,
      details: e.details ?? {},
      timestamp: new Date(e.timestamp).toISOString(),
    })),
    billingPayments: [...(doc.billingPayments ?? [])]
      .sort(
        (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
      )
      .map(toBillingPaymentDTO),
  };
};

export const listAdminSubscriptions = async (
  query: AdminSubscriptionListQuery
) => {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  const filter: Record<string, unknown> = {};

  if (query.status?.trim()) {
    filter.status = query.status.trim().toUpperCase();
  }

  if (query.search?.trim()) {
    const q = query.search.trim();
    const or: Record<string, unknown>[] = [
      { subscriptionId: q },
      { customerId: q },
      { latestPaymentId: q },
      { "billingPayments.paymentId": q },
    ];
    if (Types.ObjectId.isValid(q)) {
      or.push({ _id: new Types.ObjectId(q) });
      or.push({ userId: new Types.ObjectId(q) });
    }
    const mobileDigits = q.replace(/\D/g, "");
    if (mobileDigits.length >= 10) {
      const mobile =
        mobileDigits.length === 10
          ? `+91${mobileDigits}`
          : `+${mobileDigits}`;
      const user = await AuthUser.findOne({ mobile }).select("_id").lean();
      if (user) or.push({ userId: user._id });
    }
    filter.$or = or;
  }

  const { total, rows } = await listSubscriptionsAdmin({
    filter,
    skip: (page - 1) * limit,
    limit,
  });

  const items = await Promise.all(rows.map(enrichWithUser));
  return {
    items,
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
};

export const getAdminSubscription = async (id: string) => {
  const doc = Types.ObjectId.isValid(id)
    ? await findById(id)
    : null;
  if (!doc) {
    throw new AppError("Subscription not found.", 404);
  }
  return enrichWithUser(doc);
};

type ActorCtx = {
  admin: AdminProfileDTO;
  actorUserId: string;
  actorRole: string;
  ip?: string | null;
  userAgent?: string | null;
  reason?: string | null;
};

const requireWritable = (admin: AdminProfileDTO) => {
  if (admin.role === "READ_ONLY") {
    throw new AppError("Read-only admins cannot modify subscriptions.", 403);
  }
};

export const adminSyncSubscription = async (
  subscriptionDocId: string,
  ctx: ActorCtx
) => {
  requireWritable(ctx.admin);
  const local = await findById(subscriptionDocId);
  if (!local?.subscriptionId) {
    throw new AppError("Subscription not found.", 404);
  }

  const snapshot = await fetchRazorpaySubscription(local.subscriptionId);
  const updated = await applyGatewaySnapshot({
    local,
    snapshot,
    source: "API",
    eventType: "SUBSCRIPTION_ADMIN_SYNC",
  });

  logSubscriptionAudit({
    action: "SUBSCRIPTION_ADMIN_SYNC",
    userId: String(local.userId),
    subscriptionId: local.subscriptionId,
    actorUserId: ctx.actorUserId,
    actorRole: ctx.actorRole,
    details: { status: updated.status },
  });

  await writeAdminAudit({
    admin: ctx.admin,
    actorUserId: ctx.actorUserId,
    action: "SUBSCRIPTION_SYNC",
    entity: "user_subscriptions",
    entityId: subscriptionDocId,
    affectedUserId: String(local.userId),
    oldValue: { status: local.status },
    newValue: { status: updated.status },
    reason: ctx.reason ?? null,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return enrichWithUser(updated);
};

export const adminRefreshSubscriptionForUser = async (
  userId: string,
  ctx: ActorCtx
): Promise<SubscriptionDTO> => {
  requireWritable(ctx.admin);
  const data = await refreshSubscriptionState(userId, ctx.actorRole);
  await writeAdminAudit({
    admin: ctx.admin,
    actorUserId: ctx.actorUserId,
    action: "SUBSCRIPTION_REFRESH",
    entity: "user_subscriptions",
    entityId: data.id,
    affectedUserId: userId,
    newValue: { status: data.status },
    reason: ctx.reason ?? null,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return data;
};

export const adminCancelSubscription = async (
  userId: string,
  cancelAtCycleEnd: boolean,
  ctx: ActorCtx
) => {
  requireWritable(ctx.admin);
  const before = await findLatestByUserId(userId);
  const data = await cancelSubscription(
    userId,
    { cancelAtCycleEnd },
    ctx.actorRole
  );
  await writeAdminAudit({
    admin: ctx.admin,
    actorUserId: ctx.actorUserId,
    action: cancelAtCycleEnd
      ? "SUBSCRIPTION_CANCEL_AUTOPAY"
      : "SUBSCRIPTION_CANCEL_IMMEDIATE",
    entity: "user_subscriptions",
    entityId: data.id,
    affectedUserId: userId,
    oldValue: before
      ? { status: before.status, cancelAtCycleEnd: before.cancelAtCycleEnd }
      : null,
    newValue: {
      status: data.status,
      cancelAtCycleEnd: data.cancelAtCycleEnd,
    },
    reason: ctx.reason ?? null,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return data;
};

export const adminRefundSubscription = async (
  userId: string,
  body: {
    paymentId?: string;
    amountPaise?: number;
    reason?: string;
    subscriptionId?: string;
  },
  ctx: ActorCtx
) => {
  requireWritable(ctx.admin);
  if (!body.reason?.trim()) {
    throw new AppError("Refund reason is required.", 400);
  }

  const result = await createSubscriptionRefund({
    userId,
    paymentId: body.paymentId,
    amountPaise: body.amountPaise,
    reason: body.reason,
    subscriptionId: body.subscriptionId,
    actorUserId: ctx.actorUserId,
    actorRole: ctx.actorRole,
    cancelImmediately: true,
    revokeAccess: true,
  });

  await writeAdminAudit({
    admin: ctx.admin,
    actorUserId: ctx.actorUserId,
    action: "SUBSCRIPTION_REFUND",
    entity: "user_subscriptions",
    entityId: result.subscription.id,
    affectedUserId: userId,
    newValue: {
      refundId: result.refundId,
      paymentId: result.paymentId,
      refundAmount: result.refundAmount,
    },
    reason: body.reason,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return result;
};

export const adminGrantFreeMonth = async (
  subscriptionDocId: string,
  ctx: ActorCtx
) => {
  requireWritable(ctx.admin);
  const local = await findById(subscriptionDocId);
  if (!local) throw new AppError("Subscription not found.", 404);

  const base =
    local.currentPeriodEnd && local.currentPeriodEnd.getTime() > Date.now()
      ? local.currentPeriodEnd
      : new Date();
  const nextEnd = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);

  const updated = await updateSubscriptionById(
    subscriptionDocId,
    {
      currentPeriodEnd: nextEnd,
      accessRevokedAt: null,
      status:
        local.status === "CANCELLED" || local.status === "EXPIRED"
          ? "ACTIVE"
          : local.status,
    },
    [
      {
        type: "SUBSCRIPTION_FREE_MONTH_GRANTED",
        source: "API",
        details: { previousEnd: local.currentPeriodEnd, nextEnd },
        timestamp: new Date(),
      },
    ]
  );

  logSubscriptionAudit({
    action: "SUBSCRIPTION_FREE_MONTH_GRANTED",
    userId: String(local.userId),
    subscriptionId: local.subscriptionId,
    actorUserId: ctx.actorUserId,
    actorRole: ctx.actorRole,
    details: { nextEnd },
  });

  await writeAdminAudit({
    admin: ctx.admin,
    actorUserId: ctx.actorUserId,
    action: "SUBSCRIPTION_GRANT_FREE_MONTH",
    entity: "user_subscriptions",
    entityId: subscriptionDocId,
    affectedUserId: String(local.userId),
    oldValue: { currentPeriodEnd: local.currentPeriodEnd },
    newValue: { currentPeriodEnd: nextEnd },
    reason: ctx.reason ?? "goodwill_free_month",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return enrichWithUser(updated ?? local);
};

export const adminDeactivatePremium = async (
  subscriptionDocId: string,
  ctx: ActorCtx
) => {
  requireWritable(ctx.admin);
  const local = await findById(subscriptionDocId);
  if (!local) throw new AppError("Subscription not found.", 404);

  const now = new Date();
  const updated = await updateSubscriptionById(
    subscriptionDocId,
    { accessRevokedAt: now, currentPeriodEnd: now },
    [
      {
        type: "SUBSCRIPTION_ACCESS_REVOKED",
        source: "API",
        details: { via: "admin_deactivate" },
        timestamp: now,
      },
    ]
  );

  logSubscriptionAudit({
    action: "SUBSCRIPTION_ACCESS_REVOKED",
    userId: String(local.userId),
    subscriptionId: local.subscriptionId,
    actorUserId: ctx.actorUserId,
    actorRole: ctx.actorRole,
    details: { via: "admin_deactivate" },
  });

  await writeAdminAudit({
    admin: ctx.admin,
    actorUserId: ctx.actorUserId,
    action: "SUBSCRIPTION_DEACTIVATE_PREMIUM",
    entity: "user_subscriptions",
    entityId: subscriptionDocId,
    affectedUserId: String(local.userId),
    oldValue: { accessRevokedAt: local.accessRevokedAt },
    newValue: { accessRevokedAt: now },
    reason: ctx.reason ?? "admin_deactivate",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return enrichWithUser(updated ?? local);
};
