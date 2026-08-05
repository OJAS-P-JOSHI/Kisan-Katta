import mongoose from "mongoose";
import { AppError } from "../../utils/AppError";
import { isRazorpayConfigured } from "../../config/razorpay";
import { AuthUser } from "../auth/auth.model";
import { FarmerProfile } from "../profile/profile.model";
import { GramSahakariApplication } from "../gram-sahakari/gram-sahakari.model";
import { HelpRequest, HelpRequestReport } from "../assistance/assistance.model";
import { MarketplaceListing } from "../marketplace/marketplace.model";
import { UserSubscription } from "../subscription/subscription.model";
import { RazorpayEvent } from "../payment/payment-event.model";
import type { IUserSubscription } from "../subscription/interfaces/subscription.interface";
import { toBillingPaymentDTO } from "../subscription/dto/subscription.dto";
import { REGISTRATION_FEE_PAISE } from "../payment/payment.constants";

export const getEnhancedDashboardMetrics = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    todayFarmers,
    activeSubscriptions,
    pendingSubs,
    haltedSubs,
    pendingRefunds,
    marketplaceActive,
    helpOpen,
    helpPending,
    reportedPosts,
    pendingGsPayments,
    subBillingAgg,
  ] = await Promise.all([
    FarmerProfile.countDocuments({ createdAt: { $gte: startOfToday } }),
    UserSubscription.countDocuments({
      status: { $in: ["ACTIVE", "AUTHENTICATED"] },
      $or: [{ accessRevokedAt: null }, { accessRevokedAt: { $exists: false } }],
    }),
    UserSubscription.countDocuments({ status: "PENDING" }),
    UserSubscription.countDocuments({ status: "HALTED" }),
    UserSubscription.countDocuments({
      "billingPayments.status": "PAID",
      status: "CANCELLED",
      accessRevokedAt: { $ne: null },
    }),
    MarketplaceListing.countDocuments({
      status: "ACTIVE",
      expiresAt: { $gt: new Date() },
    }),
    HelpRequest.countDocuments({ status: "OPEN", isDeleted: false }),
    HelpRequest.countDocuments({ status: "PENDING_REVIEW", isDeleted: false }),
    HelpRequestReport.countDocuments({}),
    GramSahakariApplication.countDocuments({
      paymentStatus: { $in: ["PENDING", "AUTHORIZED"] },
    }),
    UserSubscription.aggregate([
      { $unwind: "$billingPayments" },
      { $match: { "billingPayments.status": { $in: ["PAID", "REFUNDED"] } } },
      {
        $group: {
          _id: "$billingPayments.status",
          total: { $sum: "$billingPayments.amount" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const paidBilling = subBillingAgg.find((r) => r._id === "PAID");
  const refundedBilling = subBillingAgg.find((r) => r._id === "REFUNDED");

  const gsPaid = await GramSahakariApplication.countDocuments({
    paymentStatus: "PAID",
  });

  const dbState = mongoose.connection.readyState;
  const databaseStatus =
    dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";

  const recentFailedEvents = await RazorpayEvent.countDocuments({
    processingResult: "FAILED",
    receivedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  return {
    todayFarmers,
    activeSubscriptions,
    pendingSubscriptions: pendingSubs,
    haltedSubscriptions: haltedSubs,
    pendingRefundsApprox: pendingRefunds,
    subscriptionRevenuePaise: paidBilling?.total ?? 0,
    subscriptionRevenueInr: (paidBilling?.total ?? 0) / 100,
    subscriptionRefundedPaise: refundedBilling?.total ?? 0,
    marketplaceActiveListings: marketplaceActive,
    helpOpenRequests: helpOpen,
    helpPendingReview: helpPending,
    reportedPosts,
    pendingGsPayments,
    gsRevenueInr: (gsPaid * REGISTRATION_FEE_PAISE) / 100,
    systemHealth: {
      databaseStatus,
      apiStatus: "ok",
      razorpayConfigured: isRazorpayConfigured(),
      serverTime: new Date().toISOString(),
    },
    schedulerHealth: {
      failedWebhookEvents24h: recentFailedEvents,
      note: "Subscription and GS payment reconcilers run on interval schedulers.",
    },
  };
};

export type PaymentCenterQuery = {
  search?: string;
  source?: "ALL" | "GS" | "SUBSCRIPTION";
  status?: string;
  page?: number;
  limit?: number;
};

export const listPaymentCenter = async (query: PaymentCenterQuery) => {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  const source = query.source ?? "ALL";
  const items: Array<Record<string, unknown>> = [];

  if (source === "ALL" || source === "GS") {
    const filter: Record<string, unknown> = {
      razorpayPaymentId: { $type: "string" },
    };
    if (query.status?.trim()) filter.paymentStatus = query.status.trim().toUpperCase();
    if (query.search?.trim()) {
      const q = query.search.trim();
      filter.$or = [
        { razorpayPaymentId: q },
        { razorpayOrderId: q },
        { applicationNumber: q.toUpperCase() },
        { refundId: q },
      ];
    }
    const rows = await GramSahakariApplication.find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit * 2)
      .lean();
    for (const row of rows) {
      items.push({
        source: "GS",
        paymentId: row.razorpayPaymentId,
        orderId: row.razorpayOrderId,
        refundId: row.refundId ?? null,
        amountPaise: row.paymentAmount,
        status: row.paymentStatus,
        userId: String(row.userId),
        mobile: typeof row.phone === "string" && row.phone.trim() ? row.phone.trim() : null,
        applicationId: String(row._id),
        applicationNumber: row.applicationNumber,
        subscriptionId: null,
        paidAt: row.paidAt ? row.paidAt.toISOString() : null,
        updatedAt: row.updatedAt.toISOString(),
      });
    }
  }

  if (source === "ALL" || source === "SUBSCRIPTION") {
    const filter: Record<string, unknown> = {
      "billingPayments.0": { $exists: true },
    };
    if (query.search?.trim()) {
      const q = query.search.trim();
      filter.$or = [
        { "billingPayments.paymentId": q },
        { "billingPayments.refundId": q },
        { subscriptionId: q },
        { latestPaymentId: q },
      ];
    }
    const rows = await UserSubscription.find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit * 2)
      .lean<IUserSubscription[]>();

    for (const row of rows) {
      for (const payment of row.billingPayments ?? []) {
        if (
          query.status?.trim() &&
          payment.status !== query.status.trim().toUpperCase()
        ) {
          continue;
        }
        if (
          query.search?.trim() &&
          ![
            payment.paymentId,
            payment.refundId,
            row.subscriptionId,
            row.latestPaymentId,
          ].includes(query.search.trim())
        ) {
          // keep when parent matched via $or
        }
        items.push({
          source: "SUBSCRIPTION",
          paymentId: payment.paymentId,
          orderId: null,
          refundId: payment.refundId ?? null,
          amountPaise: payment.amount,
          status: payment.status,
          userId: String(row.userId),
          mobile: null,
          applicationId: null,
          applicationNumber: null,
          subscriptionId: row.subscriptionId,
          subscriptionDocId: String(row._id),
          paidAt: payment.paidAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          billing: toBillingPaymentDTO(payment),
        });
      }
    }
  }

  items.sort(
    (a, b) =>
      new Date(String(b.updatedAt)).getTime() -
      new Date(String(a.updatedAt)).getTime()
  );

  const total = items.length;
  const sliced = items.slice((page - 1) * limit, page * limit);

  const userIds = [
    ...new Set(
      sliced
        .map((item) => String(item.userId ?? ""))
        .filter((id) => mongoose.isValidObjectId(id))
    ),
  ];
  if (userIds.length > 0) {
    const users = await AuthUser.find({ _id: { $in: userIds } })
      .select("mobile")
      .lean();
    const mobileById = new Map(
      users.map((user) => [String(user._id), user.mobile])
    );
    for (const item of sliced) {
      const authMobile = mobileById.get(String(item.userId));
      if (authMobile) item.mobile = authMobile;
    }
  }

  return {
    items: sliced,
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
};

export const getAdminNotifications = async () => {
  const [failedPayments, pendingGs, pendingHelp, haltedSubs] =
    await Promise.all([
      RazorpayEvent.find({ processingResult: "FAILED" })
        .sort({ receivedAt: -1 })
        .limit(20)
        .lean(),
      GramSahakariApplication.find({
        paymentStatus: { $in: ["PENDING", "AUTHORIZED"] },
      })
        .sort({ updatedAt: -1 })
        .limit(20)
        .select("applicationNumber paymentStatus userId updatedAt")
        .lean(),
      HelpRequest.find({ status: "PENDING_REVIEW", isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(20)
        .select("title author status createdAt")
        .lean(),
      UserSubscription.find({ status: { $in: ["HALTED", "PENDING"] } })
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean(),
    ]);

  const notifications = [
    ...failedPayments.map((e) => ({
      id: String(e._id),
      type: "FAILED_PAYMENT_EVENT",
      title: `Webhook failed: ${e.eventType}`,
      href: "/admin/payments",
      createdAt: e.receivedAt.toISOString(),
    })),
    ...pendingGs.map((a) => ({
      id: String(a._id),
      type: "PENDING_GS_PAYMENT",
      title: `GS payment pending · ${a.applicationNumber}`,
      href: `/admin/gram-sahakari/${a._id}`,
      createdAt: a.updatedAt.toISOString(),
    })),
    ...pendingHelp.map((h) => ({
      id: String(h._id),
      type: "PENDING_ASSISTANCE",
      title: `Help request pending · ${h.title}`,
      href: "/admin/assistance",
      createdAt: h.createdAt.toISOString(),
    })),
    ...haltedSubs.map((s) => ({
      id: String(s._id),
      type: "SUBSCRIPTION_ISSUE",
      title: `Subscription ${s.status} · ${s.subscriptionId ?? s._id}`,
      href: `/admin/users/${s.userId}?tab=subscription`,
      createdAt: s.updatedAt.toISOString(),
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 50);

  return { items: notifications, unreadApprox: notifications.length };
};

const loadMobileByUserId = async (
  userIds: Array<string | mongoose.Types.ObjectId | null | undefined>
): Promise<Map<string, string>> => {
  const ids = [
    ...new Set(
      userIds
        .map((id) => String(id ?? ""))
        .filter((id) => mongoose.isValidObjectId(id))
    ),
  ];
  if (ids.length === 0) return new Map();
  const users = await AuthUser.find({ _id: { $in: ids } })
    .select("mobile")
    .lean();
  return new Map(users.map((u) => [String(u._id), u.mobile]));
};

export const exportAdminReportCsv = async (
  type: string
): Promise<{ filename: string; csv: string }> => {
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const linesOf = (header: string, rows: unknown[][]) =>
    [header, ...rows.map((cols) => cols.map(escape).join(","))].join("\n");

  if (type === "users") {
    const rows = await FarmerProfile.find({})
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();
    const mobileById = await loadMobileByUserId(rows.map((r) => r.userId));
    return {
      filename: "farmers-export.csv",
      csv: linesOf(
        "mobile,name,userId,district,taluka,village,createdAt",
        rows.map((r) => [
          mobileById.get(String(r.userId)) ?? "",
          r.name,
          r.userId,
          r.district,
          r.taluka,
          r.village,
          r.createdAt.toISOString(),
        ])
      ),
    };
  }

  if (type === "subscriptions") {
    const rows = await UserSubscription.find({})
      .sort({ updatedAt: -1 })
      .limit(5000)
      .lean<IUserSubscription[]>();
    const mobileById = await loadMobileByUserId(rows.map((r) => r.userId));
    return {
      filename: "subscriptions-export.csv",
      csv: linesOf(
        "mobile,userId,subscriptionId,customerId,status,amountPaise,amountInr,currentPeriodEnd,latestPaymentId,cancelledAt,accessRevokedAt",
        rows.map((r) => [
          mobileById.get(String(r.userId)) ?? "",
          r.userId,
          r.subscriptionId,
          r.customerId ?? "",
          r.status,
          r.amount,
          (r.amount ?? 0) / 100,
          r.currentPeriodEnd?.toISOString() ?? "",
          r.latestPaymentId ?? "",
          r.cancelledAt?.toISOString() ?? "",
          r.accessRevokedAt?.toISOString() ?? "",
        ])
      ),
    };
  }

  if (type === "marketplace") {
    const rows = await MarketplaceListing.find({})
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();
    return {
      filename: "marketplace-export.csv",
      csv: linesOf(
        "id,sellerId,listingType,title,status,district,price,createdAt",
        rows.map((r) => [
          r._id,
          r.sellerId,
          r.listingType,
          r.title,
          r.status,
          r.district,
          r.price,
          r.createdAt.toISOString(),
        ])
      ),
    };
  }

  if (type === "gram-sahakari") {
    const rows = await GramSahakariApplication.find({})
      .sort({ updatedAt: -1 })
      .limit(5000)
      .lean();
    const mobileById = await loadMobileByUserId(rows.map((r) => r.userId));
    return {
      filename: "gram-sahakari-export.csv",
      csv: linesOf(
        "applicationNumber,mobile,fullName,userId,status,paymentStatus,district,taluka,village,amountInr,razorpayOrderId,razorpayPaymentId,refundId,paidAt,createdAt",
        rows.map((r) => [
          r.applicationNumber,
          mobileById.get(String(r.userId)) ?? r.phone ?? "",
          r.fullName ?? "",
          r.userId,
          r.status,
          r.paymentStatus,
          r.district ?? "",
          r.taluka ?? "",
          r.village ?? "",
          typeof r.paymentAmount === "number" ? r.paymentAmount / 100 : "",
          r.razorpayOrderId ?? "",
          r.razorpayPaymentId ?? "",
          r.refundId ?? "",
          r.paidAt?.toISOString() ?? "",
          r.createdAt.toISOString(),
        ])
      ),
    };
  }

  if (type === "payments") {
    const gsRows = await GramSahakariApplication.find({
      razorpayPaymentId: { $type: "string" },
    })
      .sort({ paidAt: -1, updatedAt: -1 })
      .limit(5000)
      .lean();
    const subRows = await UserSubscription.find({
      "billingPayments.0": { $exists: true },
    })
      .sort({ updatedAt: -1 })
      .limit(2000)
      .lean<IUserSubscription[]>();

    const mobileById = await loadMobileByUserId([
      ...gsRows.map((r) => r.userId),
      ...subRows.map((r) => r.userId),
    ]);

    const paymentLines: unknown[][] = [];
    for (const r of gsRows) {
      paymentLines.push([
        r.paidAt?.toISOString() ?? r.updatedAt.toISOString(),
        "GS",
        mobileById.get(String(r.userId)) ?? r.phone ?? "",
        r.fullName ?? "",
        r.userId,
        r.district ?? "",
        typeof r.paymentAmount === "number" ? r.paymentAmount / 100 : "",
        r.paymentStatus,
        r.refundId ? "REFUNDED" : "NONE",
        r.refundId && typeof r.paymentAmount === "number"
          ? r.paymentAmount / 100
          : "",
        r.razorpayPaymentId ?? "",
        r.razorpayOrderId ?? "",
        "",
        "",
        r.paymentMethod ?? "",
        r.applicationNumber,
        r.refundId ?? "",
      ]);
    }
    for (const row of subRows) {
      for (const payment of row.billingPayments ?? []) {
        paymentLines.push([
          payment.paidAt?.toISOString() ?? row.updatedAt.toISOString(),
          "SUBSCRIPTION",
          mobileById.get(String(row.userId)) ?? "",
          "",
          row.userId,
          "",
          (payment.amount ?? 0) / 100,
          payment.status,
          payment.refundId ? "REFUNDED" : "NONE",
          typeof payment.refundAmount === "number"
            ? payment.refundAmount / 100
            : payment.refundId
              ? (payment.amount ?? 0) / 100
              : "",
          payment.paymentId ?? "",
          "",
          row.subscriptionId ?? "",
          row.customerId ?? "",
          payment.paymentMethod ?? row.paymentMethod ?? "",
          "",
          payment.refundId ?? "",
        ]);
      }
    }

    paymentLines.sort(
      (a, b) =>
        new Date(String(b[0])).getTime() - new Date(String(a[0])).getTime()
    );

    return {
      filename: "payments-ledger-export.csv",
      csv: linesOf(
        "date,paymentType,mobile,name,userId,district,amountInr,status,refundStatus,refundAmountInr,razorpayPaymentId,razorpayOrderId,subscriptionId,customerId,paymentMethod,applicationNumber,refundId",
        paymentLines
      ),
    };
  }

  if (type === "revenue") {
    const [gsPaid, gsRefunded, subAgg] = await Promise.all([
      GramSahakariApplication.countDocuments({ paymentStatus: "PAID" }),
      GramSahakariApplication.countDocuments({ paymentStatus: "REFUNDED" }),
      UserSubscription.aggregate([
        { $unwind: "$billingPayments" },
        {
          $match: {
            "billingPayments.status": { $in: ["PAID", "REFUNDED"] },
          },
        },
        {
          $group: {
            _id: "$billingPayments.status",
            total: { $sum: "$billingPayments.amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);
    const paidBilling = subAgg.find((r) => r._id === "PAID");
    const refundedBilling = subAgg.find((r) => r._id === "REFUNDED");
    const gsGross = (gsPaid * REGISTRATION_FEE_PAISE) / 100;
    const gsRefunds = (gsRefunded * REGISTRATION_FEE_PAISE) / 100;
    const subGross = (paidBilling?.total ?? 0) / 100;
    const subRefunds = (refundedBilling?.total ?? 0) / 100;
    const generatedAt = new Date().toISOString();
    return {
      filename: "revenue-summary-export.csv",
      csv: linesOf(
        "source,grossInr,refundsInr,netInr,paidCount,refundedCount,generatedAt",
        [
          [
            "gram_sahakari",
            gsGross,
            gsRefunds,
            gsGross - gsRefunds,
            gsPaid,
            gsRefunded,
            generatedAt,
          ],
          [
            "subscriptions",
            subGross,
            subRefunds,
            subGross - subRefunds,
            paidBilling?.count ?? 0,
            refundedBilling?.count ?? 0,
            generatedAt,
          ],
          [
            "TOTAL",
            gsGross + subGross,
            gsRefunds + subRefunds,
            gsGross + subGross - (gsRefunds + subRefunds),
            gsPaid + (paidBilling?.count ?? 0),
            gsRefunded + (refundedBilling?.count ?? 0),
            generatedAt,
          ],
        ]
      ),
    };
  }

  throw new AppError(
    "Unknown report type. Use users|subscriptions|marketplace|gram-sahakari|payments|revenue.",
    400
  );
};
