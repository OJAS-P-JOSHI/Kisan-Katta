import { Types } from "mongoose";
import { GramSahakariApplication } from "../gram-sahakari/gram-sahakari.model";
import { findApplications } from "../gram-sahakari/repository/application.repository";
import {
  buildExcludeUnstartedDraftsFilter,
  buildHasStartedApplicationFilter,
} from "../gram-sahakari/utils/application-progress";
import {
  getApplicationById as getApplicationByIdService,
  listApplications as listApplicationsService,
  resolveApplicationPhones,
} from "../gram-sahakari/service/application.service";
import type { AdminApplicationsQuery } from "../gram-sahakari/types/application.types";
import type { UserRole } from "../auth/auth.constants";
import type { IGramSahakariApplication } from "../gram-sahakari/interfaces/application.interface";
import { AppError } from "../../utils/AppError";
import {
  ROLE_PERMISSIONS,
  SUPER_ADMIN_SEED,
  type AdminPermission,
} from "./admin.constants";
import type {
  AdminProfileDTO,
  AnalyticsLocationBreakdownDTO,
  AnalyticsSummaryDTO,
  DashboardSummaryDTO,
  PaginatedPaymentsDTO,
  PaginatedVolunteersDTO,
} from "./admin.dto";
import type { IAdmin } from "./admin.model";
import {
  createAdmin,
  findAdminByPhone,
  findAdminByUserId,
  touchAdminLogin,
} from "./admin.repository";
import { Admin } from "./admin.model";
import {
  countFarmers,
  getRecentFarmerRegistrations,
} from "./admin.farmers.service";
import { FarmerProfile } from "../profile/profile.model";

/** TEMP TEST: keep in sync with payment.constants REGISTRATION_FEE_PAISE (₹1). Restore to 50_000. */
const REGISTRATION_FEE_PAISE = 100;

const toVolunteerId = (applicationNumber: string): string => {
  const raw = applicationNumber.trim().toUpperCase();
  const match = raw.match(/^GS-(\d{4})-(\d+)$/);
  if (match) return `GS-MH-${match[1]}-${match[2]}`;
  if (/^GS-MH-/.test(raw)) return raw;
  return `GS-MH-${raw.replace(/^GS-?/i, "")}`;
};

export const toAdminProfileDTO = (admin: IAdmin): AdminProfileDTO => ({
  id: String(admin._id),
  name: admin.name,
  phoneNumber: admin.phoneNumber,
  email: admin.email,
  role: admin.role,
  // SUPER_ADMIN always receives the latest permission catalog (additive grants).
  permissions:
    admin.role === "SUPER_ADMIN"
      ? [...ROLE_PERMISSIONS.SUPER_ADMIN]
      : admin.permissions,
  isActive: admin.isActive,
  address: admin.address,
  lastLoginAt: admin.lastLoginAt ? admin.lastLoginAt.toISOString() : null,
  createdAt: admin.createdAt.toISOString(),
});

/**
 * Idempotent bootstrap of the first SUPER_ADMIN.
 * Safe to call on every server start.
 */
export const seedSuperAdmin = async (): Promise<void> => {
  const existing = await findAdminByPhone(SUPER_ADMIN_SEED.phoneNumber);
  if (existing) {
    // Keep the seeded SUPER_ADMIN permission catalog in sync as new modules ship.
    const catalog = ROLE_PERMISSIONS.SUPER_ADMIN;
    const missing = catalog.filter((p) => !existing.permissions.includes(p));
    if (missing.length > 0 || existing.permissions.length !== catalog.length) {
      await Admin.findByIdAndUpdate(existing._id, {
        $set: { permissions: [...catalog] },
      });
      // eslint-disable-next-line no-console
      console.log(
        `[Admin] Synced SUPER_ADMIN permissions (+${missing.join(",") || "refresh"})`
      );
    }
    return;
  }

  await createAdmin({
    name: SUPER_ADMIN_SEED.name,
    phoneNumber: SUPER_ADMIN_SEED.phoneNumber,
    email: SUPER_ADMIN_SEED.email,
    role: SUPER_ADMIN_SEED.role,
    permissions: ROLE_PERMISSIONS.SUPER_ADMIN,
    address: { ...SUPER_ADMIN_SEED.address },
  });

  // eslint-disable-next-line no-console
  console.log(
    `[Admin] Seeded SUPER_ADMIN ${SUPER_ADMIN_SEED.name} (${SUPER_ADMIN_SEED.phoneNumber})`
  );
};

/**
 * After OTP success: if mobile belongs to an active admin, link AuthUser and
 * return the admin profile. Does not trust the client — phone is post-verify.
 */
export const resolveAdminAfterAuth = async (
  userId: string,
  mobile: string
): Promise<AdminProfileDTO | null> => {
  const admin = await findAdminByPhone(mobile);
  if (!admin || !admin.isActive) return null;

  const updated = await touchAdminLogin(String(admin._id), userId);
  return toAdminProfileDTO(updated ?? admin);
};

export const getAdminForUser = async (
  userId: string
): Promise<AdminProfileDTO | null> => {
  const admin = await findAdminByUserId(userId);
  if (!admin) return null;
  return toAdminProfileDTO(admin);
};

/** Session restore /me — look up admin without bumping lastLoginAt. */
export const lookupAdminForSession = async (
  userId: string,
  mobile: string
): Promise<AdminProfileDTO | null> => {
  const byUser = await findAdminByUserId(userId);
  if (byUser) return toAdminProfileDTO(byUser);

  const byPhone = await findAdminByPhone(mobile);
  if (!byPhone || !byPhone.isActive) return null;

  // Soft-link userId if seed predated first login; do not touch lastLoginAt.
  if (!byPhone.userId || String(byPhone.userId) !== userId) {
    await Admin.findByIdAndUpdate(byPhone._id, { $set: { userId } });
  }

  return toAdminProfileDTO(byPhone);
};

export const assertPermission = (
  admin: AdminProfileDTO,
  permission: AdminPermission
): void => {
  if (!admin.permissions.includes(permission)) {
    throw new AppError("You do not have permission for this action.", 403);
  }
};

export const getDashboardSummary = async (): Promise<DashboardSummaryDTO> => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalApplications,
    draft,
    paymentPending,
    submitted,
    paidCount,
    todayRegistrations,
    monthRegistrations,
    recent,
    totalFarmers,
    recentFarmers,
  ] = await Promise.all([
    GramSahakariApplication.countDocuments({}),
    GramSahakariApplication.countDocuments({
      status: "DRAFT",
      ...buildHasStartedApplicationFilter(),
    }),
    GramSahakariApplication.countDocuments({ status: "PAYMENT_PENDING" }),
    GramSahakariApplication.countDocuments({ status: "SUBMITTED" }),
    GramSahakariApplication.countDocuments({ paymentStatus: "PAID" }),
    GramSahakariApplication.countDocuments({
      status: "SUBMITTED",
      submittedAt: { $gte: startOfToday },
    }),
    GramSahakariApplication.countDocuments({
      status: "SUBMITTED",
      submittedAt: { $gte: startOfMonth },
    }),
    GramSahakariApplication.find(buildExcludeUnstartedDraftsFilter())
      .sort({ createdAt: -1 })
      .limit(8)
      .select(
        "applicationNumber fullName phone userId district status paymentStatus createdAt"
      )
      .lean(),
    countFarmers(),
    getRecentFarmerRegistrations(8),
  ]);

  const totalRevenuePaise = paidCount * REGISTRATION_FEE_PAISE;
  const payableAttempts = await GramSahakariApplication.countDocuments({
    paymentStatus: { $in: ["PAID", "FAILED", "PENDING", "AUTHORIZED"] },
  });

  const recentAsApps = recent as unknown as IGramSahakariApplication[];
  const recentPhones = await resolveApplicationPhones(recentAsApps);

  return {
    totalApplications,
    draft,
    paymentPending,
    submitted,
    totalFarmers,
    totalGramSahakaris: paidCount,
    totalRevenuePaise,
    totalRevenueInr: totalRevenuePaise / 100,
    todayRegistrations,
    monthRegistrations,
    paidCount,
    paymentSuccessRate:
      payableAttempts === 0
        ? 0
        : Math.round((paidCount / payableAttempts) * 1000) / 10,
    recentApplications: recent.map((item) => {
      const phoneNumber = recentPhones.get(String(item._id)) ?? null;
      return {
        id: String(item._id),
        applicationNumber: item.applicationNumber,
        fullName: item.fullName ?? null,
        phoneNumber,
        district: item.district ?? null,
        status: item.status,
        paymentStatus: item.paymentStatus,
        createdAt: new Date(item.createdAt).toISOString(),
      };
    }),
    recentFarmers: recentFarmers.map((farmer) => ({
      id: farmer.id,
      name: farmer.name,
      mobile: farmer.mobile,
      district: farmer.district,
      village: farmer.village,
      registeredAt: farmer.registeredAt,
      accountStatus: farmer.accountStatus,
    })),
  };
};

export const getAnalyticsSummary = async (): Promise<AnalyticsSummaryDTO> => {
  const [dashboard, districtAgg, statusAgg, monthlyAgg] = await Promise.all([
    getDashboardSummary(),
    GramSahakariApplication.aggregate<{ _id: string; count: number }>([
      { $match: { district: { $type: "string", $ne: "" } } },
      { $group: { _id: "$district", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
    GramSahakariApplication.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    GramSahakariApplication.aggregate<{
      _id: { year: number; month: number };
      applications: number;
      paid: number;
    }>([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          applications: { $sum: 1 },
          paid: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "PAID"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]),
  ]);

  return {
    revenueInr: dashboard.totalRevenueInr,
    applications: dashboard.totalApplications,
    paymentSuccessRate: dashboard.paymentSuccessRate,
    monthlyGrowth: monthlyAgg.map((row) => {
      const label = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
      return {
        month: label,
        applications: row.applications,
        revenueInr: (row.paid * REGISTRATION_FEE_PAISE) / 100,
      };
    }),
    districtDistribution: districtAgg.map((row) => ({
      district: row._id || "Unknown",
      count: row.count,
    })),
    statusBreakdown: statusAgg.map((row) => ({
      status: row._id,
      count: row.count,
    })),
  };
};

/**
 * Farmer profile location breakdown.
 * - no filters → districts
 * - district → talukas in that district
 * - district + taluka → villages in that taluka
 */
export const getAnalyticsLocationBreakdown = async (input: {
  district?: string;
  taluka?: string;
  limit?: number;
}): Promise<AnalyticsLocationBreakdownDTO> => {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const district = input.district?.trim() || null;
  const taluka = input.taluka?.trim() || null;

  if (taluka && !district) {
    throw new AppError("district is required when filtering by taluka.", 400);
  }

  const match: Record<string, unknown> = {};
  let level: AnalyticsLocationBreakdownDTO["level"] = "district";
  let groupField = "$district";

  if (district && taluka) {
    match.district = district;
    match.taluka = taluka;
    match.village = { $type: "string", $ne: "" };
    level = "village";
    groupField = "$village";
  } else if (district) {
    match.district = district;
    match.taluka = { $type: "string", $ne: "" };
    level = "taluka";
    groupField = "$taluka";
  } else {
    match.district = { $type: "string", $ne: "" };
    level = "district";
    groupField = "$district";
  }

  const [items, totalInScope] = await Promise.all([
    FarmerProfile.aggregate<{ _id: string | null; count: number }>([
      { $match: match },
      { $group: { _id: groupField, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]),
    FarmerProfile.countDocuments(match),
  ]);

  return {
    source: "farmers",
    level,
    district,
    taluka,
    items: items.map((row) => ({
      name: (row._id && String(row._id).trim()) || "Unknown",
      count: row.count,
    })),
    totalInScope,
  };
};

export const listAdminApplications = (
  query: AdminApplicationsQuery,
  actor: { userId: string; role: UserRole }
) => listApplicationsService(query, actor);

export const getAdminApplicationById = (
  applicationId: string,
  actor: { userId: string; role: UserRole }
) => getApplicationByIdService(applicationId, actor);

export const listVolunteers = async (input: {
  search?: string;
  district?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedVolunteersDTO> => {
  const page = input.page ?? 1;
  const limit = Math.min(input.limit ?? 20, 100);

  const { items, total } = await findApplications({
    status: "SUBMITTED",
    paymentStatus: "PAID",
    search: input.search,
    district: input.district,
    page,
    limit,
  });

  const phones = await resolveApplicationPhones(items);

  return {
    items: items.map((item) => {
      const app = item as IGramSahakariApplication & { _id: Types.ObjectId };
      const phoneNumber = phones.get(String(app._id)) ?? null;
      return {
        id: String(app._id),
        applicationNumber: app.applicationNumber,
        volunteerId: toVolunteerId(app.applicationNumber),
        fullName: app.fullName ?? null,
        phone: phoneNumber,
        phoneNumber,
        district: app.district ?? null,
        taluka: app.taluka ?? null,
        village: app.village ?? null,
        submittedAt: app.submittedAt
          ? new Date(app.submittedAt).toISOString()
          : null,
        photoUrl: app.photo?.url ?? null,
      };
    }),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const listPayments = async (input: {
  search?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedPaymentsDTO> => {
  const page = input.page ?? 1;
  const limit = Math.min(input.limit ?? 20, 100);

  const filter: Record<string, unknown> = {
    // Only rows that entered the payment path
    paymentStatus: { $nin: ["NOT_REQUIRED"] },
  };

  if (input.paymentStatus) {
    filter.paymentStatus = input.paymentStatus;
  }

  if (input.search?.trim()) {
    const q = input.search.trim();
    filter.$or = [
      { applicationNumber: { $regex: q, $options: "i" } },
      { fullName: { $regex: q, $options: "i" } },
      { "payment.razorpayOrderId": { $regex: q, $options: "i" } },
      { "payment.razorpayPaymentId": { $regex: q, $options: "i" } },
      { paymentReference: { $regex: q, $options: "i" } },
    ];
  }

  const [total, items] = await Promise.all([
    GramSahakariApplication.countDocuments(filter),
    GramSahakariApplication.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "applicationNumber fullName paymentStatus paymentReference payment submittedAt updatedAt"
      )
      .lean(),
  ]);

  return {
    items: items.map((item) => {
      const payment = (item as { payment?: Record<string, unknown> }).payment;
      const amountPaise =
        typeof payment?.amount === "number"
          ? (payment.amount as number)
          : REGISTRATION_FEE_PAISE;
      return {
        applicationId: String(item._id),
        applicationNumber: item.applicationNumber,
        fullName: item.fullName ?? null,
        amountPaise,
        amountInr: amountPaise / 100,
        paymentStatus: item.paymentStatus,
        razorpayOrderId:
          (payment?.razorpayOrderId as string | undefined) ?? null,
        razorpayPaymentId:
          (payment?.razorpayPaymentId as string | undefined) ??
          item.paymentReference ??
          null,
        paidAt: item.submittedAt
          ? new Date(item.submittedAt).toISOString()
          : null,
        updatedAt: new Date(item.updatedAt).toISOString(),
      };
    }),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};
