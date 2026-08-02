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
  ENSURE_PEER_POLL_INTERVAL_MS,
  ENSURE_PEER_WAIT_MS,
  MINIMUM_VOTES_REQUIRED,
  RECENT_INSIGHTS_LIMIT,
} from "./farmer-price.constants";
import { FarmerPricePoll, FarmerPriceVote } from "./farmer-price.model";
import {
  bindOpenSlotToPoll,
  claimOpenSlot,
  releaseOpenSlot,
} from "./farmer-price.slot";
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
  MarketSignalDTO,
  MyVoteDTO,
  PaginatedPollsDTO,
  PollDetailResponseDTO,
  PollResponseDTO,
  PollsQuery,
  PollStatus,
  ReasonType,
  RecentInsightDTO,
  SubmitVoteBody,
} from "./farmer-price.types";
import {
  getAllowedPriceRange,
  validateSubmitVote,
} from "./farmer-price.validation";

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

/** MongoDB write conflicts under concurrent votes on the same poll document. */
const isTransientTransactionError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as {
    code?: number;
    codeName?: string;
    message?: string;
    errorLabels?: string[];
  };

  if (candidate.errorLabels?.includes("TransientTransactionError")) {
    return true;
  }
  if (candidate.codeName === "WriteConflict" || candidate.code === 112) {
    return true;
  }
  if (
    typeof candidate.message === "string" &&
    candidate.message.toLowerCase().includes("write conflict")
  ) {
    return true;
  }

  return false;
};

const VOTE_TRANSACTION_MAX_ATTEMPTS = 8;

type CallerVoteState = {
  hasVoted: boolean;
  myVote: MyVoteDTO | null;
};

const NO_CALLER_VOTE: CallerVoteState = { hasVoted: false, myVote: null };

const toMyVoteDTO = (vote: {
  expectedPrice: number;
  reasonType?: ReasonType | null;
  reasonText?: string | null;
  createdAt: Date;
}): MyVoteDTO => {
  const dto: MyVoteDTO = {
    expectedPrice: vote.expectedPrice,
    createdAt: vote.createdAt,
  };
  if (typeof vote.reasonType === "string") {
    dto.reasonType = vote.reasonType;
  }
  if (typeof vote.reasonText === "string" && vote.reasonText.trim().length > 0) {
    dto.reasonText = vote.reasonText.trim();
  }
  return dto;
};

/**
 * One indexed query for the caller's votes across many polls.
 * Uses unique { pollId, userId } — at most one vote per poll.
 */
const loadCallerVotesByPollIds = async (
  userId: string,
  pollIds: Types.ObjectId[]
): Promise<Map<string, MyVoteDTO>> => {
  const map = new Map<string, MyVoteDTO>();
  if (pollIds.length === 0) {
    return map;
  }

  const votes = await FarmerPriceVote.find({
    userId: new Types.ObjectId(userId),
    pollId: { $in: pollIds },
  })
    .select({ pollId: 1, expectedPrice: 1, reasonType: 1, reasonText: 1, createdAt: 1 })
    .lean();

  for (const vote of votes) {
    map.set(vote.pollId.toString(), toMyVoteDTO(vote));
  }
  return map;
};

const callerVoteStateFromMap = (
  pollId: string,
  votesByPollId: Map<string, MyVoteDTO>
): CallerVoteState => {
  const myVote = votesByPollId.get(pollId) ?? null;
  return myVote ? { hasVoted: true, myVote } : NO_CALLER_VOTE;
};

const toPollDTO = (
  doc: PollDocument,
  callerVote: CallerVoteState = NO_CALLER_VOTE
): PollResponseDTO => {
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
    allowedPriceRange: getAllowedPriceRange({
      governmentPriceAvailable: doc.governmentPriceAvailable,
      governmentPriceSnapshot: doc.governmentPriceSnapshot,
    }),
    lastVoteAt: doc.lastVoteAt ?? null,
    startsAt: doc.startsAt,
    endsAt: doc.endsAt,
    status: resolvePollStatus(doc.endsAt),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    hasVoted: callerVote.hasVoted,
    myVote: callerVote.myVote,
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

/**
 * Aggregated reason counts across every vote on the poll, strongest first.
 * Read-only over existing vote documents — no schema or vote logic change.
 */
const fetchMarketSignals = async (
  pollId: Types.ObjectId
): Promise<MarketSignalDTO[]> => {
  const rows = await FarmerPriceVote.aggregate<{
    _id: ReasonType;
    farmerCount: number;
  }>([
    { $match: { pollId, reasonType: { $exists: true, $ne: null } } },
    { $group: { _id: "$reasonType", farmerCount: { $sum: 1 } } },
    { $sort: { farmerCount: -1, _id: 1 } },
  ]);

  return rows
    .filter((row) => typeof row._id === "string")
    .map((row) => ({
      reasonType: row._id,
      farmerCount: row.farmerCount,
    }));
};

const toPollDetailDTO = async (
  doc: PollDocument,
  callerVote: CallerVoteState = NO_CALLER_VOTE
): Promise<PollDetailResponseDTO> => {
  const summary = toPollDTO(doc, callerVote);
  const [marketSignals, recentInsights] = await Promise.all([
    fetchMarketSignals(doc._id),
    fetchRecentInsights(doc._id),
  ]);

  return {
    ...summary,
    remainingHours: calculateRemainingHours(doc.endsAt),
    marketSignals,
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
 * Transient write conflicts are retried so concurrent voters on the same poll
 * do not fail spuriously.
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

  let useStandaloneFallback = false;
  let lastTransientError: unknown;

  for (let attempt = 1; attempt <= VOTE_TRANSACTION_MAX_ATTEMPTS; attempt++) {
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

      if (isTransactionUnsupportedError(error)) {
        useStandaloneFallback = true;
        break;
      }

      if (isTransientTransactionError(error) && attempt < VOTE_TRANSACTION_MAX_ATTEMPTS) {
        lastTransientError = error;
        await sleep(25 * attempt);
        continue;
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }

  if (!useStandaloneFallback) {
    throw lastTransientError instanceof Error
      ? lastTransientError
      : new AppError("Invalid Vote", 500);
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

export const getPoll = async (
  pollId: string,
  userId: string
): Promise<PollDetailResponseDTO> => {
  assertValidObjectId(pollId, "pollId");

  const poll = await FarmerPricePoll.findById(pollId).lean();
  if (!poll) {
    throw new AppError("Poll Not Found", 404);
  }

  const pollDoc = poll as PollDocument;
  const votesByPollId = await loadCallerVotesByPollIds(userId, [pollDoc._id]);
  return toPollDetailDTO(
    pollDoc,
    callerVoteStateFromMap(pollDoc._id.toString(), votesByPollId)
  );
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Another request holds the open-slot lock and is creating the poll.
 * Poll until it appears (or the wait budget expires) so /polls/my never
 * returns empty solely because creation is still in flight.
 */
const waitForPeerCreatedPoll = async (
  district: string,
  crop: string
): Promise<boolean> => {
  const deadline = Date.now() + ENSURE_PEER_WAIT_MS;
  while (Date.now() < deadline) {
    const existing = await findActivePoll(district, crop);
    if (existing) {
      return true;
    }
    await sleep(ENSURE_PEER_POLL_INTERVAL_MS);
  }
  return (await findActivePoll(district, crop)) !== null;
};

/**
 * Creates the open poll for one district+crop pair if none exists.
 * Uses the same open-slot lock as the hourly scheduler, so concurrent
 * requests and the scheduler can never produce two active polls for a pair.
 *
 * Losers of the claim race wait for the winner's poll instead of returning
 * early with an empty list.
 */
const ensureActivePollForPair = async (
  district: string,
  crop: string
): Promise<void> => {
  if (await findActivePoll(district, crop)) {
    return;
  }

  const provisionalEndsAt = () =>
    new Date(Date.now() + DEFAULT_POLL_DURATION_HOURS * 60 * 60 * 1000);

  let claimed = await claimOpenSlot(
    district,
    crop,
    provisionalEndsAt(),
    new Date()
  );

  if (!claimed) {
    if (await waitForPeerCreatedPoll(district, crop)) {
      return;
    }
    // Winner may have failed and released the slot — try once more.
    claimed = await claimOpenSlot(
      district,
      crop,
      provisionalEndsAt(),
      new Date()
    );
    if (!claimed) {
      await waitForPeerCreatedPoll(district, crop);
      return;
    }
  }

  try {
    const stillOpen = await findActivePoll(district, crop);
    if (stillOpen) {
      await bindOpenSlotToPoll(
        district,
        crop,
        stillOpen._id.toString(),
        stillOpen.endsAt
      );
      return;
    }

    const poll = await createPoll({ district, crop });
    await bindOpenSlotToPoll(district, crop, poll.id, new Date(poll.endsAt));
  } catch (error: unknown) {
    // Another writer may have won the race between the re-check and the insert;
    // bind the slot to whatever poll now exists, otherwise free it for a retry.
    const existing = await findActivePoll(district, crop).catch(() => null);
    if (existing) {
      await bindOpenSlotToPoll(
        district,
        crop,
        existing._id.toString(),
        existing.endsAt
      ).catch(() => undefined);
    } else {
      await releaseOpenSlot(district, crop).catch(() => undefined);
    }

    const reason = error instanceof Error ? error.message : String(error);
    logEvent(`Ensure poll failed district=${district} crop=${crop} reason=${reason}`);
  }
};

/**
 * Guarantees an open poll exists for every crop the farmer follows, so the
 * app never has to wait for the hourly scheduler or show an empty screen.
 * Failures are swallowed — a missing poll must never break the read path.
 */
const ensureActivePollsForFarmer = async (
  district: string,
  crops: string[]
): Promise<void> => {
  const openPolls = await FarmerPricePoll.find(
    { district, crop: { $in: crops }, endsAt: { $gt: new Date() } },
    { crop: 1, _id: 0 }
  ).lean();

  const openCrops = new Set(openPolls.map((poll) => poll.crop));
  const missing = crops.filter((crop) => !openCrops.has(crop));

  if (missing.length === 0) {
    return;
  }

  await Promise.all(
    missing.map((crop) => ensureActivePollForPair(district, crop))
  );
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

  await ensureActivePollsForFarmer(district, favoriteCrops);

  const now = new Date();

  const polls = await FarmerPricePoll.find({
    district,
    crop: { $in: favoriteCrops },
    endsAt: { $gt: now },
  })
    .sort({ endsAt: 1 })
    .lean();

  const pollDocs = polls as PollDocument[];
  const votesByPollId = await loadCallerVotesByPollIds(
    userId,
    pollDocs.map((poll) => poll._id)
  );

  return pollDocs.map((poll) =>
    toPollDTO(poll, callerVoteStateFromMap(poll._id.toString(), votesByPollId))
  );
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

  const myVote: MyVoteDTO = toMyVoteDTO({
    expectedPrice: voteData.expectedPrice,
    reasonType: voteData.reasonType,
    reasonText: voteData.reasonText,
    createdAt: new Date(),
  });

  return toPollDetailDTO(updatedPoll as PollDocument, {
    hasVoted: true,
    myVote,
  });
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
