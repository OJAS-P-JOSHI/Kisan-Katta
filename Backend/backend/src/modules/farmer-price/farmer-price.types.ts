import { Types } from "mongoose";
import type {
  CONFIDENCE_LEVELS,
  POLL_STATUSES,
  REASON_TYPES,
} from "./farmer-price.constants";

// ---------------------------------------------------------------------------
// Enums (derived from constants)
// ---------------------------------------------------------------------------

export type PollStatus = (typeof POLL_STATUSES)[number];
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];
export type ReasonType = (typeof REASON_TYPES)[number];

// ---------------------------------------------------------------------------
// Mongoose document interfaces
// ---------------------------------------------------------------------------

export interface IFarmerPricePoll {
  crop: string;
  district: string;
  governmentPriceSnapshot: number | null;
  governmentPriceDate: Date | null;
  governmentUnit: string | null;
  governmentPriceAvailable: boolean;
  communityExpectedPrice: number | null;
  voteCount: number;
  confidence: ConfidenceLevel;
  minimumVotesReached: boolean;
  lastVoteAt: Date | null;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFarmerPriceVote {
  pollId: Types.ObjectId;
  userId: Types.ObjectId;
  district: string;
  crop: string;
  expectedPrice: number;
  reasonType?: ReasonType;
  reasonText?: string;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Request body shapes
// ---------------------------------------------------------------------------

export interface CreatePollBody {
  crop: string;
  district: string;
}

export interface SubmitVoteBody {
  expectedPrice: number;
  reasonType?: ReasonType;
  reasonText?: string;
}

export interface PollsQuery {
  district?: string;
  crop?: string;
  page: number;
  limit: number;
}

export interface VoteValidationContext {
  /** Poll crop — required so Milk can use its fixed litre band. */
  crop: string;
  governmentPriceAvailable: boolean;
  governmentPriceSnapshot: number | null;
}

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

export interface RecentInsightDTO {
  reasonType: ReasonType;
  reasonText: string;
  createdAt: Date;
  author: string;
}

/** Aggregated reason counts for a poll — "why the community thinks this". */
export interface MarketSignalDTO {
  reasonType: ReasonType;
  farmerCount: number;
}

/**
 * Vote band enforced by the validator, surfaced so clients can bound inputs.
 * `unit` is set for Milk ("Litre"); omitted for Agmarknet crops (Quintal UX).
 */
export interface AllowedPriceRangeDTO {
  min: number;
  max: number;
  unit?: string;
}

/**
 * Authenticated caller's own vote on a poll (additive).
 * Source of truth for cross-device "already voted" UI.
 */
export interface MyVoteDTO {
  expectedPrice: number;
  reasonType?: ReasonType;
  reasonText?: string;
  createdAt: Date;
}

export interface PollResponseDTO {
  id: string;
  crop: string;
  district: string;
  governmentPriceSnapshot: number | null;
  governmentPriceDate: Date | null;
  governmentUnit: string | null;
  governmentPriceAvailable: boolean;
  communityExpectedPrice: number | null;
  voteCount: number;
  confidence: ConfidenceLevel;
  minimumVotesReached: boolean;
  differenceFromGovernmentPrice: number | null;
  differencePercentage: number | null;
  allowedPriceRange: AllowedPriceRangeDTO;
  lastVoteAt: Date | null;
  startsAt: Date;
  endsAt: Date;
  status: PollStatus;
  createdAt: Date;
  updatedAt: Date;
  /** Whether the authenticated caller has voted on this poll. */
  hasVoted: boolean;
  /** Caller's vote payload when hasVoted; otherwise null. */
  myVote: MyVoteDTO | null;
}

export interface PollDetailResponseDTO extends PollResponseDTO {
  remainingHours: number;
  marketSignals: MarketSignalDTO[];
  recentInsights: RecentInsightDTO[];
  isCommunityEstimate: true;
  disclaimer: string;
}

export interface PaginatedPollsDTO {
  polls: PollResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HistoryPollDTO {
  id: string;
  crop: string;
  district: string;
  startsAt: Date;
  endsAt: Date;
  governmentPriceSnapshot: number | null;
  communityExpectedPrice: number | null;
  voteCount: number;
  confidence: ConfidenceLevel;
  differenceFromGovernmentPrice: number | null;
  differencePercentage: number | null;
}

export interface HistoryResponseDTO {
  crop: string;
  district: string;
  polls: HistoryPollDTO[];
}
