import type { RewardPaymentMethod, RewardReason, RewardStatus } from "./reward.constants";

export interface RewardListItemDTO {
  id: string;
  rewardId: string;
  villageRepresentativeId: string;
  applicationId: string;
  villageRepresentativeName: string;
  volunteerId: string;
  district: string | null;
  taluka: string | null;
  village: string | null;
  photoUrl: string | null;
  amount: number;
  reason: RewardReason;
  description: string | null;
  status: RewardStatus;
  paymentMethod: RewardPaymentMethod;
  transactionReference: string | null;
  paidDate: string | null;
  approvedDate: string | null;
  approvedBy: string | null;
  createdBy: string;
  updatedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RewardDetailDTO extends RewardListItemDTO {
  timeline: Array<{
    label: string;
    at: string | null;
    by: string | null;
    note?: string | null;
  }>;
}

export interface PaginatedRewardsDTO {
  items: RewardListItemDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RewardSummaryDTO {
  totalRewards: number;
  pendingRewards: number;
  totalAmountPaid: number;
  thisMonth: number;
  thisMonthAmount: number;
  averageReward: number;
  recentRewards: RewardListItemDTO[];
}

export interface RepresentativeRewardSummaryDTO {
  lifetimeRewards: number;
  lifetimeAmount: number;
  pending: number;
  pendingAmount: number;
  paid: number;
  paidAmount: number;
  items: RewardListItemDTO[];
}

export interface DashboardRewardStatsDTO {
  rewardsPaidThisMonth: number;
  rewardsPaidThisMonthAmount: number;
  pendingRewards: number;
  pendingRewardsAmount: number;
  topRewardedRepresentatives: Array<{
    applicationId: string;
    villageRepresentativeName: string;
    volunteerId: string;
    district: string | null;
    totalAmount: number;
    rewardCount: number;
  }>;
}
