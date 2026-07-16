import { Schema, model, Types } from "mongoose";
import { resolveDistrict } from "../../config/maharashtraDistrictCoordinates";
import { AppError } from "../../utils/AppError";
import { FarmerProfile } from "../profile/profile.model";
import {
  DEFAULT_POLL_DURATION_HOURS,
  MIN_FARMERS_PER_POLL,
} from "./farmer-price.constants";
import { FarmerPricePoll } from "./farmer-price.model";
import { createPoll } from "./farmer-price.service";

// ---------------------------------------------------------------------------
// Open-slot lock (concurrency / idempotency)
// One document per district+crop. Never touches historical poll documents.
// ---------------------------------------------------------------------------

interface IFarmerPriceOpenSlot {
  district: string;
  crop: string;
  pollId: Types.ObjectId | null;
  endsAt: Date;
}

const FarmerPriceOpenSlotSchema = new Schema<IFarmerPriceOpenSlot>(
  {
    district: { type: String, required: true, trim: true },
    crop: { type: String, required: true, trim: true },
    pollId: { type: Schema.Types.ObjectId, ref: "FarmerPricePoll", default: null },
    endsAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    collection: "farmer_price_open_slots",
  }
);

FarmerPriceOpenSlotSchema.index({ district: 1, crop: 1 }, { unique: true });

const FarmerPriceOpenSlot = model<IFarmerPriceOpenSlot>(
  "FarmerPriceOpenSlot",
  FarmerPriceOpenSlotSchema
);

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

export interface FarmerPriceSyncResult {
  profilesScanned: number;
  uniquePairs: number;
  pairsAboveThreshold: number;
  existingPolls: number;
  created: number;
  skippedExisting: number;
  skippedBelowThreshold: number;
  failed: number;
  governmentPriceMissing: number;
  durationMs: number;
}

interface DistrictCropPair {
  district: string;
  crop: string;
  farmerCount: number;
}

const LOG_PREFIX = "[FarmerPriceScheduler]";

const log = (message: string): void => {
  // eslint-disable-next-line no-console
  console.log(`${LOG_PREFIX} ${message}`);
};

const pairKey = (district: string, crop: string): string => `${district}::${crop}`;

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code: unknown }).code === 11000;

const isPollAlreadyExistsError = (error: unknown): boolean =>
  error instanceof AppError &&
  error.statusCode === 409 &&
  error.message.toLowerCase().includes("already exists");

/**
 * Atomically claim the open slot for a district+crop pair.
 * Returns true if this worker may create a poll; false if another holder is active.
 */
const claimOpenSlot = async (
  district: string,
  crop: string,
  provisionalEndsAt: Date,
  now: Date
): Promise<boolean> => {
  const reclaimed = await FarmerPriceOpenSlot.findOneAndUpdate(
    {
      district,
      crop,
      endsAt: { $lte: now },
    },
    {
      $set: {
        endsAt: provisionalEndsAt,
        pollId: null,
      },
    },
    { new: true }
  );

  if (reclaimed) {
    return true;
  }

  try {
    await FarmerPriceOpenSlot.create({
      district,
      crop,
      endsAt: provisionalEndsAt,
      pollId: null,
    });
    return true;
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      return false;
    }
    throw error;
  }
};

const releaseOpenSlot = async (district: string, crop: string): Promise<void> => {
  await FarmerPriceOpenSlot.updateOne(
    { district, crop },
    { $set: { endsAt: new Date(0), pollId: null } }
  );
};

const bindOpenSlotToPoll = async (
  district: string,
  crop: string,
  pollId: string,
  endsAt: Date
): Promise<void> => {
  await FarmerPriceOpenSlot.updateOne(
    { district, crop },
    {
      $set: {
        pollId,
        endsAt,
      },
    },
    { upsert: true }
  );
};

const loadDistrictCropInterest = async (): Promise<{
  profilesScanned: number;
  pairs: DistrictCropPair[];
}> => {
  const profiles = await FarmerProfile.find(
    {},
    { district: 1, favoriteCrops: 1, _id: 0 }
  ).lean();

  const counts = new Map<string, DistrictCropPair>();
  let profilesScanned = 0;

  for (const profile of profiles) {
    const rawDistrict = typeof profile.district === "string" ? profile.district.trim() : "";
    if (!rawDistrict) continue;

    const crops = Array.isArray(profile.favoriteCrops) ? profile.favoriteCrops : [];
    if (crops.length === 0) continue;

    profilesScanned += 1;

    let district: string;
    try {
      district = resolveDistrict(rawDistrict).district;
    } catch {
      continue;
    }

    const seenInProfile = new Set<string>();

    for (const rawCrop of crops) {
      if (typeof rawCrop !== "string") continue;
      const crop = rawCrop.trim();
      if (!crop || seenInProfile.has(crop)) continue;
      seenInProfile.add(crop);

      const key = pairKey(district, crop);
      const existing = counts.get(key);
      if (existing) {
        existing.farmerCount += 1;
      } else {
        counts.set(key, { district, crop, farmerCount: 1 });
      }
    }
  }

  return {
    profilesScanned,
    pairs: [...counts.values()],
  };
};

const loadOpenPairKeys = async (now: Date): Promise<Set<string>> => {
  const openPolls = await FarmerPricePoll.find(
    { endsAt: { $gt: now } },
    { district: 1, crop: 1, _id: 0 }
  ).lean();

  return new Set(openPolls.map((poll) => pairKey(poll.district, poll.crop)));
};

const ensurePollForPair = async (
  pair: DistrictCropPair,
  openKeys: Set<string>,
  now: Date,
  stats: {
    created: number;
    skippedExisting: number;
    failed: number;
    governmentPriceMissing: number;
  }
): Promise<void> => {
  const key = pairKey(pair.district, pair.crop);

  if (openKeys.has(key)) {
    stats.skippedExisting += 1;
    return;
  }

  const provisionalEndsAt = new Date(
    now.getTime() + DEFAULT_POLL_DURATION_HOURS * 60 * 60 * 1000
  );
  const claimed = await claimOpenSlot(pair.district, pair.crop, provisionalEndsAt, now);

  if (!claimed) {
    stats.skippedExisting += 1;
    return;
  }

  try {
    // Re-check after claim (another path may have created the poll).
    const stillOpen = await FarmerPricePoll.exists({
      district: pair.district,
      crop: pair.crop,
      endsAt: { $gt: new Date() },
    });

    if (stillOpen) {
      stats.skippedExisting += 1;
      const existing = await FarmerPricePoll.findOne(
        {
          district: pair.district,
          crop: pair.crop,
          endsAt: { $gt: new Date() },
        },
        { _id: 1, endsAt: 1 }
      ).lean();

      if (existing) {
        await bindOpenSlotToPoll(
          pair.district,
          pair.crop,
          existing._id.toString(),
          existing.endsAt
        );
        openKeys.add(key);
      }
      return;
    }

    const poll = await createPoll({
      district: pair.district,
      crop: pair.crop,
    });

    await bindOpenSlotToPoll(pair.district, pair.crop, poll.id, new Date(poll.endsAt));
    openKeys.add(key);
    stats.created += 1;

    if (!poll.governmentPriceAvailable) {
      stats.governmentPriceMissing += 1;
      log(`Government Price Missing district=${pair.district} crop=${pair.crop}`);
    }
  } catch (error: unknown) {
    if (isPollAlreadyExistsError(error) || isDuplicateKeyError(error)) {
      stats.skippedExisting += 1;
      const existing = await FarmerPricePoll.findOne(
        {
          district: pair.district,
          crop: pair.crop,
          endsAt: { $gt: new Date() },
        },
        { _id: 1, endsAt: 1 }
      ).lean();

      if (existing) {
        await bindOpenSlotToPoll(
          pair.district,
          pair.crop,
          existing._id.toString(),
          existing.endsAt
        );
        openKeys.add(key);
      } else {
        await releaseOpenSlot(pair.district, pair.crop);
      }
      return;
    }

    await releaseOpenSlot(pair.district, pair.crop);
    stats.failed += 1;

    const reason = error instanceof Error ? error.message : String(error);
    log(`Poll create failed district=${pair.district} crop=${pair.crop} reason=${reason}`);
  }
};

/**
 * Internal sync entry point used by startup, the hourly scheduler,
 * and future admin tools. Not exposed as a public HTTP API.
 */
export const runFarmerPriceSync = async (): Promise<FarmerPriceSyncResult> => {
  const startedAt = Date.now();
  log("Synchronization Started");

  const now = new Date();
  const { profilesScanned, pairs } = await loadDistrictCropInterest();

  log(`Profiles Scanned: ${profilesScanned}`);
  log(`Unique District/Crop Pairs: ${pairs.length}`);

  const eligible = pairs.filter((pair) => pair.farmerCount >= MIN_FARMERS_PER_POLL);
  const skippedBelowThreshold = pairs.length - eligible.length;

  log(
    `Pairs above threshold (>=${MIN_FARMERS_PER_POLL}): ${eligible.length}; below: ${skippedBelowThreshold}`
  );

  const openKeys = await loadOpenPairKeys(now);
  const existingOpenCount = openKeys.size;
  log(`Existing Polls (open): ${existingOpenCount}`);

  const stats = {
    created: 0,
    skippedExisting: 0,
    failed: 0,
    governmentPriceMissing: 0,
  };

  for (const pair of eligible) {
    await ensurePollForPair(pair, openKeys, now, stats);
  }

  // Pairs below threshold that already have an open poll are left untouched.
  const durationMs = Date.now() - startedAt;

  log(
    `Sync started | Profiles: ${profilesScanned} | Unique pairs: ${pairs.length} | Created: ${stats.created} | Skipped: ${stats.skippedExisting} | Duration: ${durationMs} ms`
  );
  log(
    `Synchronization Finished created=${stats.created} skippedExisting=${stats.skippedExisting} skippedBelowThreshold=${skippedBelowThreshold} failed=${stats.failed} governmentPriceMissing=${stats.governmentPriceMissing} durationMs=${durationMs}`
  );

  return {
    profilesScanned,
    uniquePairs: pairs.length,
    pairsAboveThreshold: eligible.length,
    existingPolls: existingOpenCount,
    created: stats.created,
    skippedExisting: stats.skippedExisting,
    skippedBelowThreshold,
    failed: stats.failed,
    governmentPriceMissing: stats.governmentPriceMissing,
    durationMs,
  };
};
