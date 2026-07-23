import { Types } from "mongoose";
import { GramSahakariApplication } from "../gram-sahakari/gram-sahakari.model";
import { findApplications } from "../gram-sahakari/repository/application.repository";
import {
  getApplicationById as getApplicationByIdService,
  listApplications as listApplicationsService,
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

const REGISTRATION_FEE_PAISE = 50_000; // ₹500

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
  permissions: admin.permissions,
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
  if (existing) return;

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
  ] = await Promise.all([
    GramSahakariApplication.countDocuments({}),
    GramSahakariApplication.countDocuments({ status: "DRAFT" }),
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
    GramSahakariApplication.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .select(
        "applicationNumber fullName district status paymentStatus createdAt"
      )
      .lean(),
  ]);

  const totalRevenuePaise = paidCount * REGISTRATION_FEE_PAISE;
  const payableAttempts = await GramSahakariApplication.countDocuments({
    paymentStatus: { $in: ["PAID", "FAILED", "PENDING", "AUTHORIZED"] },
  });

  return {
    totalApplications,
    draft,
    paymentPending,
    submitted,
    totalRevenuePaise,
    totalRevenueInr: totalRevenuePaise / 100,
    todayRegistrations,
    monthRegistrations,
    paidCount,
    paymentSuccessRate:
      payableAttempts === 0
        ? 0
        : Math.round((paidCount / payableAttempts) * 1000) / 10,
    recentApplications: recent.map((item) => ({
      id: String(item._id),
      applicationNumber: item.applicationNumber,
      fullName: item.fullName ?? null,
      district: item.district ?? null,
      status: item.status,
      paymentStatus: item.paymentStatus,
      createdAt: new Date(item.createdAt).toISOString(),
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

  return {
    items: items.map((item) => {
      const app = item as IGramSahakariApplication & { _id: Types.ObjectId };
      return {
        id: String(app._id),
        applicationNumber: app.applicationNumber,
        volunteerId: toVolunteerId(app.applicationNumber),
        fullName: app.fullName ?? null,
        phone: app.phone ?? null,
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
