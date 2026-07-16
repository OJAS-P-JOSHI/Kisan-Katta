/**
 * Quick verification for farmer-price sync (read + sync, no API contract changes).
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function main(): Promise<void> {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { runFarmerPriceSync } = await import(
    "../src/modules/farmer-price/farmer-price.sync.service"
  );
  const { FarmerPricePoll } = await import("../src/modules/farmer-price/farmer-price.model");
  const { MIN_FARMERS_PER_POLL } = await import("../src/modules/farmer-price/farmer-price.constants");

  console.log("MIN_FARMERS_PER_POLL =", MIN_FARMERS_PER_POLL);

  const before = await FarmerPricePoll.countDocuments({ endsAt: { $gt: new Date() } });
  console.log("Open polls before sync 1:", before);

  const r1 = await runFarmerPriceSync();
  console.log("Sync 1:", r1);

  const mid = await FarmerPricePoll.countDocuments({ endsAt: { $gt: new Date() } });
  console.log("Open polls after sync 1:", mid);

  const r2 = await runFarmerPriceSync();
  console.log("Sync 2:", r2);

  const after = await FarmerPricePoll.countDocuments({ endsAt: { $gt: new Date() } });
  console.log("Open polls after sync 2:", after);

  if (r2.created !== 0) {
    throw new Error(`Idempotency failed: second sync created ${r2.created} polls`);
  }
  if (after !== mid) {
    throw new Error(`Idempotency failed: open poll count changed ${mid} -> ${after}`);
  }

  // Duplicate active check
  const dupes = await FarmerPricePoll.aggregate([
    { $match: { endsAt: { $gt: new Date() } } },
    {
      $group: {
        _id: { district: "$district", crop: "$crop" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);
  if (dupes.length > 0) {
    throw new Error(`Duplicate active polls: ${JSON.stringify(dupes)}`);
  }

  console.log("VERIFY OK: idempotent, no duplicate active polls");
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
