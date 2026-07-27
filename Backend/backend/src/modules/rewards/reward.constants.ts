/** Manual Village Representative reward statuses — no automatic transitions. */
export const REWARD_STATUSES = ["PENDING", "PAID", "CANCELLED"] as const;
export type RewardStatus = (typeof REWARD_STATUSES)[number];

/** How the Admin transferred money outside the system (record only). */
export const REWARD_PAYMENT_METHODS = [
  "BANK_TRANSFER",
  "UPI",
  "CASH",
  "CHEQUE",
] as const;
export type RewardPaymentMethod = (typeof REWARD_PAYMENT_METHODS)[number];

/** Admin-selected reasons — no referral or commission logic. */
export const REWARD_REASONS = [
  "Outstanding Village Work",
  "Excellent Farmer Outreach",
  "Community Awareness",
  "Top Performer",
  "Special Contribution",
  "Festival Bonus",
  "Training Support",
  "Other",
] as const;
export type RewardReason = (typeof REWARD_REASONS)[number];

export const REWARD_COUNTER_ID = "village_representative_rewards";

export const REWARD_ID_PREFIX = "RWD";
