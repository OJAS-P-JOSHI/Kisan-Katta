/**
 * Soft-delete leftover Assistance QA documents that pollute the public feed.
 * Run: node scripts/cleanup-qa-assistance.js
 */
require("dotenv").config();
const { MongoClient } = require("mongodb");

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  const filter = {
    isDeleted: false,
    title: {
      $in: [
        "QA Updated Title After Approval",
        "QA Reject Me",
        "QA Delete Me",
        "QA Archive Me",
      ],
    },
  };

  const result = await db.collection("help_requests").updateMany(filter, {
    $set: { isDeleted: true, deletedAt: new Date() },
  });

  console.log(`Soft-deleted ${result.modifiedCount} QA leftover help requests.`);

  const open = await db
    .collection("help_requests")
    .find({ isDeleted: false, status: "OPEN" })
    .project({ title: 1, status: 1, supportCount: 1, resolvedAt: 1 })
    .toArray();

  console.log("Remaining OPEN requests:", JSON.stringify(open, null, 2));
  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
