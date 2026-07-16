/**
 * Investigate: can two different users vote on the same poll?
 * Read-only regarding app code — creates temporary users/votes, cleans up after.
 */
import mongoose, { Types } from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const BASE = process.env.QA_BASE_URL ?? "http://127.0.0.1:4000";
const MONGODB_URI = process.env.MONGODB_URI!;

type Json = Record<string, unknown>;

async function http(
  method: string,
  urlPath: string,
  opts: { token?: string; body?: unknown } = {}
): Promise<{ status: number; json: Json; rawText: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const rawText = await res.text();
  let json: Json = {};
  try {
    json = JSON.parse(rawText) as Json;
  } catch {
    json = { _parseError: true, raw: rawText };
  }
  return { status: res.status, json, rawText };
}

async function login(mobile: string): Promise<{ token: string; userId: string }> {
  const send = await http("POST", "/api/v1/auth/send-otp", { body: { mobile } });
  const otp = (send.json["data"] as { otp: string }).otp;
  const verify = await http("POST", "/api/v1/auth/verify-otp", {
    body: { mobile, otp },
  });
  const token = (verify.json["data"] as { token: string }).token;
  const me = await http("GET", "/api/v1/auth/me", { token });
  const userId = (me.json["data"] as { userId: string }).userId;
  return { token, userId };
}

async function ensureProfile(
  token: string,
  body: {
    name: string;
    district: string;
    taluka: string;
    village: string;
    favoriteCrops: string[];
    language: string;
  }
): Promise<void> {
  const existing = await http("GET", "/api/v1/profile/me", { token });
  if (existing.status === 200) {
    await http("PUT", "/api/v1/profile/me", { token, body });
    return;
  }
  await http("POST", "/api/v1/profile/", { token, body });
}

async function main(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;
  const votesCol = db.collection("farmer_price_votes");
  const pollsCol = db.collection("farmer_price_polls");

  console.log("\n========== 1) MONGO INDEXES on farmer_price_votes ==========");
  const indexes = await votesCol.indexes();
  console.log(JSON.stringify(indexes, null, 2));

  const uniqueCompound = indexes.filter((idx) => idx.unique === true);
  console.log("\nUnique indexes only:");
  for (const idx of uniqueCompound) {
    console.log(" -", JSON.stringify({ name: idx.name, key: idx.key, unique: idx.unique }));
  }

  const hasPollUserUnique = uniqueCompound.some((idx) => {
    const key = idx.key as Record<string, number>;
    const keys = Object.keys(key);
    return keys.length === 2 && key["pollId"] === 1 && key["userId"] === 1;
  });
  const hasPollOnlyUnique = uniqueCompound.some((idx) => {
    const key = idx.key as Record<string, number>;
    const keys = Object.keys(key);
    return keys.length === 1 && key["pollId"] === 1;
  });

  console.log("\nHas unique { pollId: 1, userId: 1 }?", hasPollUserUnique);
  console.log("Has unique { pollId: 1 } only?", hasPollOnlyUnique);

  console.log("\n========== 2) DUPLICATE VOTE QUERY (from source) ==========");
  console.log(
    `FarmerPriceVote.exists({\n  pollId: pollDoc._id,\n  userId: new Types.ObjectId(userId),\n})`
  );
  console.log("File: farmer-price.service.ts submitVote ~ lines 563-569");

  // Create dedicated poll for this test
  const crop = `__QA_VOTE_BUG_${Date.now()}`;
  const district = "Nashik";

  const userA = await login("9111000001");
  const userB = await login("9111000002");
  console.log("\n========== USERS ==========");
  console.log("User A:", userA);
  console.log("User B:", userB);
  console.log("Same userId?", userA.userId === userB.userId);

  const profileBody = {
    name: "QA Vote Bug",
    district,
    taluka: "Niphad",
    village: "Lasalgaon",
    favoriteCrops: [crop],
    language: "en",
  };
  await ensureProfile(userA.token, { ...profileBody, name: "QA Vote A" });
  await ensureProfile(userB.token, { ...profileBody, name: "QA Vote B" });

  const create = await http("POST", "/api/v1/farmer-price/polls", {
    token: userA.token,
    body: { crop, district },
  });
  console.log("\nCreate poll status:", create.status);
  const poll = create.json["data"] as Record<string, unknown>;
  const pollId = String(poll?.["id"] ?? "");
  console.log("pollId:", pollId);
  console.log("gov available:", poll?.["governmentPriceAvailable"], "snapshot:", poll?.["governmentPriceSnapshot"]);

  // Ensure gov snapshot for easy voting (exact match = no reason needed)
  // Or vote with reason if no gov
  let voteBody: Record<string, unknown>;
  if (poll?.["governmentPriceAvailable"] && typeof poll["governmentPriceSnapshot"] === "number") {
    voteBody = { expectedPrice: poll["governmentPriceSnapshot"] };
  } else {
    // Force a known snapshot for clean votes
    await pollsCol.updateOne(
      { _id: new Types.ObjectId(pollId) },
      {
        $set: {
          governmentPriceAvailable: true,
          governmentPriceSnapshot: 10000,
          governmentUnit: "Quintal",
          governmentPriceDate: new Date(),
        },
      }
    );
    voteBody = { expectedPrice: 10000 };
  }

  console.log("\n========== 4) TWO-USER VOTE TEST ==========");
  const voteA1 = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: userA.token,
    body: voteBody,
  });
  console.log("\n--- Vote 1: User A ---");
  console.log("status:", voteA1.status);
  console.log("success:", voteA1.json["success"]);
  console.log("message:", voteA1.json["message"]);
  console.log("voteCount:", (voteA1.json["data"] as Json | undefined)?.["voteCount"]);

  const votesAfterA = await votesCol
    .find({ pollId: new Types.ObjectId(pollId) })
    .project({ userId: 1, expectedPrice: 1, createdAt: 1 })
    .toArray();
  console.log("DB votes after A:", JSON.stringify(votesAfterA, null, 2));

  const voteB1 = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: userB.token,
    body: voteBody,
  });
  console.log("\n--- Vote 2: User B (different user) ---");
  console.log("status:", voteB1.status);
  console.log("success:", voteB1.json["success"]);
  console.log("message:", voteB1.json["message"]);
  console.log("full body:", voteB1.rawText);
  console.log("voteCount:", (voteB1.json["data"] as Json | undefined)?.["voteCount"]);

  if (voteB1.status !== 201) {
    console.log("\n*** USER B REJECTED ***");
    console.log("Exact reason:", voteB1.json["message"] ?? voteB1.rawText);
    console.log("HTTP status:", voteB1.status);
  }

  const votesAfterB = await votesCol
    .find({ pollId: new Types.ObjectId(pollId) })
    .project({ userId: 1, expectedPrice: 1, createdAt: 1 })
    .toArray();
  console.log("DB votes after B:", JSON.stringify(votesAfterB, null, 2));

  const voteA2 = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: userA.token,
    body: voteBody,
  });
  console.log("\n--- Vote 3: User A again (should fail) ---");
  console.log("status:", voteA2.status);
  console.log("message:", voteA2.json["message"]);
  console.log("full body:", voteA2.rawText);

  const finalVotes = await votesCol.countDocuments({ pollId: new Types.ObjectId(pollId) });
  console.log("\n========== SUMMARY ==========");
  console.log("User A first vote OK?", voteA1.status === 201);
  console.log("User B vote OK?", voteB1.status === 201);
  console.log("User A second vote rejected?", voteA2.status === 409);
  console.log("Final vote documents for poll:", finalVotes);
  console.log(
    "Distinct userIds on poll:",
    [...new Set(votesAfterB.map((v) => String(v.userId)))].join(", ")
  );

  // Simulate the exact exists query for User B after A voted
  const existsForB = await votesCol.findOne({
    pollId: new Types.ObjectId(pollId),
    userId: new Types.ObjectId(userB.userId),
  });
  console.log("\nexists({pollId, userId:B}) after A voted:", existsForB);

  const existsForA = await votesCol.findOne({
    pollId: new Types.ObjectId(pollId),
    userId: new Types.ObjectId(userA.userId),
  });
  console.log("exists({pollId, userId:A}) after A voted:", !!existsForA);

  // Cleanup
  await votesCol.deleteMany({ pollId: new Types.ObjectId(pollId) });
  await pollsCol.deleteOne({ _id: new Types.ObjectId(pollId) });
  await db.collection("farmer_price_open_slots").deleteMany({ crop });

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
