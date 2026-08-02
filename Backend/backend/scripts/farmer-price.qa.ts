/**
 * Farmer Price — Production validation QA suite
 * Uses real Crop Master names + LGD location codes. Cleans up QA data on exit.
 */
import mongoose, { Types } from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const BASE = process.env.QA_BASE_URL ?? "http://127.0.0.1:4000";
const MONGODB_URI = process.env.MONGODB_URI!;

/** Real Agmarknet commodities (Crop Master). Obscure enough for safe cleanup. */
const CROP_A = "Ajwan";
const CROP_B = "Alasande Gram";
const STRESS_CROP = "Absinthe";

type Result = { name: string; status: "PASS" | "FAIL" | "SKIP"; detail?: string };

const results: Result[] = [];
const mobiles = {
  jalnaFavA: "9000000001",
  puneFavA: "9000000002",
  jalnaFavB: "9000000003",
};

const createdPollIds: string[] = [];
const createdUserIds: string[] = [];

const LOC = {
  jalna: {
    district: "Jalna",
    districtCode: 479,
    taluka: "Ambad",
    talukaCode: 4129,
    village: "Alamgaon",
    villageCode: 547792,
  },
  pune: {
    district: "Pune",
    districtCode: 490,
    taluka: "Ambegaon",
    talukaCode: 4188,
    village: "Adivare",
    villageCode: 555422,
  },
} as const;

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
    location: (typeof LOC)["jalna"] | (typeof LOC)["pune"];
    favoriteCrops: string[];
    language: string;
  }
): Promise<void> {
  const body = {
    name: profile.name,
    district: profile.location.district,
    districtCode: profile.location.districtCode,
    taluka: profile.location.taluka,
    talukaCode: profile.location.talukaCode,
    village: profile.location.village,
    villageCode: profile.location.villageCode,
    favoriteCrops: profile.favoriteCrops,
    language: profile.language,
  };
  const existing = await http("GET", "/api/v1/profile/me", { token });
  if (existing.status === 200) {
    await http("PUT", "/api/v1/profile/me", {
      token,
      body,
      expectStatus: 200,
    });
    return;
  }
  await http("POST", "/api/v1/profile/", {
    token,
    body,
    expectStatus: 201,
  });
}

async function clearPair(
  pollsCol: mongoose.mongo.Collection,
  votesCol: mongoose.mongo.Collection,
  slotsCol: mongoose.mongo.Collection,
  district: string,
  crop: string
): Promise<void> {
  const open = await pollsCol
    .find({ district, crop, endsAt: { $gt: new Date() } })
    .project({ _id: 1 })
    .toArray();
  for (const p of open) {
    await votesCol.deleteMany({ pollId: p._id });
    await pollsCol.deleteOne({ _id: p._id });
  }
  await slotsCol.deleteOne({ district, crop });
}

async function createOrGetPoll(
  token: string,
  crop: string,
  district: string
): Promise<{ pollId: string; created: boolean; poll: Record<string, unknown> }> {
  const createRes = await http("POST", "/api/v1/farmer-price/polls", {
    token,
    body: { crop, district },
  });
  if (createRes.status === 201) {
    const poll = (createRes.json["data"] as Record<string, unknown>) ?? {};
    const pollId = String(poll["id"] ?? "");
    createdPollIds.push(pollId);
    return { pollId, created: true, poll };
  }
  if (createRes.status === 409) {
    const my = await http("GET", "/api/v1/farmer-price/polls/my", {
      token,
      expectStatus: 200,
    });
    const polls = (my.json["data"] as Record<string, unknown>[]) ?? [];
    const match = polls.find((p) => p["crop"] === crop && p["district"] === district);
    if (!match) {
      throw new Error(`409 on create but no open ${district}+${crop} in /polls/my`);
    }
    return {
      pollId: String(match["id"]),
      created: false,
      poll: match,
    };
  }
  throw new Error(`POST /polls unexpected status ${createRes.status}: ${JSON.stringify(createRes.json)}`);
}

async function runConcurrentEnsure(
  name: string,
  concurrency: number,
  crop: string,
  district: string,
  location: (typeof LOC)["jalna"],
  pollsCol: mongoose.mongo.Collection,
  votesCol: mongoose.mongo.Collection,
  slotsCol: mongoose.mongo.Collection
): Promise<void> {
  await clearPair(pollsCol, votesCol, slotsCol, district, crop);

  const tokens: string[] = [];
  for (let i = 0; i < concurrency; i++) {
    const mobile = `901${String(concurrency).padStart(2, "0")}${String(i).padStart(5, "0")}`;
    const user = await login(mobile);
    await ensureProfile(user.token, {
      name: `QA Concurrent ${i}`,
      location,
      favoriteCrops: [crop],
      language: "en",
    });
    tokens.push(user.token);
  }

  const responses = await Promise.all(
    tokens.map((token) => http("GET", "/api/v1/farmer-price/polls/my", { token }))
  );

  const ok = responses.every((r) => r.status === 200);
  assert(`${name}: all HTTP 200`, ok, `statuses=${responses.map((r) => r.status).join(",")}`);

  const pollIds = responses.map((r) => {
    const polls = (r.json["data"] as Record<string, unknown>[]) ?? [];
    const match = polls.find((p) => p["crop"] === crop && p["district"] === district);
    return match ? String(match["id"]) : "";
  });

  const emptyCount = pollIds.filter((id) => !id).length;
  assert(
    `${name}: no empty poll lists`,
    emptyCount === 0,
    `empty=${emptyCount}/${concurrency}`
  );

  const unique = new Set(pollIds.filter(Boolean));
  assert(
    `${name}: all callers see same poll`,
    unique.size === 1,
    `unique=${unique.size} ids=${[...unique].join(",")}`
  );

  const dbOpen = await pollsCol
    .find({ district, crop, endsAt: { $gt: new Date() } })
    .project({ _id: 1 })
    .toArray();
  assert(
    `${name}: exactly one DB poll`,
    dbOpen.length === 1,
    `count=${dbOpen.length}`
  );

  if (dbOpen[0]) {
    createdPollIds.push(String(dbOpen[0]._id));
  }
}

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("\n=== Farmer Price QA Suite ===\n");
  // eslint-disable-next-line no-console
  console.log(`Base URL: ${BASE}`);
  // eslint-disable-next-line no-console
  console.log(`Crops: ${CROP_A}, ${CROP_B}, stress=${STRESS_CROP}`);

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
  const slotsCol = db.collection("farmer_price_open_slots");

  // Isolate QA crops so POST create and ensure paths are deterministic.
  await clearPair(pollsCol, votesCol, slotsCol, "Jalna", CROP_A);
  await clearPair(pollsCol, votesCol, slotsCol, "Jalna", CROP_B);
  await clearPair(pollsCol, votesCol, slotsCol, "Jalna", STRESS_CROP);
  await clearPair(pollsCol, votesCol, slotsCol, "Pune", CROP_A);

  const jalna = await login(mobiles.jalnaFavA);
  const pune = await login(mobiles.puneFavA);
  const jalnaOtherCrop = await login(mobiles.jalnaFavB);

  await ensureProfile(jalna.token, {
    name: "QA Jalna Farmer",
    location: LOC.jalna,
    favoriteCrops: [CROP_A, CROP_B],
    language: "en",
  });
  await ensureProfile(pune.token, {
    name: "QA Pune Farmer",
    location: LOC.pune,
    favoriteCrops: [CROP_A],
    language: "en",
  });
  await ensureProfile(jalnaOtherCrop.token, {
    name: "QA Jalna Other",
    location: LOC.jalna,
    favoriteCrops: [CROP_B],
    language: "en",
  });

  // ------------------------------------------------------------------
  // Security
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
      `status=${badId.status}`
    );
  }

  // ------------------------------------------------------------------
  // POST /polls still exists (used by sync/ensure + authenticated create)
  // ------------------------------------------------------------------
  const createRes = await http("POST", "/api/v1/farmer-price/polls", {
    token: jalna.token,
    body: { crop: CROP_A, district: "Jalna" },
  });
  assert(
    "POST /polls exists and creates poll",
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
  assert("Poll crop stored", poll["crop"] === CROP_A, String(poll["crop"]));
  assert("Poll status OPEN", poll["status"] === "OPEN", String(poll["status"]));
  assert(
    "Response format success+data",
    createRes.json["success"] === true && typeof createRes.json["data"] === "object"
  );

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

  // Cross-district read is currently allowed (JWT only) — document behaviour.
  const crossRead = await http("GET", `/api/v1/farmer-price/polls/${pollId}`, {
    token: pune.token,
  });
  assert(
    "GET /polls/:pollId readable by any authenticated farmer",
    crossRead.status === 200,
    `status=${crossRead.status}`
  );

  const dupPoll = await http("POST", "/api/v1/farmer-price/polls", {
    token: jalna.token,
    body: { crop: CROP_A, district: "Jalna" },
  });
  assert("Duplicate active poll rejected", dupPoll.status === 409, `status=${dupPoll.status}`);

  // ------------------------------------------------------------------
  // List / My polls
  // ------------------------------------------------------------------
  const listRes = await http("GET", `/api/v1/farmer-price/polls?crop=${encodeURIComponent(CROP_A)}`, {
    token: jalna.token,
    expectStatus: 200,
  });
  const listData = listRes.json["data"] as { polls: unknown[] };
  assert("GET /polls returns list", Array.isArray(listData.polls));

  const myJalna = await http("GET", "/api/v1/farmer-price/polls/my", {
    token: jalna.token,
    expectStatus: 200,
  });
  const myJalnaPolls = (myJalna.json["data"] as Record<string, unknown>[]) ?? [];
  assert(
    "My polls: Jalna farmer sees crop A",
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

  const { pollId: pollBId } = await createOrGetPoll(jalna.token, CROP_B, "Jalna");
  const sooner = new Date(Date.now() + 2 * 60 * 60 * 1000);
  await pollsCol.updateOne(
    { _id: new Types.ObjectId(pollBId) },
    { $set: { endsAt: sooner } }
  );
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
  // Price / reason / eligibility validation
  // ------------------------------------------------------------------
  const rejectLow = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: {
      expectedPrice: Math.ceil(frozenSnapshot * 0.59),
      reasonType: "HIGH_DEMAND",
      reasonText: "Demand is high in market area",
    },
  });
  assert("Price -41% rejected", rejectLow.status === 400, `status=${rejectLow.status}`);

  const rejectHigh = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: {
      expectedPrice: Math.floor(frozenSnapshot * 1.41),
      reasonType: "HIGH_DEMAND",
      reasonText: "Demand is high in market area",
    },
  });
  assert("Price +41% rejected", rejectHigh.status === 400, `status=${rejectHigh.status}`);

  const minAllowed = Math.ceil(frozenSnapshot * 0.6);
  const maxAllowed = Math.floor(frozenSnapshot * 1.4);

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
    `status=${wrongDistrict.status}`
  );

  const wrongFav = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalnaOtherCrop.token,
    body: { expectedPrice: frozenSnapshot },
  });
  assert(
    "Non-favourite crop vote rejected",
    wrongFav.status === 403 &&
      String((wrongFav.json as { message?: string }).message ?? "").includes("Favourite Crop Required"),
    `status=${wrongFav.status}`
  );

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

  const shortReason = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: {
      expectedPrice: frozenSnapshot + 100,
      reasonType: "HIGH_DEMAND",
      reasonText: "short",
    },
  });
  assert("Reason < 10 rejected", shortReason.status === 400, `status=${shortReason.status}`);

  const longReason = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: {
      expectedPrice: frozenSnapshot + 100,
      reasonType: "HIGH_DEMAND",
      reasonText: "x".repeat(201),
    },
  });
  assert("Reason > 200 rejected", longReason.status === 400, `status=${longReason.status}`);

  const wsReason = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: {
      expectedPrice: frozenSnapshot + 100,
      reasonType: "HIGH_DEMAND",
      reasonText: "          ",
    },
  });
  assert("Whitespace-only reason rejected", wsReason.status === 400, `status=${wsReason.status}`);

  const otherNoText = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: {
      expectedPrice: frozenSnapshot + 100,
      reasonType: "OTHER",
    },
  });
  assert("OTHER without reasonText rejected", otherNoText.status === 400, `status=${otherNoText.status}`);

  const vote1 = await http("POST", `/api/v1/farmer-price/polls/${pollId}/vote`, {
    token: jalna.token,
    body: { expectedPrice: frozenSnapshot },
  });
  assert(
    "Exact gov price without reason accepted",
    vote1.status === 201 && vote1.json["success"] === true,
    `status=${vote1.status}`
  );
  const vote1Data = vote1.json["data"] as Record<string, unknown>;
  assert("Vote response returns updated poll", vote1Data["id"] === pollId && vote1Data["voteCount"] === 1);
  assert("communityExpectedPrice null at 1 vote", vote1Data["communityExpectedPrice"] === null);
  assert("confidence NOT_AVAILABLE at 1 vote", vote1Data["confidence"] === "NOT_AVAILABLE");
  assert("minimumVotesReached false at 1 vote", vote1Data["minimumVotesReached"] === false);
  assert("lastVoteAt set", typeof vote1Data["lastVoteAt"] === "string" && vote1Data["lastVoteAt"] !== null);

  const voteCountDb = await votesCol.countDocuments({ pollId: new Types.ObjectId(pollId) });
  assert("Vote inserted in DB", voteCountDb === 1, `count=${voteCountDb}`);

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

  const voter2 = await login("9000000010");
  await ensureProfile(voter2.token, {
    name: "QA Voter 2",
    location: LOC.jalna,
    favoriteCrops: [CROP_A],
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
    location: LOC.jalna,
    favoriteCrops: [CROP_A],
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
  // Median / confidence at 10 votes
  // ------------------------------------------------------------------
  const pricesForMedian = [10000, minAllowed, maxAllowed];
  for (let i = 4; i <= 9; i++) {
    const price = 10000 + i * 10;
    pricesForMedian.push(price);
    await votesCol.insertOne({
      pollId: new Types.ObjectId(pollId),
      userId: new Types.ObjectId(),
      district: "Jalna",
      crop: CROP_A,
      expectedPrice: price,
      reasonType: "HIGH_DEMAND",
      reasonText: `Synthetic reason number ${i}xx`,
      createdAt: new Date(Date.now() - (20 - i) * 60_000),
    });
  }
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
    location: LOC.jalna,
    favoriteCrops: [CROP_A],
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

  const sorted = [...pricesForMedian].sort((a, b) => a - b);
  const expectedMedian =
    sorted.length % 2 === 1
      ? sorted[Math.floor(sorted.length / 2)]
      : Math.round((sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2);
  assert(
    "Median algorithm (even/odd via 10 votes)",
    v10["communityExpectedPrice"] === expectedMedian,
    `expected=${expectedMedian} got=${v10["communityExpectedPrice"]}`
  );

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

  // ------------------------------------------------------------------
  // Recent insights
  // ------------------------------------------------------------------
  for (let i = 0; i < 8; i++) {
    await votesCol.insertOne({
      pollId: new Types.ObjectId(pollId),
      userId: new Types.ObjectId(),
      district: "Jalna",
      crop: CROP_A,
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
    location: LOC.jalna,
    favoriteCrops: [CROP_A],
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
  const history = await http("GET", `/api/v1/farmer-price/history/${encodeURIComponent(CROP_A)}`, {
    token: jalna.token,
    expectStatus: 200,
  });
  const histData = history.json["data"] as {
    crop: string;
    district: string;
    polls: Record<string, unknown>[];
  };
  assert("History crop matches", histData.crop === CROP_A);
  assert("History district is farmer district", histData.district === "Jalna");
  assert(
    "History includes closed QA poll",
    histData.polls.some((p) => p["id"] === pollId)
  );
  const histPune = await http("GET", `/api/v1/farmer-price/history/${encodeURIComponent(CROP_A)}`, {
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

  let uniqueEnforced = false;
  try {
    await votesCol.insertOne({
      pollId: new Types.ObjectId(pollId),
      userId: new Types.ObjectId(jalna.userId),
      district: "Jalna",
      crop: CROP_A,
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
  // Missing poll / error format
  // ------------------------------------------------------------------
  const missing = await http("GET", `/api/v1/farmer-price/polls/${new Types.ObjectId().toHexString()}`, {
    token: jalna.token,
  });
  assert("Missing poll → 404", missing.status === 404, `status=${missing.status}`);
  assert(
    "Error response has success:false + message",
    missing.json["success"] === false && typeof missing.json["message"] === "string"
  );

  // ------------------------------------------------------------------
  // Concurrent ensure stress (Blocker 1)
  // ------------------------------------------------------------------
  await runConcurrentEnsure(
    "Concurrent ensure x10",
    10,
    STRESS_CROP,
    "Jalna",
    LOC.jalna,
    pollsCol,
    votesCol,
    slotsCol
  );
  await runConcurrentEnsure(
    "Concurrent ensure x25",
    25,
    STRESS_CROP,
    "Jalna",
    LOC.jalna,
    pollsCol,
    votesCol,
    slotsCol
  );
  await runConcurrentEnsure(
    "Concurrent ensure x50",
    50,
    STRESS_CROP,
    "Jalna",
    LOC.jalna,
    pollsCol,
    votesCol,
    slotsCol
  );

  // ------------------------------------------------------------------
  // Concurrent votes (unique users, one poll)
  // ------------------------------------------------------------------
  await clearPair(pollsCol, votesCol, slotsCol, "Jalna", STRESS_CROP);
  const votePoll = await http("POST", "/api/v1/farmer-price/polls", {
    token: jalna.token,
    body: { crop: STRESS_CROP, district: "Jalna" },
    expectStatus: 201,
  });
  const votePollId = String((votePoll.json["data"] as Record<string, unknown>)["id"]);
  createdPollIds.push(votePollId);
  await pollsCol.updateOne(
    { _id: new Types.ObjectId(votePollId) },
    {
      $set: {
        governmentPriceAvailable: true,
        governmentPriceSnapshot: frozenSnapshot,
        governmentUnit: "Quintal",
      },
    }
  );

  const voteTokens: string[] = [];
  for (let i = 0; i < 100; i++) {
    // 10-digit mobiles: 9020000000 .. 9020000099
    const mobile = `9020000${String(i).padStart(3, "0")}`;
    const user = await login(mobile);
    await ensureProfile(user.token, {
      name: `QA VoteStorm ${i}`,
      location: LOC.jalna,
      favoriteCrops: [STRESS_CROP],
      language: "en",
    });
    voteTokens.push(user.token);
  }

  const voteResults = await Promise.all(
    voteTokens.map((token, i) =>
      http("POST", `/api/v1/farmer-price/polls/${votePollId}/vote`, {
        token,
        body: {
          expectedPrice: frozenSnapshot + (i % 2 === 0 ? 0 : 50),
          ...(i % 2 === 0
            ? {}
            : {
                reasonType: "HIGH_DEMAND",
                reasonText: "Demand is high in market area",
              }),
        },
      })
    )
  );
  const voteOk = voteResults.filter((r) => r.status === 201).length;
  const voteFail = voteResults.filter((r) => r.status !== 201).length;
  const failBreakdown: Record<string, number> = {};
  for (const r of voteResults) {
    if (r.status === 201) continue;
    const key = `${r.status}:${String((r.json as { message?: string }).message ?? "")}`;
    failBreakdown[key] = (failBreakdown[key] ?? 0) + 1;
  }
  assert(
    "Concurrent votes x100: all accepted",
    voteOk === 100,
    `ok=${voteOk} fail=${voteFail} breakdown=${JSON.stringify(failBreakdown)}`
  );
  const dbVotes = await votesCol.countDocuments({ pollId: new Types.ObjectId(votePollId) });
  assert("Concurrent votes x100: DB vote count", dbVotes === 100, `count=${dbVotes}`);
  const afterStorm = await http("GET", `/api/v1/farmer-price/polls/${votePollId}`, {
    token: jalna.token,
    expectStatus: 200,
  });
  const stormData = afterStorm.json["data"] as Record<string, unknown>;
  assert(
    "Concurrent votes x100: poll voteCount synced",
    stormData["voteCount"] === 100,
    `voteCount=${stormData["voteCount"]}`
  );
  assert(
    "Concurrent votes x100: community price set",
    typeof stormData["communityExpectedPrice"] === "number"
  );

  // ------------------------------------------------------------------
  // Cleanup QA data (only QA crops we isolated)
  // ------------------------------------------------------------------
  for (const crop of [CROP_A, CROP_B, STRESS_CROP]) {
    await clearPair(pollsCol, votesCol, slotsCol, "Jalna", crop);
    await clearPair(pollsCol, votesCol, slotsCol, "Pune", crop);
  }
  for (const id of createdPollIds) {
    if (!Types.ObjectId.isValid(id)) continue;
    await votesCol.deleteMany({ pollId: new Types.ObjectId(id) });
    await pollsCol.deleteOne({ _id: new Types.ObjectId(id) });
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
  // eslint-disable-next-line no-console
  console.log(`\nQA_JSON=${JSON.stringify({ passed, failed, skipped, results })}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error("QA suite crashed:", err);
  try {
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db!;
      for (const crop of [CROP_A, CROP_B, STRESS_CROP]) {
        const polls = await db
          .collection("farmer_price_polls")
          .find({ crop, district: { $in: ["Jalna", "Pune"] } })
          .project({ _id: 1 })
          .toArray();
        for (const p of polls) {
          await db.collection("farmer_price_votes").deleteMany({ pollId: p._id });
          await db.collection("farmer_price_polls").deleteOne({ _id: p._id });
        }
        await db.collection("farmer_price_open_slots").deleteMany({
          crop,
          district: { $in: ["Jalna", "Pune"] },
        });
      }
      await mongoose.disconnect();
    }
  } catch {
    // ignore cleanup errors
  }
  process.exit(1);
});
