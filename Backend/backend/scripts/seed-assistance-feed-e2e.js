/**
 * Seed 10 OPEN help requests from different users for feed E2E verification.
 * Run from Backend/backend: node scripts/seed-assistance-feed-e2e.js
 */
require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

const SEED_TAG = "FEED_E2E";
const DESCRIPTION =
  "This is an end-to-end feed verification help request description with more than one hundred characters so validation length rules stay satisfied for seeded OPEN assistance cards.";

const IMAGE = {
  url: "https://res.cloudinary.com/dtlzumudh/image/upload/v1785692452/kisan-katta/assistance/6a5126dd996d6dab06c9b751/f5957cce86d84664b53a8cace5411555.jpg",
  publicId:
    "kisan-katta/assistance/6a5126dd996d6dab06c9b751/f5957cce86d84664b53a8cace5411555",
};

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  // Soft-delete prior E2E seeds and any leftover public feed rows so the feed
  // has a known set of exactly 10 OPEN requests.
  const cleanup = await db.collection("help_requests").updateMany(
    {
      isDeleted: false,
      $or: [
        { title: { $regex: `^${SEED_TAG}` } },
        { status: { $in: ["OPEN", "RESOLVED"] } },
      ],
    },
    { $set: { isDeleted: true, deletedAt: new Date() } },
  );
  console.log(`Soft-deleted ${cleanup.modifiedCount} prior public/E2E requests.`);

  const profiles = await db
    .collection("farmer_profiles")
    .find({
      name: { $exists: true, $ne: "" },
      district: { $exists: true, $ne: "" },
      taluka: { $exists: true, $ne: "" },
      village: { $exists: true, $ne: "" },
      userId: { $exists: true },
    })
    .limit(40)
    .toArray();

  const uniqueByUser = [];
  const seen = new Set();
  for (const profile of profiles) {
    const userId = String(profile.userId);
    if (seen.has(userId)) continue;
    // Skip names with null bytes from bad QA data.
    if (String(profile.name).includes("\u0000")) continue;
    seen.add(userId);
    uniqueByUser.push(profile);
    if (uniqueByUser.length >= 10) break;
  }

  if (uniqueByUser.length < 10) {
    throw new Error(`Need 10 distinct profiles, found ${uniqueByUser.length}`);
  }

  const now = Date.now();
  const docs = uniqueByUser.map((profile, index) => {
    const createdAt = new Date(now - (9 - index) * 60_000);
    return {
      author: {
        userId: profile.userId,
        name: String(profile.name).trim(),
        profilePhoto: profile.profileImage?.url ?? null,
        village: profile.village,
        taluka: profile.taluka,
        district: profile.district,
        state: "Maharashtra",
        verified: true,
      },
      title: `${SEED_TAG} ${index + 1} — ${profile.district} help`,
      description: DESCRIPTION,
      images: [IMAGE],
      status: "OPEN",
      supportCount: index % 4,
      reportCount: 0,
      isDeleted: false,
      deletedAt: null,
      reviewedAt: createdAt,
      reviewedBy: null,
      moderationNote: "E2E seed approved",
      resolvedAt: null,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const insert = await db.collection("help_requests").insertMany(docs);
  console.log(`Inserted ${insert.insertedCount} OPEN help requests.`);

  const openCount = await db.collection("help_requests").countDocuments({
    isDeleted: false,
    status: "OPEN",
  });
  console.log(`OPEN feed count now: ${openCount}`);

  const titles = await db
    .collection("help_requests")
    .find({ isDeleted: false, status: "OPEN" })
    .project({ title: 1, "author.name": 1, "author.userId": 1 })
    .sort({ createdAt: -1 })
    .toArray();
  console.log(JSON.stringify(titles, null, 2));

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
