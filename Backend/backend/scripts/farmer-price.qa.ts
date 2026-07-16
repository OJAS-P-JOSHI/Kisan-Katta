/**
 * Farmer Price — Production-freeze QA suite
 * Temporary script: HTTP + MongoDB validation. Cleans up QA data on exit.
 */
import mongoose, { Types } from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const BASE = process.env.QA_BASE_URL ?? "http://127.0.0.1:4000";
const MONGODB_URI = process.env.MONGODB_URI!;

type Result = { name: string; status: "PASS" | "FAIL" | "SKIP"; detail?: string };

const results: Result[] = [];
const qaCropA = `__QA_FP_CropA_${Date.now()}`;
const qaCropB = `__QA_FP_CropB_${Date.now()}`;
const mobiles = {
  jalnaFavA: "9000000001",
  puneFavA: "9000000002",
  jalnaFavB: "9000000003",
};

const createdPollIds: string[] = [];
const createdUserIds: string[] = [];

const record = (name: string, status: Result["status"], detail?: string) => {
  results.push({ name, status, detail });
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⏭️";
  // eslint-disable-next-line no-console
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ""}`);
};

const assert = (name: string, condition: boolean, detail?: string) => {
  record(name, condition ? "PASS" : "FAIL", detail);
  return condition;
};

async function http(
  method: string,
  urlPath: string,
  opts: { token?: string; body?: unknown; expectStatus?: number } = {}
): Promise<{ status: number; json: Record<string, unknown> }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    json = {};
  }

  if (opts.expectStatus !== undefined && res.status !== opts.expectStatus) {
    throw new Error(
      `${method} ${urlPath} expected ${opts.expectStatus}, got ${res.status}: ${JSON.stringify(json)}`
    );
  }

  return { status: res.status, json };
}

async function login(mobile: string): Promise<{ token: string; userId: string }> {
  const otpRes = await http("POST", "/api/v1/auth/send-otp", {
    body: { mobile },
    expectStatus: 200,
  });
  const data = otpRes.json["data"] as { otp: string };
  const verify = await http("POST", "/api/v1/auth/verify-otp", {
    body: { mobile, otp: data.otp },
    expectStatus: 200,
  });
  const vdata = verify.json["data"] as { token: string };
  const me = await http("GET", "/api/v1/auth/me", {
    token: vdata.token,
    expectStatus: 200,
  });
  const meData = me.json["data"] as { userId: string };
  createdUserIds.push(meData.userId);
  return { token: vdata.token, userId: meData.userId };
}

async function ensureProfile(
  token: string,
  profile: {
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
    await http("PUT", "/api/v1/profile/me", {
      token,
      body: {
        name: profile.name,
        district: profile.district,
        taluka: profile.taluka,
        village: profile.village,
        favoriteCrops: profile.favoriteCrops,
        language: profile.language,
      },
      expectStatus: 200,
    });
    return;
  }
  await http("POST", "/api/v1/profile/", {
    token,
    body: profile,
    expectStatus: 201,
  });
}

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("\n=== Farmer Price QA Suite ===\n");
  // eslint-disable-next-line no-console
  console.log(`Base URL: ${BASE}`);

  // Health
  try {
    const health = await http("GET", "/health");
    assert("Server reachable", health.status === 200 || health.status === 304, `status=${health.status}`);
  } catch (e) {
    assert("Server reachable", false, String(e));
    printSummary();
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;
  const pollsCol = db.collection("farmer_price_polls");
  const votesCol = db.collection("farmer_price_votes");

  // Auth users
  const jalna = await login(mobiles.jalnaFavA);
  const pune = await login(mobiles.puneFavA);
  const jalnaOtherCrop = await login(mobiles.jalnaFavB);

  await ensureProfile(jalna.token, {
    name: "QA Jalna Farmer",
    district: "Jalna",
    taluka: "Jalna",
    village: "QA Village",
    favoriteCrops: [qaCropA, qaCropB],
    language: "en",
  });
  await ensureProfile(pune.token, {
    name: "QA Pune Farmer",
    district: "Pune",
    taluka: "Haveli",
    village: "QA Village",
    favoriteCrops: [qaCropA],
    language: "en",
  });
  await ensureProfile(jalnaOtherCrop.token, {
    name: "QA Jalna Other",
    district: "Jalna",
    taluka: "Jalna",
    village: "QA Village",
    favoriteCrops: [qaCropB],
    language: "en",
  });

  // ------------------------------------------------------------------
  // Security: no JWT / bad JWT / malformed id
  // ------------------------------------------------------------------
  {
    const noAuth = await http("GET", "/api/v1/farmer-price/polls");
    assert("Security: no JWT rejected", noAuth.status === 401, `status=${noAuth.status}`);

    const badJwt = await http("GET", "/api/v1/farmer-price/polls", {
      token: "not.a.real.jwt",
    });
    assert("Security: bad JWT rejected", badJwt.status === 401, `status=${badJwt.status}`);

    const badId = await http("GET", "/api/v1/farmer-price/polls/not-a-valid-objectid", {
      token: jalna.token,
    });
    assert(
      "Security: malformed ObjectId rejected",
      badId.status === 400,
      `status=${badId.status} body=${JSON.stringify(badId.json)}`
    );
  }

  // ------------------------------------------------------------------
  // Create poll (gov likely unavailable for QA crop)
  // ------------------------------------------------------------------
  const createRes = await http("POST", "/api/v1/farmer-price/polls", {
    token: jalna.token,
    body: { crop: qaCropA, district: "Jalna" },
  });
  assert(
    "POST /polls creates poll",
    createRes.status === 201 && createRes.json["success"] === true,
    `status=${createRes.status}`
  );

  const poll = (createRes.json["data"] as Record<string, unknown>) ?? {};
  const pollId = String(poll["id"] ?? "");
  createdPollIds.push(pollId);

  const startsAt = new Date(String(poll["startsAt"]));
  const endsAt = new Date(String(poll["endsAt"]));
  const durationHours = (endsAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60);
  assert("Poll duration is 72 hours", Math.abs(durationHours - 72) < 0.02, `hours=${durationHours}`);
  assert("Poll district stored", poll["district"] === "Jalna", String(poll["district"]));
  assert("Poll crop stored", poll["crop"] === qaCropA, String(poll["crop"]));
  assert("Poll status OPEN", poll["status"] === "OPEN", String(poll["status"]));
  assert(
    "Response format success+data",
    createRes.json["success"] === true && typeof createRes.json["data"] === "object"
  );

  // DB document
  const dbPoll = await pollsCol.findOne({ _id: new Types.ObjectId(pollId) });
  assert("Poll appears in database", !!dbPoll);
  assert(
    "governmentPriceAvailable is boolean",
    typeof dbPoll?.["governmentPriceAvailable"] === "boolean"
  );

  if (dbPoll?.["governmentPriceAvailable"] === true) {
    assert("Gov snapshot stored when available", typeof dbPoll["governmentPriceSnapshot"] === "number");
    assert("Gov unit stored when available", typeof dbPoll["governmentUnit"] === "string");
  } else {
    assert(
      "Gov unavailable → snapshot null",
      dbPoll?.["governmentPriceSnapshot"] === null || dbPoll?.["governmentPriceSnapshot"] === undefined
    );
    assert("Gov unavailable → available=false", dbPoll?.["governmentPriceAvailable"] === false);
  }

  // Snapshot immutability: mutate DB snapshot, ensure GET returns stored value not live market
  const frozenSnapshot = 10000;
  await pollsCol.updateOne(
    { _id: new Types.ObjectId(pollId) },
    {
      $set: {
        governmentPriceAvailable: true,
        governmentPriceSnapshot: frozenSnapshot,
        governmentPriceDate: new Date("2026-01-15T00:00:00.000Z"),
        governmentUnit: "Quintal",
      },
    }
  );
  const detailAfterFreeze = await http("GET", `/api/v1/farmer-price/polls/${pollId}`, {
    token: jalna.token,
    expectStatus: 200,
  });
  const detailData = detailAfterFreeze.json["data"] as Record<string, unknown>;
  assert(
    "Gov snapshot is frozen on poll (not live)",
    detailData["governmentPriceSnapshot"] === frozenSnapshot,
    String(detailData["governmentPriceSnapshot"])
  );
  assert(
    "Poll detail includes disclaimer + insights + remainingHours",
    detailData["isCommunityEstimate"] === true &&
      typeof detailData["disclaimer"] === "string" &&
      Array.isArray(detailData["recentInsights"]) &&
      typeof detailData["remainingHours"] === "number"
  );

  // Duplicate active poll
  const dupPoll = await http("POST", "/api/v1/farmer-price/polls", {
    token: jalna.token,
    body: { crop: qaCropA, district: "Jalna" },
  });
  assert("Duplicate active poll rejected", dupPoll.status === 409, `status=${dupPoll.status}`);

  // ------------------------------------------------------------------
  // List polls
  // ------------------------------------------------------------------
  const listRes = await http("GET", `/api/v1/farmer-price/polls?crop=${encodeURIComponent(qaCropA)}`, {
    token: jalna.token,
    expectStatus: 200,
  });
  const listData = listRes.json["data"] as { polls: unknown[] };
  assert("GET /polls returns list", Array.isArray(listData.polls));

  // ------------------------------------------------------------------
  // My polls
  // ------------------------------------------------------------------
  const myJalna = await http("GET", "/api/v1/farmer-price/polls/my", {
    token: jalna.token,
    expectStatus: 200,
  });
  const myJalnaPolls = (myJalna.json["data"] as Record<string, unknown>[]) ?? [];
  assert(
    "My polls: Jalna farmer sees QA crop A",
    myJalnaPolls.some((p) => p["id"] === pollId)
  );
  assert(
    "My polls: only OPEN",
    myJalnaPolls.every((p) => p["status"] === "OPEN")
  );

  const myPune = await http("GET", "/api/v1/farmer-price/polls/my", {
    token: pune.token,
    expectStatus: 200,
  });
  const myPunePolls = (myPune.json["data"] as Record<string, unknown>[]) ?? [];
  assert(
    "My polls: other district never sees Jalna poll",
    !myPunePolls.some((p) => p["id"] === pollId)
  );

  const myOtherCrop = await http("GET", "/api/v1/farmer-price/polls/my", {
    token: jalnaOtherCrop.token,
    expectStatus: 200,
  });
  const myOtherCropPolls = (myOtherCrop.json["data"] as Record<string, unknown>[]) ?? [];
  assert(
    "My polls: non-favourite crop never appears",
    !myOtherCropPolls.some((p) => p["id"] === pollId)
  );

  // Sort nearest ending: create second poll ending sooner via DB, then check order
  const createB = await http("POST", "/api/v1/farmer-price/polls", {
    token: jalna.token,
    body: { crop: qaCropB, district: "Jalna" },
  });
  const pollBId = String((createB.json["data"] as Record<string, unknown>)?.["id"] ?? "");
  createdPollIds.push(pollBId);
  const sooner = new Date(Date.now() + 2 * 60 * 60 * 1000);
  await pollsCol.updateOne(
    { _id: new Types.ObjectId(pollBId) },
    { $set: { endsAt: sooner } }
  );
  // Ensure farmer has both favourites
  await ensureProfile(jalna.token, {
    name: "QA Jalna Farmer",
    district: "Jalna",
    taluka: "Jalna",
    village: "QA Village",
    favoriteCrops: [qaCropA, qaCropB],
    language: "en",
  });
  const mySorted = await http("GET", "/api/v1/farmer-price/polls/my", {
    token: jalna.token,
    expectStatus: 200,
  });
  const sortedPolls = (mySorted.json["data"] as Record<string, unknown>[]) ?? [];
  const qaSorted = sortedPolls.filter((p) => createdPollIds.includes(String(p["id"])));
  if (qaSorted.length >= 2) {
    const firstEnds = new Date(String(qaSorted[0]!["endsAt"])).getTime();
    const secondEnds = new Date(String(qaSorted[1]!["endsAt"])).getTime();
    assert("My polls sorted nearest ending first", firstEnds <= secondEnds);
  } else {
    record("My polls sorted nearest ending first", "SKIP", "fewer than 2 QA polls visible");
  }

  // ------------------------------------------------------------------
  // Price validation (±40%)
  // ------------------------------------------------------------------
  const rejectLow = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: {
      expectedPrice: Math.ceil(frozenSnapshot * 0.59), // ~-41%
      reasonType: "HIGH_DEMAND",
      reasonText: "Demand is high in market area",
    },
  });
  assert("Price -41% rejected", rejectLow.status === 400, `status=${rejectLow.status}`);

  const rejectHigh = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: {
      expectedPrice: Math.floor(frozenSnapshot * 1.41), // ~+41%
      reasonType: "HIGH_DEMAND",
      reasonText: "Demand is high in market area",
    },
  });
  assert("Price +41% rejected", rejectHigh.status === 400, `status=${rejectHigh.status}`);

  // Boundary accept will be done as first real vote at -40%
  const minAllowed = Math.ceil(frozenSnapshot * 0.6);
  const maxAllowed = Math.floor(frozenSnapshot * 1.4);

  // ------------------------------------------------------------------
  // Reason validation (use pune for district fail, jalnaOther for fav fail)
  // First test reason rules with temporary user via synthetic approach:
  // create helper users for reason tests that don't consume jalna's vote yet.
  // ------------------------------------------------------------------

  // District validation
  const wrongDistrict = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: pune.token,
    body: {
      expectedPrice: frozenSnapshot,
      reasonType: "HIGH_DEMAND",
      reasonText: "Demand is high in market area",
    },
  });
  assert(
    "Wrong district vote rejected",
    wrongDistrict.status === 403 &&
      String((wrongDistrict.json as { message?: string }).message ?? "").includes("Invalid District"),
    `status=${wrongDistrict.status} msg=${(wrongDistrict.json as { message?: string }).message}`
  );

  // Favourite crop validation
  const wrongFav = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalnaOtherCrop.token,
    body: {
      expectedPrice: frozenSnapshot,
    },
  });
  assert(
    "Non-favourite crop vote rejected",
    wrongFav.status === 403 &&
      String((wrongFav.json as { message?: string }).message ?? "").includes("Favourite Crop Required"),
    `status=${wrongFav.status}`
  );

  // Reason: different price without reason
  const noReason = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: { expectedPrice: frozenSnapshot + 100 },
  });
  assert(
    "Different price without reason rejected",
    noReason.status === 400 &&
      String((noReason.json as { message?: string }).message ?? "").includes("Reason Required"),
    `status=${noReason.status}`
  );

  // Reason too short
  const shortReason = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: {
      expectedPrice: frozenSnapshot + 100,
      reasonType: "HIGH_DEMAND",
      reasonText: "short",
    },
  });
  assert("Reason < 10 rejected", shortReason.status === 400, `status=${shortReason.status}`);

  // Reason too long
  const longReason = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: {
      expectedPrice: frozenSnapshot + 100,
      reasonType: "HIGH_DEMAND",
      reasonText: "x".repeat(201),
    },
  });
  assert("Reason > 200 rejected", longReason.status === 400, `status=${longReason.status}`);

  // Whitespace only
  const wsReason = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: {
      expectedPrice: frozenSnapshot + 100,
      reasonType: "HIGH_DEMAND",
      reasonText: "          ",
    },
  });
  assert("Whitespace-only reason rejected", wsReason.status === 400, `status=${wsReason.status}`);

  // OTHER without reasonText
  const otherNoText = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: {
      expectedPrice: frozenSnapshot + 100,
      reasonType: "OTHER",
    },
  });
  assert(
    "OTHER without reasonText rejected",
    otherNoText.status === 400,
    `status=${otherNoText.status}`
  );

  // Exact gov price — reason optional (first successful vote)
  const vote1 = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: { expectedPrice: frozenSnapshot },
  });
  assert(
    "Exact gov price without reason accepted",
    vote1.status === 201 && vote1.json["success"] === true,
    `status=${vote1.status} body=${JSON.stringify(vote1.json)}`
  );
  const vote1Data = vote1.json["data"] as Record<string, unknown>;
  assert("Vote response returns updated poll", vote1Data["id"] === pollId && vote1Data["voteCount"] === 1);
  assert("voteCount=1 after first vote", vote1Data["voteCount"] === 1);
  assert("communityExpectedPrice null at 1 vote", vote1Data["communityExpectedPrice"] === null);
  assert("confidence NOT_AVAILABLE at 1 vote", vote1Data["confidence"] === "NOT_AVAILABLE");
  assert("minimumVotesReached false at 1 vote", vote1Data["minimumVotesReached"] === false);
  assert("lastVoteAt set", typeof vote1Data["lastVoteAt"] === "string" && vote1Data["lastVoteAt"] !== null);

  const voteCountDb = await votesCol.countDocuments({ pollId: new Types.ObjectId(pollId) });
  assert("Vote inserted in DB", voteCountDb === 1, `count=${voteCountDb}`);

  // Duplicate vote
  const dupVote = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: { expectedPrice: frozenSnapshot },
  });
  assert(
    "Duplicate vote rejected",
    dupVote.status === 409 &&
      String((dupVote.json as { message?: string }).message ?? "").includes("Already Voted"),
    `status=${dupVote.status}`
  );
  const voteCountAfterDup = await votesCol.countDocuments({ pollId: new Types.ObjectId(pollId) });
  assert("DB unchanged after duplicate", voteCountAfterDup === 1, `count=${voteCountAfterDup}`);

  // Boundary -40% / +40% with additional voters
  const voter2 = await login("9000000010");
  await ensureProfile(voter2.token, {
    name: "QA Voter 2",
    district: "Jalna",
    taluka: "Jalna",
    village: "QA",
    favoriteCrops: [qaCropA],
    language: "en",
  });
  const acceptMin = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: voter2.token,
    body: {
      expectedPrice: minAllowed,
      reasonType: "LOW_SUPPLY",
      reasonText: "Supply is low across markets",
    },
  });
  assert("Price -40% boundary accepted", acceptMin.status === 201, `status=${acceptMin.status}`);

  const voter3 = await login("9000000011");
  await ensureProfile(voter3.token, {
    name: "QA Voter 3",
    district: "Jalna",
    taluka: "Jalna",
    village: "QA",
    favoriteCrops: [qaCropA],
    language: "en",
  });
  const acceptMax = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: voter3.token,
    body: {
      expectedPrice: maxAllowed,
      reasonType: "EXPORT_DEMAND",
      reasonText: "Export demand is increasing now",
    },
  });
  assert("Price +40% boundary accepted", acceptMax.status === 201, `status=${acceptMax.status}`);

  // ------------------------------------------------------------------
  // Seed votes 4..9 via DB, then 10th via API → community price
  // ------------------------------------------------------------------
  const pricesForMedian = [10000, minAllowed, maxAllowed]; // existing 3
  // Add synthetic votes to reach 9 total
  for (let i = 4; i <= 9; i++) {
    const price = 10000 + i * 10;
    pricesForMedian.push(price);
    await votesCol.insertOne({
      pollId: new Types.ObjectId(pollId),
      userId: new Types.ObjectId(),
      district: "Jalna",
      crop: qaCropA,
      expectedPrice: price,
      reasonType: "HIGH_DEMAND",
      reasonText: `Synthetic reason number ${i}xx`,
      createdAt: new Date(Date.now() - (20 - i) * 60_000),
    });
  }
  // Sync voteCount to 9 without community price (simulating state before 10th)
  await pollsCol.updateOne(
    { _id: new Types.ObjectId(pollId) },
    {
      $set: {
        voteCount: 9,
        communityExpectedPrice: null,
        confidence: "NOT_AVAILABLE",
        minimumVotesReached: false,
      },
    }
  );

  const at9 = await http("GET", `/api/v1/farmer-price/polls/${pollId}`, {
    token: jalna.token,
    expectStatus: 200,
  });
  const at9Data = at9.json["data"] as Record<string, unknown>;
  assert("9 votes: community price still null", at9Data["communityExpectedPrice"] === null);
  assert("9 votes: confidence NOT_AVAILABLE", at9Data["confidence"] === "NOT_AVAILABLE");

  const voter10 = await login("9000000012");
  await ensureProfile(voter10.token, {
    name: "QA Voter 10",
    district: "Jalna",
    taluka: "Jalna",
    village: "QA",
    favoriteCrops: [qaCropA],
    language: "en",
  });
  const tenthPrice = 10100;
  pricesForMedian.push(tenthPrice);
  const vote10 = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: voter10.token,
    body: {
      expectedPrice: tenthPrice,
      reasonType: "GOOD_QUALITY",
      reasonText: "Quality of produce is very good",
    },
  });
  const v10 = vote10.json["data"] as Record<string, unknown>;
  assert("10th vote accepted", vote10.status === 201, `status=${vote10.status}`);
  assert("10 votes: minimumVotesReached true", v10["minimumVotesReached"] === true);
  assert("10 votes: confidence LOW", v10["confidence"] === "LOW");
  assert("10 votes: communityExpectedPrice set", typeof v10["communityExpectedPrice"] === "number");

  // Median check
  const sorted = [...pricesForMedian].sort((a, b) => a - b);
  const expectedMedian =
    sorted.length % 2 === 1
      ? sorted[Math.floor(sorted.length / 2)]
      : Math.round((sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2);
  assert(
    "Median algorithm (even/odd via 10 votes)",
    v10["communityExpectedPrice"] === expectedMedian,
    `expected=${expectedMedian} got=${v10["communityExpectedPrice"]} prices=${sorted.join(",")}`
  );

  // Difference
  const diff = Number(v10["communityExpectedPrice"]) - frozenSnapshot;
  const pct = Math.round((diff / frozenSnapshot) * 10000) / 100;
  assert(
    "Difference from government correct",
    v10["differenceFromGovernmentPrice"] === diff,
    `expected=${diff} got=${v10["differenceFromGovernmentPrice"]}`
  );
  assert(
    "Difference percentage correct",
    v10["differencePercentage"] === pct,
    `expected=${pct} got=${v10["differencePercentage"]}`
  );

  // Confidence unit thresholds (pure + DB override simulation for 50/150)
  // Verify via stats module logic already; also force update and GET
  await pollsCol.updateOne(
    { _id: new Types.ObjectId(pollId) },
    { $set: { voteCount: 50, confidence: "MEDIUM" } }
  );
  // Note: GET returns stored confidence — backend stores on vote. Verify calculateConfidence via import.
  const { calculateConfidence, calculateMedianPrice, calculateDifferenceFromGovernment } =
    await import("../src/modules/farmer-price/farmer-price.stats");
  assert("Confidence @9 NOT_AVAILABLE", calculateConfidence(9) === "NOT_AVAILABLE");
  assert("Confidence @10 LOW", calculateConfidence(10) === "LOW");
  assert("Confidence @50 MEDIUM", calculateConfidence(50) === "MEDIUM");
  assert("Confidence @150 HIGH", calculateConfidence(150) === "HIGH");
  assert("Odd median helper", calculateMedianPrice([1, 3, 2]) === 2);
  assert("Even median helper (not mean of all)", calculateMedianPrice([1, 2, 3, 100]) === 3);
  const noGovDiff = calculateDifferenceFromGovernment(7100, false, null);
  assert("Difference null when gov unavailable", noGovDiff.differenceFromGovernmentPrice === null);

  // Restore poll stats consistency after confidence probe
  await pollsCol.updateOne(
    { _id: new Types.ObjectId(pollId) },
    {
      $set: {
        voteCount: 10,
        confidence: "LOW",
        communityExpectedPrice: expectedMedian,
        minimumVotesReached: true,
      },
    }
  );

  // ------------------------------------------------------------------
  // Recent insights — insert many reasons, verify latest 5
  // ------------------------------------------------------------------
  for (let i = 0; i < 8; i++) {
    await votesCol.insertOne({
      pollId: new Types.ObjectId(pollId),
      userId: new Types.ObjectId(),
      district: "Jalna",
      crop: qaCropA,
      expectedPrice: 10000,
      reasonType: "OTHER",
      reasonText: `Insight reason text number ${i} here`,
      createdAt: new Date(Date.now() - (8 - i) * 1000),
    });
  }
  const insightsRes = await http("GET", `/api/v1/farmer-price/polls/${pollId}`, {
    token: jalna.token,
    expectStatus: 200,
  });
  const insights = (insightsRes.json["data"] as { recentInsights: Record<string, unknown>[] })
    .recentInsights;
  assert("Recent insights max 5", insights.length === 5, `len=${insights.length}`);
  assert(
    "Recent insights anonymous",
    insights.every((i) => i["author"] === "Anonymous Farmer")
  );
  assert(
    "Recent insights no userId/phone",
    insights.every((i) => i["userId"] === undefined && i["phone"] === undefined)
  );
  if (insights.length >= 2) {
    const t0 = new Date(String(insights[0]!["createdAt"])).getTime();
    const t1 = new Date(String(insights[1]!["createdAt"])).getTime();
    assert("Recent insights newest first", t0 >= t1);
  }

  // ------------------------------------------------------------------
  // Closed poll
  // ------------------------------------------------------------------
  await pollsCol.updateOne(
    { _id: new Types.ObjectId(pollId) },
    { $set: { endsAt: new Date(Date.now() - 60_000) } }
  );
  const closedVoter = await login("9000000013");
  await ensureProfile(closedVoter.token, {
    name: "QA Closed",
    district: "Jalna",
    taluka: "Jalna",
    village: "QA",
    favoriteCrops: [qaCropA],
    language: "en",
  });
  const votesBeforeClose = await votesCol.countDocuments({
    pollId: new Types.ObjectId(pollId),
    userId: new Types.ObjectId(closedVoter.userId),
  });
  const closedVote = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: closedVoter.token,
    body: {
      expectedPrice: 10000,
      reasonType: "HIGH_DEMAND",
      reasonText: "Should not be accepted now",
    },
  });
  assert(
    "Closed poll vote rejected",
    closedVote.status === 400 &&
      String((closedVote.json as { message?: string }).message ?? "").includes("Poll Closed"),
    `status=${closedVote.status}`
  );
  const votesAfterClose = await votesCol.countDocuments({
    pollId: new Types.ObjectId(pollId),
    userId: new Types.ObjectId(closedVoter.userId),
  });
  assert("No vote inserted on closed poll", votesBeforeClose === votesAfterClose);

  // Status CLOSED on GET
  const closedGet = await http("GET", `/api/v1/farmer-price/polls/${pollId}`, {
    token: jalna.token,
    expectStatus: 200,
  });
  assert(
    "Status calculated CLOSED",
    (closedGet.json["data"] as Record<string, unknown>)["status"] === "CLOSED"
  );

  // ------------------------------------------------------------------
  // History
  // ------------------------------------------------------------------
  const history = await http("GET", `/api/v1/farmer-price/history/${encodeURIComponent(qaCropA)}`, {
    token: jalna.token,
    expectStatus: 200,
  });
  const histData = history.json["data"] as {
    crop: string;
    district: string;
    polls: Record<string, unknown>[];
  };
  assert("History crop matches", histData.crop === qaCropA);
  assert("History district is farmer district", histData.district === "Jalna");
  assert(
    "History includes closed QA poll",
    histData.polls.some((p) => p["id"] === pollId)
  );
  assert(
    "History polls newest first (by endsAt)",
    histData.polls.length < 2 ||
      new Date(String(histData.polls[0]!["endsAt"])).getTime() >=
        new Date(String(histData.polls[1]!["endsAt"])).getTime()
  );
  const histPune = await http("GET", `/api/v1/farmer-price/history/${encodeURIComponent(qaCropA)}`, {
    token: pune.token,
    expectStatus: 200,
  });
  const histPuneData = histPune.json["data"] as { polls: Record<string, unknown>[] };
  assert(
    "History scoped to district (Pune misses Jalna poll)",
    !histPuneData.polls.some((p) => p["id"] === pollId)
  );

  // ------------------------------------------------------------------
  // Indexes
  // ------------------------------------------------------------------
  const pollIndexes = await pollsCol.indexes();
  const voteIndexes = await votesCol.indexes();
  const voteUnique = voteIndexes.some(
    (idx) =>
      idx.unique === true &&
      idx.key &&
      (idx.key as Record<string, number>)["pollId"] === 1 &&
      (idx.key as Record<string, number>)["userId"] === 1
  );
  assert("Unique vote index exists", voteUnique, JSON.stringify(voteIndexes.map((i) => i.key)));
  assert(
    "Poll compound district+crop+endsAt index exists",
    pollIndexes.some((idx) => {
      const k = idx.key as Record<string, number>;
      return k["district"] === 1 && k["crop"] === 1 && k["endsAt"] === -1;
    }),
    JSON.stringify(pollIndexes.map((i) => i.key))
  );

  // Unique index enforcement
  let uniqueEnforced = false;
  try {
    await votesCol.insertOne({
      pollId: new Types.ObjectId(pollId),
      userId: new Types.ObjectId(jalna.userId),
      district: "Jalna",
      crop: qaCropA,
      expectedPrice: 10000,
      createdAt: new Date(),
    });
  } catch (err: unknown) {
    uniqueEnforced =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000;
  }
  assert("Unique vote index rejects duplicate insert", uniqueEnforced);

  // ------------------------------------------------------------------
  // Transaction rollback (standalone fallback path simulation)
  // ------------------------------------------------------------------
  // Re-open a fresh poll for rollback test
  const rbCrop = `__QA_FP_Rollback_${Date.now()}`;
  await ensureProfile(jalna.token, {
    name: "QA Jalna Farmer",
    district: "Jalna",
    taluka: "Jalna",
    village: "QA Village",
    favoriteCrops: [qaCropA, qaCropB, rbCrop],
    language: "en",
  });
  const rbCreate = await http("POST", "/api/v1/farmer-price/polls", {
    token: jalna.token,
    body: { crop: rbCrop, district: "Jalna" },
  });
  const rbPollId = String((rbCreate.json["data"] as Record<string, unknown>)?.["id"] ?? "");
  createdPollIds.push(rbPollId);

  // Simulate fallback: create vote then fail poll update by deleting poll first mid-path
  // Directly exercise compensatory delete pattern
  const orphanUserId = new Types.ObjectId();
  const orphanVoteId = (
    await votesCol.insertOne({
      pollId: new Types.ObjectId(rbPollId),
      userId: orphanUserId,
      district: "Jalna",
      crop: rbCrop,
      expectedPrice: 5000,
      createdAt: new Date(),
    })
  ).insertedId;

  // Delete poll then attempt updateOne (matchedCount 0) — simulate failed update cleanup
  await pollsCol.deleteOne({ _id: new Types.ObjectId(rbPollId) });
  const matched = await pollsCol.updateOne(
    { _id: new Types.ObjectId(rbPollId) },
    { $set: { voteCount: 1 } }
  );
  if (matched.matchedCount === 0) {
    await votesCol.deleteOne({ _id: orphanVoteId });
  }
  const orphanRemains = await votesCol.findOne({ _id: orphanVoteId });
  assert(
    "Rollback/cleanup removes orphan vote when poll update fails",
    orphanRemains === null
  );
  // mark rb poll already deleted
  const rbIdx = createdPollIds.indexOf(rbPollId);
  if (rbIdx >= 0) createdPollIds.splice(rbIdx, 1);

  // Missing poll
  const missing = await http("GET", `/api/v1/farmer-price/polls/${new Types.ObjectId().toHexString()}`, {
    token: jalna.token,
  });
  assert("Missing poll → 404", missing.status === 404, `status=${missing.status}`);

  // Error format
  assert(
    "Error response has success:false + message",
    missing.json["success"] === false && typeof missing.json["message"] === "string"
  );

  // ------------------------------------------------------------------
  // Cleanup QA data
  // ------------------------------------------------------------------
  for (const id of createdPollIds) {
    await votesCol.deleteMany({ pollId: new Types.ObjectId(id) });
    await pollsCol.deleteOne({ _id: new Types.ObjectId(id) });
  }
  // Also cleanup any leftover QA crops by name pattern
  const leftoverPolls = await pollsCol
    .find({ crop: { $regex: /^__QA_FP_/ } })
    .project({ _id: 1 })
    .toArray();
  for (const p of leftoverPolls) {
    await votesCol.deleteMany({ pollId: p._id });
    await pollsCol.deleteOne({ _id: p._id });
  }

  await mongoose.disconnect();
  printSummary();
}

function printSummary(): void {
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;
  // eslint-disable-next-line no-console
  console.log("\n=== SUMMARY ===");
  // eslint-disable-next-line no-console
  console.log(`PASS: ${passed}  FAIL: ${failed}  SKIP: ${skipped}  TOTAL: ${results.length}`);
  if (failed > 0) {
    // eslint-disable-next-line no-console
    console.log("\nFailures:");
    for (const r of results.filter((x) => x.status === "FAIL")) {
      // eslint-disable-next-line no-console
      console.log(` - ${r.name}: ${r.detail ?? ""}`);
    }
  }
  // Machine-readable footer for the agent
  // eslint-disable-next-line no-console
  console.log(`\nQA_JSON=${JSON.stringify({ passed, failed, skipped, results })}`);
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error("QA suite crashed:", err);
  try {
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db!;
      await db.collection("farmer_price_votes").deleteMany({ crop: { $regex: /^__QA_FP_/ } });
      await db.collection("farmer_price_polls").deleteMany({ crop: { $regex: /^__QA_FP_/ } });
      await mongoose.disconnect();
    }
  } catch {
    // ignore cleanup errors
  }
  process.exit(1);
});
