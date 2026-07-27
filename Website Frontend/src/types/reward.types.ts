export const REWARD_STATUSES = ['PENDING', 'PAID', 'CANCELLED'] as const
export type RewardStatus = (typeof REWARD_STATUSES)[number]

export const REWARD_PAYMENT_METHODS = [
  'BANK_TRANSFER',
  'UPI',
  'CASH',
  'CHEQUE',
] as const
export type RewardPaymentMethod = (typeof REWARD_PAYMENT_METHODS)[number]

export const REWARD_REASONS = [
  'Outstanding Village Work',
  'Excellent Farmer Outreach',
  'Community Awareness',
  'Top Performer',
  'Special Contribution',
  'Festival Bonus',
  'Training Support',
  'Other',
] as const
export type RewardReason = (typeof REWARD_REASONS)[number]

export const REWARD_PAYMENT_METHOD_LABELS: Record<RewardPaymentMethod, string> =
  {
    BANK_TRANSFER: 'Bank Transfer',
    UPI: 'UPI',
    CASH: 'Cash',
    CHEQUE: 'Cheque',
  }

export type RewardListItem = {
  id: string
  rewardId: string
  villageRepresentativeId: string
  applicationId: string
  villageRepresentativeName: string
  volunteerId: string
  district: string | null
  taluka: string | null
  village: string | null
  photoUrl: string | null
  amount: number
  reason: RewardReason
  description: string | null
  status: RewardStatus
  paymentMethod: RewardPaymentMethod
  transactionReference: string | null
  paidDate: string | null
  approvedDate: string | null
  approvedBy: string | null
  createdBy: string
  updatedBy: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type RewardDetail = RewardListItem & {
  timeline: Array<{
    label: string
    at: string | null
    by: string | null
    note?: string | null
  }>
}

export type PaginatedRewards = {
  items: RewardListItem[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type RewardSummary = {
  totalRewards: number
  pendingRewards: number
  totalAmountPaid: number
  thisMonth: number
  thisMonthAmount: number
  averageReward: number
  recentRewards: RewardListItem[]
}

export type RepresentativeRewardSummary = {
  lifetimeRewards: number
  lifetimeAmount: number
  pending: number
  pendingAmount: number
  paid: number
  paidAmount: number
  items: RewardListItem[]
}

export type RewardListQuery = {
  page?: number
  limit?: number
  search?: string
  villageRepresentativeName?: string
  volunteerId?: string
  district?: string
  status?: RewardStatus | ''
  paymentMethod?: RewardPaymentMethod | ''
  reason?: string
  applicationId?: string
  fromDate?: string
  toDate?: string
  minAmount?: number
  maxAmount?: number
}

export type CreateRewardInput = {
  applicationId: string
  amount: number
  reason: RewardReason
  description?: string | null
  paymentMethod: RewardPaymentMethod
  notes?: string | null
}

export type UpdateRewardInput = {
  amount?: number
  reason?: RewardReason
  description?: string | null
  paymentMethod?: RewardPaymentMethod
  notes?: string | null
}

export type MarkPaidInput = {
  transactionReference?: string | null
  paidDate?: string
  notes?: string | null
}
