import mongoose, { Types } from "mongoose";
import type { ClientSession } from "mongoose";
import { resolveDistrict } from "../../config/maharashtraDistrictCoordinates";
import { AppError } from "../../utils/AppError";
import { getMarketPrices } from "../market/market.service";
import { getProfile } from "../profile/profile.service";
import {
  ANONYMOUS_FARMER_AUTHOR,
  COMMUNITY_PRICE_DISCLAIMER,
  DEFAULT_GOVERNMENT_UNIT,
  DEFAULT_POLL_DURATION_HOURS,
  MINIMUM_VOTES_REQUIRED,
  RECENT_INSIGHTS_LIMIT,
} from "./farmer-price.constants";
import { FarmerPricePoll, FarmerPriceVote } from "./farmer-price.model";
import {
  calculateConfidence,
  calculateDifferenceFromGovernment,
  calculateMedianPrice,
  calculateRemainingHours,
  resolveCommunityExpectedPrice,
} from "./farmer-price.stats";
import type {
  CreatePollBody,
  HistoryPollDTO,
  HistoryResponseDTO,
  IFarmerPricePoll,
  PaginatedPollsDTO,
  PollDetailResponseDTO,
  PollResponseDTO,
  PollsQuery,
  PollStatus,
  RecentInsightDTO,
  SubmitVoteBody,
} from "./farmer-price.types";
import { validateSubmitVote } from "./farmer-price.validation";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type PollDocument = IFarmerPricePoll & { _id: Types.ObjectId };

interface PollStatUpdate {
  voteCount: number;
  communityExpectedPrice: number | null;
  confidence: ReturnType<typeof calculateConfidence>;
  minimumVotesReached: boolean;
  lastVoteAt: Date;
}

const logEvent = (event: string): void => {
  // eslint-disable-next-line no-console
  console.log(`[farmer-price] ${event}`);
};

const assertValidObjectId = (id: string, label = "id"): void => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
};

const resolvePollStatus = (endsAt: Date, now = new Date()): PollStatus =>
  endsAt > now ? "OPEN" : "CLOSED";

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code: unknown }).code === 11000;

const isTransactionUnsupportedError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("transaction numbers are only allowed on a replica set member") ||
    message.includes("transactions are not supported") ||
    (message.includes("replica set") && message.includes("transaction"))
  );
};

const toPollDTO = (doc: PollDocument): PollResponseDTO => {
  const { differenceFromGovernmentPrice, differencePercentage } =
    calculateDifferenceFromGovernment(
      doc.communityExpectedPrice,
      doc.governmentPriceAvailable,
      doc.governmentPriceSnapshot
    );

  return {
    id: doc._id.toString(),
    crop: doc.crop,
    district: doc.district,
    governmentPriceSnapshot: doc.governmentPriceSnapshot,
    governmentPriceDate: doc.governmentPriceDate,
    governmentUnit: doc.governmentUnit,
    governmentPriceAvailable: doc.governmentPriceAvailable,
    communityExpectedPrice: doc.communityExpectedPrice,
    voteCount: doc.voteCount,
    confidence: doc.confidence,
    minimumVotesReached: doc.minimumVotesReached,
    differenceFromGovernmentPrice,
    differencePercentage,
    lastVoteAt: doc.lastVoteAt ?? null,
    startsAt: doc.startsAt,
    endsAt: doc.endsAt,
    status: resolvePollStatus(doc.endsAt),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const toHistoryPollDTO = (doc: PollDocument): HistoryPollDTO => {
  const summary = toPollDTO(doc);
  return {
    id: summary.id,
    crop: summary.crop,
    district: summary.district,
    startsAt: summary.startsAt,
    endsAt: summary.endsAt,
    governmentPriceSnapshot: summary.governmentPriceSnapshot,
    communityExpectedPrice: summary.communityExpectedPrice,
    voteCount: summary.voteCount,
    confidence: summary.confidence,
    differenceFromGovernmentPrice: summary.differenceFromGovernmentPrice,
    differencePercentage: summary.differencePercentage,
  };
};

const fetchRecentInsights = async (
  pollId: Types.ObjectId
): Promise<RecentInsightDTO[]> => {
  const votes = await FarmerPriceVote.find({
    pollId,
    reasonType: { $exists: true, $ne: null },
    reasonText: { $exists: true, $nin: [null, ""] },
  })
    .sort({ createdAt: -1 })
    .limit(RECENT_INSIGHTS_LIMIT)
    .select({ reasonType: 1, reasonText: 1, createdAt: 1 })
    .lean();

  return votes
    .filter(
      (vote): vote is typeof vote & { reasonType: NonNullable<typeof vote.reasonType>; reasonText: string } =>
        typeof vote.reasonType === "string" &&
        typeof vote.reasonText === "string" &&
        vote.reasonText.trim().length > 0
    )
    .map((vote) => ({
      reasonType: vote.reasonType,
      reasonText: vote.reasonText.trim(),
      createdAt: vote.createdAt,
      author: ANONYMOUS_FARMER_AUTHOR,
    }));
};

const toPollDetailDTO = async (
  doc: PollDocument
): Promise<PollDetailResponseDTO> => {
  const summary = toPollDTO(doc);
  const recentInsights = await fetchRecentInsights(doc._id);

  return {
    ...summary,
    remainingHours: calculateRemainingHours(doc.endsAt),
    recentInsights,
    isCommunityEstimate: true,
    disclaimer: COMMUNITY_PRICE_DISCLAIMER,
  };
};

const buildPollWindow = (
  durationHours = DEFAULT_POLL_DURATION_HOURS
): { startsAt: Date; endsAt: Date } => {
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);
  return { startsAt, endsAt };
};

const findActivePoll = async (district: string, crop: string) =>
  FarmerPricePoll.findOne({
    district,
    crop,
    endsAt: { $gt: new Date() },
  });

interface GovernmentPriceSnapshot {
  governmentPriceSnapshot: number | null;
  governmentPriceDate: Date | null;
  governmentUnit: string | null;
  governmentPriceAvailable: boolean;
}

const parseGovernmentArrivalDate = (arrivalDate: string): Date | null => {
  const trimmed = arrivalDate.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed;
    }
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * Fetches the latest government modal price via Market Service.
 * Failures / empty results do not block poll creation.
 */
const fetchGovernmentPriceSnapshot = async (
  district: string,
  crop: string
): Promise<GovernmentPriceSnapshot> => {
  const unavailable: GovernmentPriceSnapshot = {
    governmentPriceSnapshot: null,
    governmentPriceDate: null,
    governmentUnit: null,
    governmentPriceAvailable: false,
  };

  try {
    const prices = await getMarketPrices({
      state: "Maharashtra",
      district,
      commodity: crop,
      limit: 20,
      offset: 0,
    });

    const latest = prices.find((item) => item.modalPrice > 0);
    if (!latest) {
      return unavailable;
    }

    return {
      governmentPriceSnapshot: latest.modalPrice,
      governmentPriceDate: parseGovernmentArrivalDate(latest.arrivalDate),
      governmentUnit: DEFAULT_GOVERNMENT_UNIT,
      governmentPriceAvailable: true,
    };
  } catch {
    return unavailable;
  }
};

const computePollStatsFromPrices = (
  prices: number[],
  lastVoteAt: Date
): PollStatUpdate => {
  const voteCount = prices.length;
  const median = calculateMedianPrice(prices);
  const minimumVotesReached = voteCount >= MINIMUM_VOTES_REQUIRED;
  const communityExpectedPrice = resolveCommunityExpectedPrice(
    voteCount,
    MINIMUM_VOTES_REQUIRED,
    median
  );
  const confidence = calculateConfidence(voteCount);

  return {
    voteCount,
    communityExpectedPrice,
    confidence,
    minimumVotesReached,
    lastVoteAt,
  };
};

const loadVotePrices = async (
  pollId: Types.ObjectId,
  session?: ClientSession
): Promise<number[]> => {
  const query = FarmerPriceVote.find({ pollId })
    .select({ expectedPrice: 1 })
    .lean();

  if (session) {
    query.session(session);
  }

  const votes = await query;
  return votes.map((vote) => vote.expectedPrice);
};

const applyPollStats = async (
  pollId: Types.ObjectId,
  stats: PollStatUpdate,
  session?: ClientSession
): Promise<void> => {
  const update = FarmerPricePoll.updateOne(
    { _id: pollId },
    {
      $set: {
        voteCount: stats.voteCount,
        communityExpectedPrice: stats.communityExpectedPrice,
        confidence: stats.confidence,
        minimumVotesReached: stats.minimumVotesReached,
        lastVoteAt: stats.lastVoteAt,
      },
    }
  );

  if (session) {
    update.session(session);
  }

  const result = await update;
  if (result.matchedCount === 0) {
    throw new AppError("Poll Not Found", 404);
  }

  logEvent("Poll Updated");
  logEvent("Calculation Completed");
};

const createVoteDocument = async (
  payload: {
    pollId: Types.ObjectId;
    userId: Types.ObjectId;
    district: string;
    crop: string;
    expectedPrice: number;
    reasonType?: SubmitVoteBody["reasonType"];
    reasonText?: string;
  },
  session?: ClientSession
): Promise<Types.ObjectId> => {
  if (session) {
    const [vote] = await FarmerPriceVote.create([payload], { session });
    if (!vote) {
      throw new AppError("Invalid Vote", 500);
    }
    return vote._id;
  }

  const vote = await FarmerPriceVote.create(payload);
  return vote._id;
};

/**
 * Persist vote + recalculated poll stats atomically when transactions are
 * supported; otherwise create the vote and roll it back if the poll update fails.
 */
const persistVoteAndRecalculate = async (input: {
  pollId: Types.ObjectId;
  userId: string;
  district: string;
  crop: string;
  voteData: SubmitVoteBody;
}): Promise<PollStatUpdate> => {
  const votePayload = {
    pollId: input.pollId,
    userId: new Types.ObjectId(input.userId),
    district: input.district,
    crop: input.crop,
    expectedPrice: input.voteData.expectedPrice,
    reasonType: input.voteData.reasonType,
    reasonText: input.voteData.reasonText,
  };

  const session = await mongoose.startSession();

  try {
    let stats!: PollStatUpdate;

    await session.withTransaction(async () => {
      await createVoteDocument(votePayload, session);
      logEvent("Vote Submitted");

      const prices = await loadVotePrices(input.pollId, session);
      stats = computePollStatsFromPrices(prices, new Date());
      await applyPollStats(input.pollId, stats, session);
    });

    return stats;
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      logEvent("Duplicate Vote");
      throw new AppError("Already Voted", 409);
    }

    if (!isTransactionUnsupportedError(error)) {
      throw error;
    }
  } finally {
    await session.endSession();
  }

  // Standalone MongoDB fallback: compensatory rollback if poll update fails.
  let createdVoteId: Types.ObjectId | null = null;
  try {
    createdVoteId = await createVoteDocument(votePayload);
    logEvent("Vote Submitted");

    const prices = await loadVotePrices(input.pollId);
    const stats = computePollStatsFromPrices(prices, new Date());
    await applyPollStats(input.pollId, stats);
    return stats;
  } catch (error: unknown) {
    if (createdVoteId) {
      await FarmerPriceVote.deleteOne({ _id: createdVoteId }).catch(() => undefined);
    }

    if (isDuplicateKeyError(error)) {
      logEvent("Duplicate Vote");
      throw new AppError("Already Voted", 409);
    }

    throw error;
  }
};

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export const createPoll = async (
  data: CreatePollBody
): Promise<PollResponseDTO> => {
  const { district } = resolveDistrict(data.district);
  const crop = data.crop.trim();

  const existingActive = await findActivePoll(district, crop);
  if (existingActive) {
    throw new AppError("Poll already exists.", 409);
  }

  const governmentSnapshot = await fetchGovernmentPriceSnapshot(district, crop);
  const { startsAt, endsAt } = buildPollWindow();

  const poll = await FarmerPricePoll.create({
    crop,
    district,
    ...governmentSnapshot,
    communityExpectedPrice: null,
    voteCount: 0,
    confidence: "NOT_AVAILABLE",
    minimumVotesReached: false,
    lastVoteAt: null,
    startsAt,
    endsAt,
  });

  return toPollDTO(poll);
};

export const getPolls = async (query: PollsQuery): Promise<PaginatedPollsDTO> => {
  const filter: Record<string, unknown> = {};

  if (query.district) {
    const { district } = resolveDistrict(query.district);
    filter["district"] = district;
  }
  if (query.crop) {
    filter["crop"] = query.crop.trim();
  }

  const skip = (query.page - 1) * query.limit;

  const [polls, total] = await Promise.all([
    FarmerPricePoll.find(filter)
      .sort({ endsAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    FarmerPricePoll.countDocuments(filter),
  ]);

  return {
    polls: polls.map((poll) => toPollDTO(poll as PollDocument)),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 0,
    },
  };
};

export const getPoll = async (pollId: string): Promise<PollDetailResponseDTO> => {
  assertValidObjectId(pollId, "pollId");

  const poll = await FarmerPricePoll.findById(pollId).lean();
  if (!poll) {
    throw new AppError("Poll Not Found", 404);
  }

  return toPollDetailDTO(poll as PollDocument);
};

export const getMyPolls = async (userId: string): Promise<PollResponseDTO[]> => {
  const profile = await getProfile(userId);

  if (!profile.district) {
    throw new AppError("Invalid District", 400);
  }

  const favoriteCrops = profile.favoriteCrops
    .map((crop) => crop.trim())
    .filter((crop) => crop.length > 0);

  if (favoriteCrops.length === 0) {
    return [];
  }

  const { district } = resolveDistrict(profile.district);
  const now = new Date();

  const polls = await FarmerPricePoll.find({
    district,
    crop: { $in: favoriteCrops },
    endsAt: { $gt: now },
  })
    .sort({ endsAt: 1 })
    .lean();

  return polls.map((poll) => toPollDTO(poll as PollDocument));
};

export const submitVote = async (
  userId: string,
  pollId: string,
  body: Record<string, unknown>
): Promise<PollDetailResponseDTO> => {
  assertValidObjectId(pollId, "pollId");

  const poll = await FarmerPricePoll.findById(pollId).lean();
  if (!poll) {
    throw new AppError("Poll Not Found", 404);
  }

  const pollDoc = poll as PollDocument;

  if (resolvePollStatus(pollDoc.endsAt) === "CLOSED") {
    logEvent("Poll Closed");
    throw new AppError("Poll Closed", 400);
  }

  const profile = await getProfile(userId);
  const { district: profileDistrict } = resolveDistrict(profile.district);

  if (profileDistrict !== pollDoc.district) {
    throw new AppError("Invalid District", 403);
  }

  const favoriteCrops = profile.favoriteCrops.map((crop) => crop.trim());
  if (!favoriteCrops.includes(pollDoc.crop)) {
    throw new AppError("Favourite Crop Required", 403);
  }

  const existingVote = await FarmerPriceVote.exists({
    pollId: pollDoc._id,
    userId: new Types.ObjectId(userId),
  });
  if (existingVote) {
    logEvent("Duplicate Vote");
    throw new AppError("Already Voted", 409);
  }

  const voteData = validateSubmitVote(body, {
    governmentPriceAvailable: pollDoc.governmentPriceAvailable,
    governmentPriceSnapshot: pollDoc.governmentPriceSnapshot,
  });

  await persistVoteAndRecalculate({
    pollId: pollDoc._id,
    userId,
    district: pollDoc.district,
    crop: pollDoc.crop,
    voteData,
  });

  const updatedPoll = await FarmerPricePoll.findById(pollDoc._id).lean();
  if (!updatedPoll) {
    throw new AppError("Poll Not Found", 404);
  }

  return toPollDetailDTO(updatedPoll as PollDocument);
};

export const getHistory = async (
  userId: string,
  crop: string
): Promise<HistoryResponseDTO> => {
  const trimmedCrop = crop.trim();
  if (trimmedCrop.length === 0) {
    throw new AppError("crop is required and must be a non-empty string.", 400);
  }

  const profile = await getProfile(userId);
  if (!profile.district) {
    throw new AppError("Invalid District", 400);
  }

  const { district } = resolveDistrict(profile.district);
  const now = new Date();

  const polls = await FarmerPricePoll.find({
    crop: trimmedCrop,
    district,
    endsAt: { $lte: now },
  })
    .sort({ endsAt: -1 })
    .limit(50)
    .select({
      crop: 1,
      district: 1,
      startsAt: 1,
      endsAt: 1,
      governmentPriceSnapshot: 1,
      governmentPriceAvailable: 1,
      communityExpectedPrice: 1,
      voteCount: 1,
      confidence: 1,
      createdAt: 1,
      updatedAt: 1,
      governmentPriceDate: 1,
      governmentUnit: 1,
      minimumVotesReached: 1,
      lastVoteAt: 1,
    })
    .lean();

  return {
    crop: trimmedCrop,
    district,
    polls: polls.map((poll) => toHistoryPollDTO(poll as PollDocument)),
  };
};
