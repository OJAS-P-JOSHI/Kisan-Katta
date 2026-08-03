/**
 * Migrates marketplace indexes for Majur Katta (labour) search + active-limit queries.
 *
 * - Drops the legacy text index (title/description/crop/category)
 * - Creates text index including village/taluka/district
 * - Ensures sellerId+listingType+status and village/taluka indexes
 *
 * Usage: npx ts-node scripts/migrate-marketplace-labour-indexes.ts
 */
import "dotenv/config";
import mongoose from "mongoose";

const DATABASE_NAME = "kisan-katta";
const COLLECTION = "marketplace";
const LEGACY_TEXT_INDEX = "title_text_description_text_crop_text_category_text";

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.useDb(DATABASE_NAME);
  const collection = db.collection(COLLECTION);

  const existing = await collection.indexes();
  console.log(
    "Existing indexes:",
    existing.map((index) => index.name).join(", ")
  );

  const hasLegacyText = existing.some((index) => index.name === LEGACY_TEXT_INDEX);
  if (hasLegacyText) {
    await collection.dropIndex(LEGACY_TEXT_INDEX);
    console.log(`Dropped legacy text index: ${LEGACY_TEXT_INDEX}`);
  } else {
    console.log("Legacy text index not found (already migrated or renamed).");
  }

  const textIndexExists = existing.some(
    (index) =>
      index.name !== LEGACY_TEXT_INDEX &&
      Object.values(index.key ?? {}).includes("text")
  );

  if (!textIndexExists || hasLegacyText) {
    await collection.createIndex(
      {
        title: "text",
        description: "text",
        crop: "text",
        category: "text",
        village: "text",
        taluka: "text",
        district: "text",
      },
      {
        name: "marketplace_text_search",
        default_language: "none",
      }
    );
    console.log("Created marketplace_text_search text index.");
  } else {
    console.log("Text index already present; skipped create.");
  }

  await collection.createIndex({ sellerId: 1, listingType: 1, status: 1 });
  await collection.createIndex({ village: 1 });
  await collection.createIndex({ taluka: 1 });
  console.log("Ensured sellerId+listingType+status, village, taluka indexes.");

  const after = await collection.indexes();
  console.log(
    "Indexes after migration:",
    after.map((index) => index.name).join(", ")
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
