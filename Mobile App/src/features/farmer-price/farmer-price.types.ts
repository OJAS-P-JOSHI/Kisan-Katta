import type { ApiSuccessResponse } from '@/types';

export const POLL_STATUSES = ['OPEN', 'CLOSED'] as const;
export const CONFIDENCE_LEVELS = ['NOT_AVAILABLE', 'LOW', 'MEDIUM', 'HIGH'] as const;
export const REASON_TYPES = [
  'HIGH_DEMAND',
  'LOW_SUPPLY',
  'GOOD_QUALITY',
  'EXPORT_DEMAND',
  'HIGH_TRANSPORT_COST',
  'LOW_QUALITY',
  'STORAGE_AVAILABLE',
  'OTHER',
] as const;

export type PollStatus = (typeof POLL_STATUSES)[number];
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];
export type ReasonType = (typeof REASON_TYPES)[number];

export type RecentInsightDTO = {
  reasonType: ReasonType;
  reasonText: string;
  createdAt: string;
  author: string;
};

/** Aggregated reason counts across every vote on the poll. */
export type MarketSignalDTO = {
  reasonType: ReasonType;
  farmerCount: number;
};

/** Vote band enforced by the backend validator (±40% of government price, or Milk litre band). */
export type AllowedPriceRangeDTO = {
  min: number;
  max: number;
  /** Present for Milk (`Litre`); omitted for Agmarknet crops. */
  unit?: string;
};

/** Authenticated caller's own vote — backend source of truth. */
export type MyVoteDTO = {
  expectedPrice: number;
  reasonType?: ReasonType;
  reasonText?: string;
  createdAt: string;
};

export type PollResponseDTO = {
  id: string;
  crop: string;
  district: string;
  governmentPriceSnapshot: number | null;
  governmentPriceDate: string | null;
  governmentUnit: string | null;
  governmentPriceAvailable: boolean;
  communityExpectedPrice: number | null;
  voteCount: number;
  confidence: ConfidenceLevel;
  minimumVotesReached: boolean;
  differenceFromGovernmentPrice: number | null;
  differencePercentage: number | null;
  allowedPriceRange: AllowedPriceRangeDTO;
  lastVoteAt: string | null;
  startsAt: string;
  endsAt: string;
  status: PollStatus;
  createdAt: string;
  updatedAt: string;
  /** Backend: whether this authenticated user already voted. */
  hasVoted: boolean;
  /** Backend: caller's vote when hasVoted; otherwise null. */
  myVote: MyVoteDTO | null;
};

export type PollDetailResponseDTO = PollResponseDTO & {
  remainingHours: number;
  marketSignals: MarketSignalDTO[];
  recentInsights: RecentInsightDTO[];
  isCommunityEstimate: true;
  disclaimer: string;
};

export type SubmitVoteBody = {
  expectedPrice: number;
  reasonType?: ReasonType;
  reasonText?: string;
};

export type MyPollsResponse = ApiSuccessResponse<PollResponseDTO[]>;
export type PollDetailResponse = ApiSuccessResponse<PollDetailResponseDTO>;
export type SubmitVoteResponse = ApiSuccessResponse<PollDetailResponseDTO>;

/**
 * Optimistic thank-you snapshot kept briefly in SecureStore after submit.
 * Authoritative voted state always comes from poll.hasVoted / poll.myVote.
 */
export type SubmittedVoteLocal = {
  pollId: string;
  expectedPrice: number;
  reasonType?: ReasonType;
  reasonText?: string;
  submittedAt: string;
};
