import { Schema, model, Types } from "mongoose";

// ---------------------------------------------------------------------------
// Open-slot lock (concurrency / idempotency)
// One document per district+crop. Never touches historical poll documents.
// Shared by the hourly scheduler and the on-demand ensure path so both
// creation routes contend for the same lock.
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

export const FarmerPriceOpenSlot = model<IFarmerPriceOpenSlot>(
  "FarmerPriceOpenSlot",
  FarmerPriceOpenSlotSchema
);

export const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code: unknown }).code === 11000;

/**
 * Atomically claim the open slot for a district+crop pair.
 * Returns true if this worker may create a poll; false if another holder is active.
 */
export const claimOpenSlot = async (
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

export const releaseOpenSlot = async (district: string, crop: string): Promise<void> => {
  await FarmerPriceOpenSlot.updateOne(
    { district, crop },
    { $set: { endsAt: new Date(0), pollId: null } }
  );
};

export const bindOpenSlotToPoll = async (
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
