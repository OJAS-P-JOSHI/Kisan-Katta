import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../auth/auth.middleware";
import {
  getAnalyticsHandler,
  getAnalyticsLocationsHandler,
  getApplicationHandler,
  getDashboardHandler,
  getFarmerHandler,
  getMeAdminHandler,
  getSystemInfoHandler,
  listApplicationsHandler,
  listFarmersHandler,
  listPaymentsHandler,
  listVolunteersHandler,
} from "./admin.controller";
import {
  archiveMarketplaceHandler,
  cancelSubscriptionAdminHandler,
  deactivatePremiumHandler,
  deleteMarketplaceHandler,
  enhancedDashboardHandler,
  exportReportHandler,
  getMarketplaceAdminHandler,
  getSubscriptionHandler,
  getUserVaultHandler,
  grantFreeMonthHandler,
  hideMarketplaceHandler,
  listMarketplaceAdminHandler,
  listSubscriptionsHandler,
  notificationsHandler,
  paymentCenterHandler,
  reconcileGsPaymentHandler,
  refundSubscriptionAdminHandler,
  restoreMarketplaceHandler,
  syncSubscriptionHandler,
  unifiedSearchHandler,
} from "./admin.ops.controller";
import {
  requireAdminPermission,
  requirePortalAdmin,
} from "./admin.middleware";

const router = Router();

router.use(authenticate, requirePortalAdmin);

router.get("/me", asyncHandler(getMeAdminHandler));

router.get(
  "/dashboard",
  requireAdminPermission("dashboard"),
  asyncHandler(getDashboardHandler)
);

router.get(
  "/dashboard/ops",
  requireAdminPermission("dashboard"),
  asyncHandler(enhancedDashboardHandler)
);

router.get(
  "/analytics",
  requireAdminPermission("analytics"),
  asyncHandler(getAnalyticsHandler)
);

router.get(
  "/analytics/locations",
  requireAdminPermission("analytics"),
  asyncHandler(getAnalyticsLocationsHandler)
);

router.get(
  "/search",
  requireAdminPermission("farmers"),
  asyncHandler(unifiedSearchHandler)
);

router.get(
  "/users/:userId/vault",
  requireAdminPermission("farmers"),
  asyncHandler(getUserVaultHandler)
);

router.get(
  "/applications",
  requireAdminPermission("applications"),
  asyncHandler(listApplicationsHandler)
);

router.get(
  "/applications/:id",
  requireAdminPermission("applications"),
  asyncHandler(getApplicationHandler)
);

router.post(
  "/applications/:applicationId/reconcile",
  requireAdminPermission("payments"),
  asyncHandler(reconcileGsPaymentHandler)
);

router.get(
  "/volunteers",
  requireAdminPermission("volunteers"),
  asyncHandler(listVolunteersHandler)
);

router.get(
  "/farmers",
  requireAdminPermission("farmers"),
  asyncHandler(listFarmersHandler)
);

router.get(
  "/farmers/:id",
  requireAdminPermission("farmers"),
  asyncHandler(getFarmerHandler)
);

router.get(
  "/payments",
  requireAdminPermission("payments"),
  asyncHandler(listPaymentsHandler)
);

router.get(
  "/payments/center",
  requireAdminPermission("payments"),
  asyncHandler(paymentCenterHandler)
);

router.get(
  "/subscriptions",
  requireAdminPermission("subscriptions"),
  asyncHandler(listSubscriptionsHandler)
);

router.get(
  "/subscriptions/:id",
  requireAdminPermission("subscriptions"),
  asyncHandler(getSubscriptionHandler)
);

router.post(
  "/subscriptions/:id/sync",
  requireAdminPermission("subscriptions"),
  asyncHandler(syncSubscriptionHandler)
);

router.post(
  "/users/:userId/subscriptions/cancel",
  requireAdminPermission("subscriptions"),
  asyncHandler(cancelSubscriptionAdminHandler)
);

router.post(
  "/users/:userId/subscriptions/refund",
  requireAdminPermission("subscriptions"),
  asyncHandler(refundSubscriptionAdminHandler)
);

router.post(
  "/subscriptions/:id/grant-free-month",
  requireAdminPermission("subscriptions"),
  asyncHandler(grantFreeMonthHandler)
);

router.post(
  "/subscriptions/:id/deactivate",
  requireAdminPermission("subscriptions"),
  asyncHandler(deactivatePremiumHandler)
);

router.get(
  "/marketplace",
  requireAdminPermission("marketplace"),
  asyncHandler(listMarketplaceAdminHandler)
);

router.get(
  "/marketplace/:id",
  requireAdminPermission("marketplace"),
  asyncHandler(getMarketplaceAdminHandler)
);

router.post(
  "/marketplace/:id/archive",
  requireAdminPermission("marketplace"),
  asyncHandler(archiveMarketplaceHandler)
);

router.post(
  "/marketplace/:id/hide",
  requireAdminPermission("marketplace"),
  asyncHandler(hideMarketplaceHandler)
);

router.post(
  "/marketplace/:id/restore",
  requireAdminPermission("marketplace"),
  asyncHandler(restoreMarketplaceHandler)
);

router.post(
  "/marketplace/:id/delete",
  requireAdminPermission("marketplace"),
  asyncHandler(deleteMarketplaceHandler)
);

router.get(
  "/notifications",
  requireAdminPermission("notifications"),
  asyncHandler(notificationsHandler)
);

router.get(
  "/reports/export/:type",
  requireAdminPermission("reports"),
  asyncHandler(exportReportHandler)
);

router.get(
  "/system",
  requireAdminPermission("settings"),
  asyncHandler(getSystemInfoHandler)
);

export default router;
