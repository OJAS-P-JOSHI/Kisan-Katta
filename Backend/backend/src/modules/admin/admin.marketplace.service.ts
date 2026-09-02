import { Types, type HydratedDocument } from "mongoose";
import { AppError } from "../../utils/AppError";
import { AuthUser } from "../auth/auth.model";
import { FarmerProfile } from "../profile/profile.model";
import { MarketplaceListing, MarketplaceListingReport } from "../marketplace/marketplace.model";
import { toListingDTO } from "../marketplace/marketplace.service";
import type { IMarketplaceListing } from "../marketplace/marketplace.types";
import type { AdminProfileDTO } from "./admin.dto";
import { writeAdminAudit } from "./audit/admin-audit.service";

export type AdminMarketplaceListQuery = {
  search?: string;
  status?: string;
  listingType?: string;
  district?: string;
  hasReports?: boolean;
  page?: number;
  limit?: number;
};

const requireWritable = (admin: AdminProfileDTO) => {
  if (admin.role === "READ_ONLY") {
    throw new AppError("Read-only admins cannot moderate marketplace.", 403);
  }
};

export const listAdminMarketplace = async (
  query: AdminMarketplaceListQuery
) => {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  const filter: Record<string, unknown> = {};

  if (query.status?.trim()) filter.status = query.status.trim().toUpperCase();
  if (query.listingType?.trim()) filter.listingType = query.listingType.trim();
  if (query.district?.trim()) filter.district = query.district.trim();

  if (query.search?.trim()) {
    const q = query.search.trim();
    filter.$or = [
      { title: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      { district: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      { village: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      ...(Types.ObjectId.isValid(q)
        ? [
            { _id: new Types.ObjectId(q) },
            { sellerId: new Types.ObjectId(q) },
          ]
        : []),
    ];
  }

  if (query.hasReports === true) {
    const reportedIds = await MarketplaceListingReport.distinct("listingId");
    filter._id = { $in: reportedIds };
  }

  const [total, rows] = await Promise.all([
    MarketplaceListing.countDocuments(filter),
    MarketplaceListing.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const sellerIds = [...new Set(rows.map((r) => String(r.sellerId)))];
  const [users, profiles] = await Promise.all([
    AuthUser.find({ _id: { $in: sellerIds } })
      .select("mobile")
      .lean(),
    FarmerProfile.find({ userId: { $in: sellerIds } })
      .select("userId name district")
      .lean(),
  ]);
  const mobileById = new Map(users.map((u) => [String(u._id), u.mobile]));
  const profileById = new Map(
    profiles.map((p) => [String(p.userId), p])
  );

  const listingIds = rows.map((r) => r._id);
  const reportCounts = listingIds.length
    ? await MarketplaceListingReport.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { listingId: { $in: listingIds } } },
        { $group: { _id: "$listingId", count: { $sum: 1 } } },
      ])
    : [];
  const reportCountByListing = new Map(
    reportCounts.map((row) => [String(row._id), row.count])
  );

  const items = rows.map((doc) => {
    const dto = toListingDTO(doc as HydratedDocument<IMarketplaceListing>);
    const profile = profileById.get(String(doc.sellerId));
    const reportCount = reportCountByListing.get(String(doc._id)) ?? 0;
    return {
      ...dto,
      sellerMobile: mobileById.get(String(doc.sellerId)) ?? null,
      sellerName: profile?.name ?? null,
      sellerDistrict: profile?.district ?? null,
      reportCount,
      hasReports: reportCount > 0,
    };
  });

  return {
    items,
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
};

export const getAdminMarketplaceListing = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid listing id.", 400);
  }
  const doc = await MarketplaceListing.findById(id).lean();
  if (!doc) throw new AppError("Listing not found.", 404);

  const [user, profile, sellerHistory, reports] = await Promise.all([
    AuthUser.findById(doc.sellerId).select("mobile role").lean(),
    FarmerProfile.findOne({ userId: doc.sellerId })
      .select("name district village")
      .lean(),
    MarketplaceListing.find({ sellerId: doc.sellerId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    MarketplaceListingReport.find({ listingId: doc._id })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const reporterIds = [...new Set(reports.map((r) => String(r.userId)))];
  const reporters = reporterIds.length
    ? await AuthUser.find({ _id: { $in: reporterIds } })
        .select("mobile")
        .lean()
    : [];
  const reporterMobileById = new Map(
    reporters.map((u) => [String(u._id), u.mobile ?? null])
  );

  return {
    listing: toListingDTO(doc as HydratedDocument<IMarketplaceListing>),
    seller: {
      userId: String(doc.sellerId),
      mobile: user?.mobile ?? null,
      name: profile?.name ?? null,
      district: profile?.district ?? null,
      village: profile?.village ?? null,
    },
    reportCount: reports.length,
    hasReports: reports.length > 0,
    reports: reports.map((row) => ({
      id: String(row._id),
      listingId: String(row.listingId),
      userId: String(row.userId),
      reporterMobile: reporterMobileById.get(String(row.userId)) ?? null,
      reason: row.reason,
      details: row.details,
      createdAt: row.createdAt,
    })),
    sellerHistory: sellerHistory.map((row) =>
      toListingDTO(row as HydratedDocument<IMarketplaceListing>)
    ),
  };
};

type ModerationCtx = {
  admin: AdminProfileDTO;
  actorUserId: string;
  reason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

const setListingStatus = async (
  id: string,
  status: "ACTIVE" | "ARCHIVED" | "SOLD",
  action: string,
  ctx: ModerationCtx
) => {
  requireWritable(ctx.admin);
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid listing id.", 400);
  }

  const existing = await MarketplaceListing.findById(id);
  if (!existing) throw new AppError("Listing not found.", 404);

  const oldStatus = existing.status;
  existing.status = status;
  await existing.save();

  await writeAdminAudit({
    admin: ctx.admin,
    actorUserId: ctx.actorUserId,
    action,
    entity: "marketplace",
    entityId: id,
    affectedUserId: String(existing.sellerId),
    oldValue: { status: oldStatus },
    newValue: { status },
    reason: ctx.reason ?? null,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return toListingDTO(existing);
};

export const adminForceArchiveListing = (
  id: string,
  ctx: ModerationCtx
) => setListingStatus(id, "ARCHIVED", "MARKETPLACE_FORCE_ARCHIVE", ctx);

export const adminHideListing = (
  id: string,
  ctx: ModerationCtx
) => setListingStatus(id, "ARCHIVED", "MARKETPLACE_HIDE", ctx);

export const adminRestoreListing = async (
  id: string,
  ctx: ModerationCtx
) => {
  requireWritable(ctx.admin);
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid listing id.", 400);
  }
  const existing = await MarketplaceListing.findById(id);
  if (!existing) throw new AppError("Listing not found.", 404);

  if (existing.expiresAt.getTime() <= Date.now()) {
    throw new AppError("Cannot restore an expired listing. Ask seller to recreate.", 400);
  }

  return setListingStatus(id, "ACTIVE", "MARKETPLACE_RESTORE", ctx);
};

/** Soft-delete equivalent: force archive (hard delete avoided for auditability). */
export const adminDeleteListing = (
  id: string,
  ctx: ModerationCtx
) => setListingStatus(id, "ARCHIVED", "MARKETPLACE_DELETE", ctx);
