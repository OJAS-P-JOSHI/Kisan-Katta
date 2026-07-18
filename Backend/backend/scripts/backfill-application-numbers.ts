/**
 * Backfills `applicationNumber` for any Gram Sahakari applications created
 * before the field existed.
 *
 * Behaviour:
 *   - Selects only documents missing `applicationNumber`.
 *   - Processes them sorted by `createdAt` ascending (oldest first) so numbers
 *     are assigned in chronological order.
 *   - Draws each number from the SAME atomic counter used at runtime, so
 *     backfilled and future live numbers never collide.
 *   - Writes via the native driver with a guard (`applicationNumber` still
 *     absent) so it NEVER overwrites an existing number.
 *   - Idempotent: re-running finds nothing to do and consumes no sequences.
 *
 * Usage:
 *   npx ts-node scripts/backfill-application-numbers.ts
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { GramSahakariApplication } from "../src/modules/gram-sahakari/gram-sahakari.model";
import { generateApplicationNumber } from "../src/modules/gram-sahakari/service/application-number.service";

dotenv.config();

interface BackfillResult {
  scanned: number;
  updated: number;
  skipped: number;
}

export const backfillApplicationNumbers = async (): Promise<BackfillResult> => {
  const result: BackfillResult = { scanned: 0, updated: 0, skipped: 0 };

  // Cursor over legacy documents only, oldest first.
  const cursor = GramSahakariApplication.find({
    applicationNumber: { $exists: false },
  })
    .sort({ createdAt: 1 })
    .cursor();

  for await (const doc of cursor) {
    result.scanned += 1;

    const createdAt = doc.get("createdAt") as Date | undefined;
    const { applicationNumber } = await generateApplicationNumber(
      createdAt ?? new Date()
    );

    // Native-driver write bypasses the schema's `immutable` guard and, via the
    // `$exists:false` filter, guarantees we never overwrite an existing value.
    const writeResult = await GramSahakariApplication.collection.updateOne(
      { _id: doc._id, applicationNumber: { $exists: false } },
      { $set: { applicationNumber } }
    );

    if (writeResult.modifiedCount === 1) {
      result.updated += 1;
      // eslint-disable-next-line no-console
      console.log(`Backfilled ${String(doc._id)} -> ${applicationNumber}`);
    } else {
      result.skipped += 1;
    }
  }

  return result;
};

const run = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/kisan-katta";
  await mongoose.connect(uri);

  // eslint-disable-next-line no-console
  console.log("Connected to MongoDB. Backfilling application numbers...");

  const result = await backfillApplicationNumbers();

  // eslint-disable-next-line no-console
  console.log(
    `Backfill complete. scanned=${result.scanned} updated=${result.updated} skipped=${result.skipped}`
  );

  await mongoose.disconnect();
};

// Only auto-run when invoked directly (so tests can import the function).
if (require.main === module) {
  run().catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error("Backfill failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  });
}
