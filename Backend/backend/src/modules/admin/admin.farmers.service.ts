import { Types } from "mongoose";
import mongoose, { type PipelineStage } from "mongoose";
import { AppError } from "../../utils/AppError";
import { env } from "../../config/env";
import { AuthUser } from "../auth/auth.model";
import { FarmerProfile } from "../profile/profile.model";
import { GramSahakariApplication } from "../gram-sahakari/gram-sahakari.model";
import type {
  FarmerDetailDTO,
  FarmerListItemDTO,
  PaginatedFarmersDTO,
  SystemInfoDTO,
} from "./admin.dto";

const ACTIVE_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;
const MAHARASHTRA = "Maharashtra";

const deriveAccountStatus = (
  lastLoginAt: Date | null | undefined,
  isVerified: boolean
): "ACTIVE" | "INACTIVE" => {
  if (!isVerified) return "INACTIVE";
  if (!lastLoginAt) return "INACTIVE";
  return Date.now() - lastLoginAt.getTime() <= ACTIVE_WINDOW_MS
    ? "ACTIVE"
    : "INACTIVE";
};

const languageLabel = (code: string): string => {
  if (code === "mr") return "Marathi";
  if (code === "hi") return "Hindi";
  if (code === "en") return "English";
  return code;
};

export type FarmerListQuery = {
  search?: string;
  district?: string;
  taluka?: string;
  fromDate?: string;
  toDate?: string;
  accountStatus?: "ACTIVE" | "INACTIVE";
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "name" | "lastLoginAt";
  sortOrder?: "asc" | "desc";
};

type FarmerAggRow = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  district: string;
  taluka: string;
  village: string;
  favoriteCrops: string[];
  language: string;
  profileImage?: { url: string; publicId: string } | null;
  createdAt: Date;
  updatedAt: Date;
  auth: {
    mobile: string;
    role: string;
    isVerified: boolean;
    isProfileCompleted: boolean;
    lastLoginAt: Date | null;
  } | null;
};

const farmerLookupStages: PipelineStage[] = [
  {
    $lookup: {
      from: "auth_users",
      localField: "userId",
      foreignField: "_id",
      as: "auth",
    },
  },
  { $unwind: { path: "$auth", preserveNullAndEmptyArrays: true } },
];

const toListItem = (row: FarmerAggRow): FarmerListItemDTO => {
  const lastLoginAt = row.auth?.lastLoginAt ?? null;
  const accountStatus = deriveAccountStatus(
    lastLoginAt,
    row.auth?.isVerified ?? false
  );

  return {
    id: String(row._id),
    userId: String(row.userId),
    name: row.name,
    mobile: row.auth?.mobile ?? null,
    photoUrl: row.profileImage?.url ?? null,
    village: row.village,
    taluka: row.taluka,
    district: row.district,
    state: MAHARASHTRA,
    registeredAt: row.createdAt.toISOString(),
    language: row.language,
    languageLabel: languageLabel(row.language),
    favoriteCrops: row.favoriteCrops ?? [],
    lastActiveAt: lastLoginAt ? lastLoginAt.toISOString() : null,
    accountStatus,
    role: row.auth?.role ?? "FARMER",
  };
};

export const listFarmers = async (
  query: FarmerListQuery
): Promise<PaginatedFarmersDTO> => {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  const sortBy = query.sortBy ?? "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const match: Record<string, unknown> = {};
  if (query.district?.trim()) match.district = query.district.trim();
  if (query.taluka?.trim()) match.taluka = query.taluka.trim();

  if (query.fromDate || query.toDate) {
    const createdAt: Record<string, Date> = {};
    if (query.fromDate) createdAt.$gte = new Date(query.fromDate);
    if (query.toDate) createdAt.$lte = new Date(query.toDate);
    match.createdAt = createdAt;
  }

  const pipeline: PipelineStage[] = [];
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }
  pipeline.push(...farmerLookupStages);

  if (query.search?.trim()) {
    const q = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: q, $options: "i" };
    pipeline.push({
      $match: {
        $or: [
          { name: regex },
          { village: regex },
          { district: regex },
          { taluka: regex },
          { "auth.mobile": regex },
        ],
      },
    });
  }

  // Account status is derived — filter after join.
  if (query.accountStatus === "ACTIVE" || query.accountStatus === "INACTIVE") {
    const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MS);
    if (query.accountStatus === "ACTIVE") {
      pipeline.push({
        $match: {
          "auth.isVerified": true,
          "auth.lastLoginAt": { $gte: cutoff },
        },
      });
    } else {
      pipeline.push({
        $match: {
          $or: [
            { "auth.isVerified": { $ne: true } },
            { "auth.lastLoginAt": null },
            { "auth.lastLoginAt": { $lt: cutoff } },
          ],
        },
      });
    }
  }

  const sortField =
    sortBy === "name"
      ? "name"
      : sortBy === "lastLoginAt"
        ? "auth.lastLoginAt"
        : "createdAt";

  const [countResult, items] = await Promise.all([
    FarmerProfile.aggregate<{ total: number }>([
      ...pipeline,
      { $count: "total" },
    ]),
    FarmerProfile.aggregate<FarmerAggRow>([
      ...pipeline,
      { $sort: { [sortField]: sortOrder } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]),
  ]);

  const total = countResult[0]?.total ?? 0;

  return {
    items: items.map(toListItem),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getFarmerById = async (id: string): Promise<FarmerDetailDTO> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Farmer not found.", 404);
  }

  const rows = await FarmerProfile.aggregate<FarmerAggRow>([
    { $match: { _id: new Types.ObjectId(id) } },
    ...farmerLookupStages,
  ]);

  const row = rows[0];
  if (!row) throw new AppError("Farmer not found.", 404);

  const base = toListItem(row);
  const applicationCount = await GramSahakariApplication.countDocuments({
    userId: row.userId,
  });

  return {
    ...base,
    email: null,
    gender: null,
    dob: null,
    pincode: null,
    farmSize: null,
    farmingType: null,
    device: null,
    isVerified: row.auth?.isVerified ?? false,
    isProfileCompleted: row.auth?.isProfileCompleted ?? false,
    updatedAt: row.updatedAt.toISOString(),
    activity: {
      applications: applicationCount,
      orders: null,
      communityPosts: null,
      marketplaceListings: null,
      weatherUsage: null,
    },
  };
};

export const countFarmers = (): Promise<number> =>
  FarmerProfile.countDocuments({});

export const getRecentFarmerRegistrations = async (limit = 8) => {
  const rows = await FarmerProfile.aggregate<FarmerAggRow>([
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    ...farmerLookupStages,
  ]);
  return rows.map(toListItem);
};

export const getSystemInfo = async (): Promise<SystemInfoDTO> => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";

  let authUsers = 0;
  let farmerProfiles = 0;
  try {
    ;[authUsers, farmerProfiles] = await Promise.all([
      AuthUser.countDocuments({}),
      FarmerProfile.countDocuments({}),
    ]);
  } catch {
    // keep zeros if counts fail
  }

  return {
    backendVersion: "1.0.0",
    frontendVersion: "0.0.0",
    databaseStatus: dbStatus,
    apiStatus: "ok",
    serverTime: new Date().toISOString(),
    environment: env.nodeEnv,
    authUsers,
    farmerProfiles,
  };
};
