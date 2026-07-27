import { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { nextSequence } from "../counter/counter.service";
import { GramSahakariApplication } from "../gram-sahakari/gram-sahakari.model";
import type { IGramSahakariApplication } from "../gram-sahakari/interfaces/application.interface";
import {
  REWARD_COUNTER_ID,
  REWARD_ID_PREFIX,
} from "./reward.constants";
import type {
  DashboardRewardStatsDTO,
  PaginatedRewardsDTO,
  RepresentativeRewardSummaryDTO,
  RewardDetailDTO,
  RewardListItemDTO,
  RewardSummaryDTO,
} from "./reward.dto";
import type { IReward } from "./reward.model";
import * as repo from "./reward.repository";

const toVolunteerId = (applicationNumber: string): string => {
  const raw = applicationNumber.trim().toUpperCase();
  const match = raw.match(/^GS-(\d{4})-(\d+)$/);
  if (match) return `GS-MH-${match[1]}-${match[2]}`;
  if (/^GS-MH-/.test(raw)) return raw;
  return `GS-MH-${raw.replace(/^GS-?/i, "")}`;
};

const formatRewardId = (year: number, sequence: number): string =>
  `${REWARD_ID_PREFIX}-${year}-${String(sequence).padStart(6, "0")}`;

const toIso = (value: Date | null | undefined): string | null =>
  value ? new Date(value).toISOString() : null;

export const toRewardListItemDTO = (reward: IReward): RewardListItemDTO => ({
  id: String(reward._id),
  rewardId: reward.rewardId,
  villageRepresentativeId: String(reward.villageRepresentativeId),
  applicationId: String(reward.applicationId),
  villageRepresentativeName: reward.villageRepresentativeName,
  volunteerId: reward.volunteerId,
  district: reward.district ?? null,
  taluka: reward.taluka ?? null,
  village: reward.village ?? null,
  photoUrl: reward.photoUrl ?? null,
  amount: reward.amount,
  reason: reward.reason,
  description: reward.description ?? null,
  status: reward.status,
  paymentMethod: reward.paymentMethod,
  transactionReference: reward.transactionReference ?? null,
  paidDate: toIso(reward.paidDate),
  approvedDate: toIso(reward.approvedDate),
  approvedBy: reward.approvedBy ?? null,
  createdBy: reward.createdBy,
  updatedBy: reward.updatedBy ?? null,
  notes: reward.notes ?? null,
  createdAt: new Date(reward.createdAt).toISOString(),
  updatedAt: new Date(reward.updatedAt).toISOString(),
});

const toRewardDetailDTO = (reward: IReward): RewardDetailDTO => {
  const base = toRewardListItemDTO(reward);
  return {
    ...base,
    timeline: [
      {
        label: "Created",
        at: base.createdAt,
        by: reward.createdBy,
        note: "Reward recorded as Pending",
      },
      {
        label: "Approved",
        at: base.approvedDate,
        by: reward.approvedBy,
        note: reward.approvedDate ? "Ready for manual payout" : null,
      },
      {
        label: "Paid",
        at: base.paidDate,
        by: reward.status === "PAID" ? reward.updatedBy ?? reward.approvedBy : null,
        note:
          reward.status === "PAID"
            ? reward.transactionReference
              ? `Txn: ${reward.transactionReference}`
              : "Marked as paid (manual transfer outside system)"
            : null,
      },
      ...(reward.status === "CANCELLED"
        ? [
            {
              label: "Cancelled",
              at: base.updatedAt,
              by: reward.updatedBy,
              note: reward.notes,
            },
          ]
        : []),
    ],
  };
};

const assertEligibleRepresentative = async (
  applicationId: string
): Promise<IGramSahakariApplication & { _id: Types.ObjectId }> => {
  if (!Types.ObjectId.isValid(applicationId)) {
    throw new AppError("Invalid Village Representative.", 400);
  }

  const app = await GramSahakariApplication.findById(applicationId).lean();
  if (!app) {
    throw new AppError("Village Representative not found.", 404);
  }

  if (app.status !== "SUBMITTED" || app.paymentStatus !== "PAID") {
    throw new AppError(
      "Only verified Village Representatives with completed registration can receive rewards.",
      400
    );
  }

  return app as IGramSahakariApplication & { _id: Types.ObjectId };
};

export const listRewards = async (
  input: repo.RewardListFilter
): Promise<PaginatedRewardsDTO> => {
  const { items, total, page, limit } = await repo.findRewards(input);
  return {
    items: items.map(toRewardListItemDTO),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

const assertObjectId = (id: string, label = "Reward id"): void => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
};

export const getRewardById = async (id: string): Promise<RewardDetailDTO> => {
  assertObjectId(id);
  const reward = await repo.findRewardById(id);
  if (!reward) throw new AppError("Reward not found.", 404);
  return toRewardDetailDTO(reward);
};

export const getRewardSummary = async (): Promise<RewardSummaryDTO> => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const now = new Date();

  const [
    totalRewards,
    pendingRewards,
    totalAmountPaid,
    thisMonth,
    thisMonthAmount,
    averageReward,
    recent,
  ] = await Promise.all([
    repo.countAllRewards(),
    repo.countRewardsByStatus("PENDING"),
    repo.aggregatePaidAmount(),
    repo.countCreatedInRange(startOfMonth, now),
    repo.sumCreatedAmountInRange(startOfMonth, now),
    repo.aggregateAverageReward(),
    repo.findRecentRewards(8),
  ]);

  return {
    totalRewards,
    pendingRewards,
    totalAmountPaid,
    thisMonth,
    thisMonthAmount,
    averageReward: Math.round(averageReward * 100) / 100,
    recentRewards: recent.map(toRewardListItemDTO),
  };
};

export const getDashboardRewardStats =
  async (): Promise<DashboardRewardStatsDTO> => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const now = new Date();

    const [
      rewardsPaidThisMonth,
      rewardsPaidThisMonthAmount,
      pendingRewards,
      pendingRewardsAmount,
      top,
    ] = await Promise.all([
      repo.countPaidInRange(startOfMonth, now),
      repo.aggregatePaidAmount(startOfMonth, now),
      repo.countRewardsByStatus("PENDING"),
      repo.sumPendingAmount(),
      repo.findTopRewardedRepresentatives(5),
    ]);

    return {
      rewardsPaidThisMonth,
      rewardsPaidThisMonthAmount,
      pendingRewards,
      pendingRewardsAmount,
      topRewardedRepresentatives: top.map((row) => ({
        applicationId: String(row._id),
        villageRepresentativeName: row.villageRepresentativeName,
        volunteerId: row.volunteerId,
        district: row.district ?? null,
        totalAmount: row.totalAmount,
        rewardCount: row.rewardCount,
      })),
    };
  };

export const getRepresentativeRewards = async (
  applicationId: string
): Promise<RepresentativeRewardSummaryDTO> => {
  assertObjectId(applicationId, "Application id");
  const { items } = await repo.findRewards({
    applicationId,
    page: 1,
    limit: 100,
  });

  const dtos = items.map(toRewardListItemDTO);
  const pendingItems = dtos.filter((r) => r.status === "PENDING");
  const paidItems = dtos.filter((r) => r.status === "PAID");

  return {
    lifetimeRewards: dtos.length,
    lifetimeAmount: dtos.reduce((s, r) => s + r.amount, 0),
    pending: pendingItems.length,
    pendingAmount: pendingItems.reduce((s, r) => s + r.amount, 0),
    paid: paidItems.length,
    paidAmount: paidItems.reduce((s, r) => s + r.amount, 0),
    items: dtos,
  };
};

export const createReward = async (
  input: {
    applicationId: string;
    amount: number;
    reason: IReward["reason"];
    description?: string | null;
    paymentMethod: IReward["paymentMethod"];
    notes?: string | null;
  },
  actorName: string
): Promise<RewardDetailDTO> => {
  const app = await assertEligibleRepresentative(input.applicationId);
  const year = new Date().getFullYear();
  const sequence = await nextSequence(REWARD_COUNTER_ID);
  const rewardId = formatRewardId(year, sequence);
  const now = new Date();

  const created = await repo.createReward({
    rewardId,
    villageRepresentativeId: app._id,
    applicationId: app._id,
    villageRepresentativeName: app.fullName?.trim() || "Village Representative",
    volunteerId: toVolunteerId(app.applicationNumber),
    district: app.district ?? null,
    taluka: app.taluka ?? null,
    village: app.village ?? null,
    photoUrl: app.photo?.url ?? null,
    amount: input.amount,
    reason: input.reason,
    description: input.description?.trim() || null,
    status: "PENDING",
    paymentMethod: input.paymentMethod,
    transactionReference: null,
    paidDate: null,
    approvedDate: now,
    approvedBy: actorName,
    createdBy: actorName,
    updatedBy: actorName,
    notes: input.notes?.trim() || null,
  });

  return toRewardDetailDTO(created);
};

export const updateReward = async (
  id: string,
  input: {
    amount?: number;
    reason?: IReward["reason"];
    description?: string | null;
    paymentMethod?: IReward["paymentMethod"];
    notes?: string | null;
  },
  actorName: string
): Promise<RewardDetailDTO> => {
  assertObjectId(id);
  const existing = await repo.findRewardById(id);
  if (!existing) throw new AppError("Reward not found.", 404);

  if (existing.status !== "PENDING") {
    throw new AppError("Only Pending rewards can be edited.", 409);
  }

  const updated = await repo.updateRewardByIdIfStatus(id, "PENDING", {
    ...(input.amount !== undefined ? { amount: input.amount } : {}),
    ...(input.reason !== undefined ? { reason: input.reason } : {}),
    ...(input.description !== undefined
      ? { description: input.description?.trim() || null }
      : {}),
    ...(input.paymentMethod !== undefined
      ? { paymentMethod: input.paymentMethod }
      : {}),
    ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
    updatedBy: actorName,
  });

  if (!updated) {
    throw new AppError(
      "Reward could not be edited because its status changed. Only Pending rewards can be edited.",
      409
    );
  }
  return toRewardDetailDTO(updated);
};

/**
 * Records that Admin completed a manual transfer outside the system.
 * Does NOT move money, call Razorpay, or trigger any payout API.
 */
export const markRewardPaid = async (
  id: string,
  input: {
    transactionReference?: string | null;
    paidDate?: string;
    notes?: string | null;
  },
  actorName: string
): Promise<RewardDetailDTO> => {
  assertObjectId(id);
  const existing = await repo.findRewardById(id);
  if (!existing) throw new AppError("Reward not found.", 404);

  if (existing.status === "PAID") {
    throw new AppError("Reward is already marked as Paid.", 409);
  }
  if (existing.status === "CANCELLED") {
    throw new AppError("Cancelled rewards cannot be marked as Paid.", 409);
  }
  if (existing.status !== "PENDING") {
    throw new AppError("Only Pending rewards can be marked as Paid.", 409);
  }

  const paidDate = input.paidDate ? new Date(input.paidDate) : new Date();

  const updated = await repo.updateRewardByIdIfStatus(id, "PENDING", {
    status: "PAID",
    paidDate,
    transactionReference: input.transactionReference?.trim() || null,
    notes:
      input.notes !== undefined
        ? input.notes?.trim() || existing.notes
        : existing.notes,
    updatedBy: actorName,
  });

  if (!updated) {
    throw new AppError(
      "Reward could not be marked as Paid because its status changed.",
      409
    );
  }
  return toRewardDetailDTO(updated);
};

export const cancelReward = async (
  id: string,
  input: { notes?: string | null },
  actorName: string
): Promise<RewardDetailDTO> => {
  assertObjectId(id);
  const existing = await repo.findRewardById(id);
  if (!existing) throw new AppError("Reward not found.", 404);

  if (existing.status === "PAID") {
    throw new AppError(
      "Paid rewards cannot be cancelled or moved back to Pending.",
      409
    );
  }
  if (existing.status === "CANCELLED") {
    throw new AppError("Reward is already cancelled.", 409);
  }
  if (existing.status !== "PENDING") {
    throw new AppError("Only Pending rewards can be cancelled.", 409);
  }

  const updated = await repo.updateRewardByIdIfStatus(id, "PENDING", {
    status: "CANCELLED",
    notes:
      input.notes !== undefined
        ? input.notes?.trim() || existing.notes
        : existing.notes,
    updatedBy: actorName,
  });

  if (!updated) {
    throw new AppError(
      "Reward could not be cancelled because its status changed.",
      409
    );
  }
  return toRewardDetailDTO(updated);
};

export const exportRewardsCsv = async (
  input: repo.RewardListFilter
): Promise<string> => {
  const items = await repo.findRewardsForExport(input);
  const header = [
    "Reward ID",
    "Village Representative",
    "Volunteer ID",
    "District",
    "Taluka",
    "Village",
    "Amount",
    "Reason",
    "Status",
    "Payment Method",
    "Transaction Reference",
    "Approved By",
    "Created By",
    "Paid Date",
    "Created At",
    "Notes",
  ].join(",");

  const escape = (value: string | number | null | undefined): string => {
    const raw = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
    return raw;
  };

  const rows = items.map((r) =>
    [
      r.rewardId,
      r.villageRepresentativeName,
      r.volunteerId,
      r.district,
      r.taluka,
      r.village,
      r.amount,
      r.reason,
      r.status,
      r.paymentMethod,
      r.transactionReference,
      r.approvedBy,
      r.createdBy,
      toIso(r.paidDate),
      toIso(r.createdAt),
      r.notes,
    ]
      .map(escape)
      .join(",")
  );

  return [header, ...rows].join("\n");
};
