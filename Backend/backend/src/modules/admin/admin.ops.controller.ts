import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import type { ApiSuccessResponse } from "../../types/api-response";
import { getAuthUser } from "../auth/auth.middleware";
import { getPortalAdmin } from "./admin.middleware";
import {
  auditContextFromRequest,
} from "./audit/admin-audit.service";
import {
  getUserVault,
  unifiedAdminSearch,
} from "./admin.search.service";
import {
  adminCancelSubscription,
  adminDeactivatePremium,
  adminGrantFreeMonth,
  adminRefundSubscription,
  adminSyncSubscription,
  getAdminSubscription,
  listAdminSubscriptions,
} from "./admin.subscription.service";
import {
  adminDeleteListing,
  adminForceArchiveListing,
  adminHideListing,
  adminRestoreListing,
  getAdminMarketplaceListing,
  listAdminMarketplace,
} from "./admin.marketplace.service";
import {
  exportAdminReportCsv,
  getAdminNotifications,
  getEnhancedDashboardMetrics,
  listPaymentCenter,
} from "./admin.ops.service";
import { reconcileApplicationForAdmin } from "../payment/service/reconciliation.service";
import { writeAdminAudit } from "./audit/admin-audit.service";

const requireParam = (value: string | undefined, field: string): string => {
  if (!value || value.trim().length === 0) {
    throw new AppError(`${field} is required.`, 400);
  }
  return value.trim();
};

const actorCtx = (req: Request, reason?: string | null) => {
  const admin = getPortalAdmin(req);
  const { userId, role } = getAuthUser(req);
  const ctx = auditContextFromRequest(req);
  return {
    admin,
    actorUserId: userId,
    actorRole: role,
    reason: reason ?? null,
    ...ctx,
  };
};

export const unifiedSearchHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const q = String(req.query.q ?? req.query.search ?? "").trim();
  const data = await unifiedAdminSearch(q);
  res.status(200).json({ success: true, data });
};

export const getUserVaultHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const userId = requireParam(req.params.userId, "userId");
  const data = await getUserVault(userId);
  res.status(200).json({ success: true, data });
};

export const listSubscriptionsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const data = await listAdminSubscriptions({
    search: req.query.search ? String(req.query.search) : undefined,
    status: req.query.status ? String(req.query.status) : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.status(200).json({ success: true, data });
};

export const getSubscriptionHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const id = requireParam(req.params.id, "id");
  const data = await getAdminSubscription(id);
  res.status(200).json({ success: true, data });
};

export const syncSubscriptionHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const id = requireParam(req.params.id, "id");
  const data = await adminSyncSubscription(
    id,
    actorCtx(req, req.body?.reason)
  );
  res.status(200).json({ success: true, data });
};

export const cancelSubscriptionAdminHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const userId = requireParam(req.params.userId, "userId");
  const cancelAtCycleEnd = req.body?.cancelAtCycleEnd !== false;
  const data = await adminCancelSubscription(
    userId,
    cancelAtCycleEnd,
    actorCtx(req, req.body?.reason)
  );
  res.status(200).json({ success: true, data });
};

export const refundSubscriptionAdminHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const userId = requireParam(req.params.userId, "userId");
  const data = await adminRefundSubscription(
    userId,
    {
      paymentId: req.body?.paymentId,
      amountPaise: req.body?.amountPaise,
      reason: req.body?.reason,
      subscriptionId: req.body?.subscriptionId,
    },
    actorCtx(req, req.body?.reason)
  );
  res.status(200).json({ success: true, data });
};

export const grantFreeMonthHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const id = requireParam(req.params.id, "id");
  const data = await adminGrantFreeMonth(id, actorCtx(req, req.body?.reason));
  res.status(200).json({ success: true, data });
};

export const deactivatePremiumHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const id = requireParam(req.params.id, "id");
  const data = await adminDeactivatePremium(
    id,
    actorCtx(req, req.body?.reason)
  );
  res.status(200).json({ success: true, data });
};

export const listMarketplaceAdminHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const data = await listAdminMarketplace({
    search: req.query.search ? String(req.query.search) : undefined,
    status: req.query.status ? String(req.query.status) : undefined,
    listingType: req.query.listingType
      ? String(req.query.listingType)
      : undefined,
    district: req.query.district ? String(req.query.district) : undefined,
    hasReports:
      req.query.hasReports === "true" || req.query.hasReports === "1"
        ? true
        : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.status(200).json({ success: true, data });
};

export const getMarketplaceAdminHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const id = requireParam(req.params.id, "id");
  const data = await getAdminMarketplaceListing(id);
  res.status(200).json({ success: true, data });
};

export const archiveMarketplaceHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const id = requireParam(req.params.id, "id");
  const data = await adminForceArchiveListing(
    id,
    actorCtx(req, req.body?.reason)
  );
  res.status(200).json({ success: true, data });
};

export const hideMarketplaceHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const id = requireParam(req.params.id, "id");
  const data = await adminHideListing(id, actorCtx(req, req.body?.reason));
  res.status(200).json({ success: true, data });
};

export const restoreMarketplaceHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const id = requireParam(req.params.id, "id");
  const data = await adminRestoreListing(id, actorCtx(req, req.body?.reason));
  res.status(200).json({ success: true, data });
};

export const deleteMarketplaceHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const id = requireParam(req.params.id, "id");
  const data = await adminDeleteListing(id, actorCtx(req, req.body?.reason));
  res.status(200).json({ success: true, data });
};

export const paymentCenterHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const sourceRaw = String(req.query.source ?? "ALL").toUpperCase();
  const source =
    sourceRaw === "GS" || sourceRaw === "SUBSCRIPTION" ? sourceRaw : "ALL";
  const data = await listPaymentCenter({
    search: req.query.search ? String(req.query.search) : undefined,
    source,
    status: req.query.status ? String(req.query.status) : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.status(200).json({ success: true, data });
};

export const enhancedDashboardHandler = async (
  _req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const data = await getEnhancedDashboardMetrics();
  res.status(200).json({ success: true, data });
};

export const notificationsHandler = async (
  _req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const data = await getAdminNotifications();
  res.status(200).json({ success: true, data });
};

export const exportReportHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const type = requireParam(req.params.type, "type");
  const { filename, csv } = await exportAdminReportCsv(type);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(csv);
};

export const reconcileGsPaymentHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<unknown>>
): Promise<void> => {
  const applicationId = requireParam(req.params.applicationId, "applicationId");
  const { userId, role } = getAuthUser(req);
  const admin = getPortalAdmin(req);
  const data = await reconcileApplicationForAdmin(applicationId, {
    userId,
    role,
  });
  const ctx = auditContextFromRequest(req);
  await writeAdminAudit({
    admin,
    actorUserId: userId,
    action: "GS_PAYMENT_RECONCILE",
    entity: "gram_sahakari_applications",
    entityId: applicationId,
    newValue: data as unknown as Record<string, unknown>,
    reason: req.body?.reason ?? "admin_reconcile",
    ...ctx,
  });
  res.status(200).json({ success: true, data });
};
