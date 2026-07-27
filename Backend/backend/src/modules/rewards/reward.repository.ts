import { Reward, type IReward } from "./reward.model";
import type { RewardPaymentMethod, RewardStatus } from "./reward.constants";

export interface RewardListFilter {
  search?: string;
  villageRepresentativeName?: string;
  volunteerId?: string;
  district?: string;
  status?: RewardStatus;
  paymentMethod?: RewardPaymentMethod;
  reason?: string;
  applicationId?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

type RewardFilter = Record<string, unknown>;

const buildFilter = (input: RewardListFilter): RewardFilter => {
  const filter: RewardFilter = {};

  if (input.applicationId) {
    filter.applicationId = input.applicationId;
  }
  if (input.status) {
    filter.status = input.status;
  }
  if (input.paymentMethod) {
    filter.paymentMethod = input.paymentMethod;
  }
  if (input.reason) {
    filter.reason = input.reason;
  }
  if (input.volunteerId?.trim()) {
    filter.volunteerId = {
      $regex: input.volunteerId.trim(),
      $options: "i",
    };
  }
  if (input.district?.trim()) {
    filter.district = { $regex: input.district.trim(), $options: "i" };
  }
  if (input.villageRepresentativeName?.trim()) {
    filter.villageRepresentativeName = {
      $regex: input.villageRepresentativeName.trim(),
      $options: "i",
    };
  }

  if (input.search?.trim()) {
    const q = input.search.trim();
    filter.$or = [
      { rewardId: { $regex: q, $options: "i" } },
      { villageRepresentativeName: { $regex: q, $options: "i" } },
      { volunteerId: { $regex: q, $options: "i" } },
      { district: { $regex: q, $options: "i" } },
      { reason: { $regex: q, $options: "i" } },
      { transactionReference: { $regex: q, $options: "i" } },
    ];
  }

  if (input.minAmount !== undefined || input.maxAmount !== undefined) {
    const amount: Record<string, number> = {};
    if (input.minAmount !== undefined) amount.$gte = input.minAmount;
    if (input.maxAmount !== undefined) amount.$lte = input.maxAmount;
    filter.amount = amount;
  }

  if (input.fromDate || input.toDate) {
    const createdAt: Record<string, Date> = {};
    if (input.fromDate) {
      createdAt.$gte = new Date(input.fromDate);
    }
    if (input.toDate) {
      const end = new Date(input.toDate);
      end.setHours(23, 59, 59, 999);
      createdAt.$lte = end;
    }
    filter.createdAt = createdAt;
  }

  return filter;
};

export const findRewards = async (
  input: RewardListFilter
): Promise<{ items: IReward[]; total: number; page: number; limit: number }> => {
  const page = input.page ?? 1;
  const limit = Math.min(input.limit ?? 20, 100);
  const filter = buildFilter(input);

  const [total, items] = await Promise.all([
    Reward.countDocuments(filter),
    Reward.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<IReward[]>()
      .exec(),
  ]);

  return { items, total, page, limit };
};

export const findRewardById = (id: string): Promise<IReward | null> =>
  Reward.findById(id).lean<IReward>().exec();

export const findRewardByRewardId = (rewardId: string): Promise<IReward | null> =>
  Reward.findOne({ rewardId }).lean<IReward>().exec();

export const createReward = async (
  data: Omit<IReward, "_id" | "createdAt" | "updatedAt">
): Promise<IReward> => {
  const doc = await Reward.create(data);
  return doc.toObject();
};

export const updateRewardById = async (
  id: string,
  update: Partial<IReward>
): Promise<IReward | null> =>
  Reward.findByIdAndUpdate(id, { $set: update }, { new: true })
    .lean<IReward>()
    .exec();

/** Atomic transition — only updates when current status matches `expectedStatus`. */
export const updateRewardByIdIfStatus = async (
  id: string,
  expectedStatus: RewardStatus,
  update: Partial<IReward>
): Promise<IReward | null> =>
  Reward.findOneAndUpdate(
    { _id: id, status: expectedStatus },
    { $set: update },
    { new: true }
  )
    .lean<IReward>()
    .exec();

export const countRewardsByStatus = (status: RewardStatus): Promise<number> =>
  Reward.countDocuments({ status }).exec();

export const countAllRewards = (): Promise<number> => Reward.countDocuments({}).exec();

export const aggregatePaidAmount = async (
  from?: Date,
  to?: Date
): Promise<number> => {
  const match: RewardFilter = { status: "PAID" };
  if (from || to) {
    const paidDate: Record<string, Date> = {};
    if (from) paidDate.$gte = from;
    if (to) paidDate.$lte = to;
    match.paidDate = paidDate;
  }

  const rows = await Reward.aggregate<{ total: number }>([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return rows[0]?.total ?? 0;
};

export const aggregateAverageReward = async (): Promise<number> => {
  const rows = await Reward.aggregate<{ avg: number }>([
    { $match: { status: { $in: ["PENDING", "PAID"] } } },
    { $group: { _id: null, avg: { $avg: "$amount" } } },
  ]);
  return rows[0]?.avg ?? 0;
};

export const findRecentRewards = (limit = 8): Promise<IReward[]> =>
  Reward.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<IReward[]>()
    .exec();

export const findTopRewardedRepresentatives = async (limit = 5) =>
  Reward.aggregate<{
    _id: string;
    villageRepresentativeName: string;
    volunteerId: string;
    district: string | null;
    totalAmount: number;
    rewardCount: number;
  }>([
    { $match: { status: "PAID" } },
    {
      $group: {
        _id: "$applicationId",
        villageRepresentativeName: { $first: "$villageRepresentativeName" },
        volunteerId: { $first: "$volunteerId" },
        district: { $first: "$district" },
        totalAmount: { $sum: "$amount" },
        rewardCount: { $sum: 1 },
      },
    },
    { $sort: { totalAmount: -1 } },
    { $limit: limit },
  ]);

export const countCreatedInRange = (from: Date, to: Date): Promise<number> =>
  Reward.countDocuments({ createdAt: { $gte: from, $lte: to } }).exec();

export const countPaidInRange = (from: Date, to: Date): Promise<number> =>
  Reward.countDocuments({
    status: "PAID",
    paidDate: { $gte: from, $lte: to },
  }).exec();

export const sumPendingAmount = async (): Promise<number> => {
  const rows = await Reward.aggregate<{ total: number }>([
    { $match: { status: "PENDING" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return rows[0]?.total ?? 0;
};

export const sumCreatedAmountInRange = async (
  from: Date,
  to: Date
): Promise<number> => {
  const rows = await Reward.aggregate<{ total: number }>([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return rows[0]?.total ?? 0;
};

export const findRewardsForExport = async (
  input: RewardListFilter
): Promise<IReward[]> => {
  const filter = buildFilter(input);
  return Reward.find(filter).sort({ createdAt: -1 }).limit(5000).lean<IReward[]>().exec();
};
