import { Counter } from "./counter.model";

/**
 * Atomically increments and returns the next value for a named sequence.
 *
 * Uses MongoDB's atomic `findOneAndUpdate` with `$inc` and `upsert: true`, so
 * it is safe under concurrent requests: every caller receives a distinct,
 * strictly increasing integer. The counter document is created on first use
 * (starting the sequence at 1).
 *
 * This deliberately avoids `countDocuments() + 1`, which is racy.
 */
export const getNextSequence = async (counterId: string): Promise<number> => {
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  // With upsert + new:true the result is always present; guard for type-safety.
  if (!counter) {
    throw new Error(`Failed to generate sequence for counter "${counterId}".`);
  }

  return counter.sequence;
};

/**
 * Reads the current value of a sequence without incrementing it.
 * Returns 0 when the counter has never been used.
 */
export const peekSequence = async (counterId: string): Promise<number> => {
  const counter = await Counter.findById(counterId).lean();
  return counter?.sequence ?? 0;
};
