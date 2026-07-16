/**
 * Read-only investigation: empty farmer-price polls state.
 * Does not modify application code or production business data (cleanup of none).
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const BASE = process.env.QA_BASE_URL ?? "http://127.0.0.1:4000";
const MONGODB_URI = process.env.MONGODB_URI!;

type Json = Record<string, unknown>;

async function http(
  method: string,
  urlPath: string,
  token?: string
): Promise<{ status: number; json: Json }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${urlPath}`, { method, headers });
  let json: Json = {};
  try {
    json = (await res.json()) as Json;
  } catch {
    json = {};
  }
  return { status: res.status, json };
}

async function login(mobile: string): Promise<{ token: string; userId: string }> {
  const otpRes = await http("POST", "/api/v1/auth/send-otp", undefined);
  // re-call properly
  const send = await fetch(`${BASE}/api/v1/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile }),
  });
  const sendJson = (await send.json()) as { data: { otp: string } };
  const verify = await fetch(`${BASE}/api/v1/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, otp: sendJson.data.otp }),
  });
  const verifyJson = (await verify.json()) as { data: { token: string } };
  const me = await fetch(`${BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${verifyJson.data.token}` },
  });
  const meJson = (await me.json()) as { data: { userId: string } };
  return { token: verifyJson.data.token, userId: meJson.data.userId };
}

function statusOf(endsAt: Date, now: Date): "OPEN" | "CLOSED" {
  return endsAt > now ? "OPEN" : "CLOSED";
}

async function main(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;
  const now = new Date();

  console.log("\n========== CHECK 7 - TIME ==========");
  console.log("Current server/JS time (ISO):", now.toISOString());
  console.log("Current server/JS time (local):", now.toString());

  const polls = await db
    .collection("farmer_price_polls")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  console.log("\n========== CHECK 1 - DATABASE ==========");
  console.log("Total FarmerPricePoll documents:", polls.length);

  for (const p of polls) {
    const endsAt = new Date(p.endsAt as Date);
    const startsAt = new Date(p.startsAt as Date);
    console.log("---");
    console.log("_id:", String(p._id));
    console.log("crop:", JSON.stringify(p.crop));
    console.log("district:", JSON.stringify(p.district));
    console.log("startsAt:", startsAt.toISOString());
    console.log("endsAt:", endsAt.toISOString());
    console.log("Current Status:", statusOf(endsAt, now));
    console.log("governmentPriceAvailable:", p.governmentPriceAvailable);
    console.log("voteCount:", p.voteCount);
  }

  // Profiles that look like the real app user (Nashik + Onion/Tomato from server logs)
  const profiles = await db.collection("farmer_profiles").find({}).toArray();
  console.log("\n========== CHECK 2 - CANDIDATE USERS ==========");
  console.log("Total farmer_profiles:", profiles.length);

  const nashikProfiles = profiles.filter((pr) => {
    const d = String(pr.district ?? "").toLowerCase();
    return d.includes("nashik") || d.includes("nasik");
  });

  console.log("Profiles with Nashik/Nasik district:", nashikProfiles.length);

  // Prefer profile matching terminal favourites Onion/Tomato/Dry Grapes
  const scored = nashikProfiles
    .map((pr) => {
      const crops = (pr.favoriteCrops as string[]) ?? [];
      const cropSet = new Set(crops.map((c) => c.trim().toLowerCase()));
      let score = 0;
      if (cropSet.has("onion")) score += 2;
      if (cropSet.has("tomato")) score += 2;
      if (cropSet.has("dry grapes") || cropSet.has("dry grape")) score += 2;
      return { pr, score, crops };
    })
    .sort((a, b) => b.score - a.score);

  const primary = scored[0]?.pr ?? nashikProfiles[0] ?? profiles[profiles.length - 1];

  if (!primary) {
    console.log("NO PROFILES FOUND");
    await mongoose.disconnect();
    return;
  }

  const userId = String(primary.userId);
  const authUser = await db.collection("auth_users").findOne({
    _id: new mongoose.Types.ObjectId(userId),
  });

  console.log("\n--- Selected test user (most likely from app logs: Nashik + market favourites) ---");
  console.log("userId:", userId);
  console.log("mobile:", authUser?.mobile ?? "(unknown)");
  console.log("district:", JSON.stringify(primary.district));
  console.log("taluka:", JSON.stringify(primary.taluka));
  console.log("village:", JSON.stringify(primary.village));
  console.log("favoriteCrops:", JSON.stringify(primary.favoriteCrops));

  // Also list ALL nashik profiles briefly
  for (const { pr, score } of scored) {
    console.log(
      `  candidate userId=${String(pr.userId)} district=${pr.district} crops=${JSON.stringify(pr.favoriteCrops)} score=${score}`
    );
  }

  const favCrops = ((primary.favoriteCrops as string[]) ?? []).map((c) => c.trim()).filter(Boolean);
  const profileDistrict = String(primary.district);

  // Resolve district the same way backend does: import resolveDistrict
  const { resolveDistrict } = await import(
    "../src/config/maharashtraDistrictCoordinates"
  );
  let resolvedDistrict = profileDistrict;
  try {
    resolvedDistrict = resolveDistrict(profileDistrict).district;
  } catch (e) {
    console.log("resolveDistrict FAILED:", e);
  }
  console.log("Resolved district for query:", JSON.stringify(resolvedDistrict));

  console.log("\n========== CHECK 3 - FILTERING SIMULATION (getMyPolls) ==========");
  console.log("Mongo query equivalent:");
  console.log(
    JSON.stringify(
      {
        district: resolvedDistrict,
        crop: { $in: favCrops },
        endsAt: { $gt: now.toISOString() },
      },
      null,
      2
    )
  );

  for (const p of polls) {
    const reasons: string[] = [];
    let included = true;

    if (String(p.district) !== resolvedDistrict) {
      included = false;
      reasons.push(
        `District mismatch: poll=${JSON.stringify(p.district)} vs profileResolved=${JSON.stringify(resolvedDistrict)}`
      );
    }

    if (!favCrops.includes(String(p.crop))) {
      included = false;
      // check near-misses
      const cropLower = String(p.crop).toLowerCase();
      const near = favCrops.filter((f) => f.toLowerCase() === cropLower);
      if (near.length > 0 && !favCrops.includes(String(p.crop))) {
        reasons.push(
          `Favourite crop CASE/SPELLING mismatch: poll=${JSON.stringify(p.crop)} favourites=${JSON.stringify(favCrops)} (case-insensitive match exists: ${JSON.stringify(near)})`
        );
      } else {
        const loose = favCrops.filter(
          (f) =>
            f.toLowerCase().includes(cropLower) ||
            cropLower.includes(f.toLowerCase()) ||
            (f.toLowerCase() === "soybean" && cropLower === "soyabean") ||
            (f.toLowerCase() === "soyabean" && cropLower === "soybean")
        );
        reasons.push(
          `Favourite crop mismatch: poll=${JSON.stringify(p.crop)} not in ${JSON.stringify(favCrops)}${
            loose.length ? ` (near: ${JSON.stringify(loose)})` : ""
          }`
        );
      }
    }

    const endsAt = new Date(p.endsAt as Date);
    if (!(endsAt > now)) {
      included = false;
      reasons.push(`Poll expired: endsAt=${endsAt.toISOString()} <= now=${now.toISOString()}`);
    }

    console.log("---");
    console.log(`Poll ${String(p._id)} crop=${JSON.stringify(p.crop)} district=${JSON.stringify(p.district)}`);
    if (included) {
      console.log("DECISION: INCLUDED");
      console.log(
        "Reasons: district match + crop in favourites + endsAt > now"
      );
    } else {
      console.log("DECISION: EXCLUDED");
      for (const r of reasons) console.log(" -", r);
    }
  }

  const matching = await db
    .collection("farmer_price_polls")
    .find({
      district: resolvedDistrict,
      crop: { $in: favCrops },
      endsAt: { $gt: now },
    })
    .toArray();
  console.log("\nQuery result count:", matching.length);

  console.log("\n========== CHECK 5 - STRING MATCHES (crops) ==========");
  const allPollCrops = [...new Set(polls.map((p) => String(p.crop)))];
  console.log("Distinct poll crops:", JSON.stringify(allPollCrops));
  console.log("Profile favouriteCrops:", JSON.stringify(favCrops));
  for (const fav of favCrops) {
    const exact = allPollCrops.filter((c) => c === fav);
    const ci = allPollCrops.filter((c) => c.toLowerCase() === fav.toLowerCase());
    const spellingNear = allPollCrops.filter((c) => {
      const a = c.toLowerCase().replace(/\s+/g, "");
      const b = fav.toLowerCase().replace(/\s+/g, "");
      return a !== b && (a.includes(b) || b.includes(a) || (a === "soybean" && b === "soyabean") || (a === "soyabean" && b === "soybean"));
    });
    console.log(
      `Favourite ${JSON.stringify(fav)}: exactPollMatches=${JSON.stringify(exact)} caseInsensitive=${JSON.stringify(ci)} spellingNear=${JSON.stringify(spellingNear)}`
    );
  }

  console.log("\n========== CHECK 6 - DISTRICT MATCHES ==========");
  const allPollDistricts = [...new Set(polls.map((p) => String(p.district)))];
  console.log("Distinct poll districts:", JSON.stringify(allPollDistricts));
  console.log("Profile district raw:", JSON.stringify(profileDistrict));
  console.log("Profile district resolved:", JSON.stringify(resolvedDistrict));
  for (const pd of allPollDistricts) {
    let resolvedPollDistrict = pd;
    try {
      resolvedPollDistrict = resolveDistrict(pd).district;
    } catch {
      resolvedPollDistrict = `(unresolvable) ${pd}`;
    }
    const match = pd === resolvedDistrict;
    console.log(
      `Poll district ${JSON.stringify(pd)} resolved=${JSON.stringify(resolvedPollDistrict)} matches profileResolved=${match}`
    );
  }

  // Alias notes
  console.log("Alias note: Nasik → Nashik via resolveDistrict on profile side.");
  console.log("Alias note: Aurangabad ↔ Chhatrapati Sambhajinagar handled in market service, NOT in farmer-price getMyPolls (exact district string match on stored poll.district).");

  console.log("\n========== CHECK 4 - API ==========");
  // Login as this user's mobile if available
  const mobile = authUser?.mobile as string | undefined;
  if (!mobile) {
    console.log("Cannot call API as user: no mobile on auth_users");
  } else {
    try {
      const { token } = await login(mobile);
      console.log("Authenticated as mobile:", mobile);

      const list = await http("GET", "/api/v1/farmer-price/polls", token);
      console.log("\nGET /api/v1/farmer-price/polls status:", list.status);
      console.log(JSON.stringify(list.json, null, 2));

      const mine = await http("GET", "/api/v1/farmer-price/polls/my", token);
      console.log("\nGET /api/v1/farmer-price/polls/my status:", mine.status);
      console.log(JSON.stringify(mine.json, null, 2));
    } catch (e) {
      console.log("API call failed:", e);
    }
  }

  // Also show OPEN polls anywhere for context
  const openAnywhere = polls.filter((p) => statusOf(new Date(p.endsAt as Date), now) === "OPEN");
  console.log("\n========== CONTEXT ==========");
  console.log("OPEN polls in entire DB:", openAnywhere.length);
  for (const p of openAnywhere) {
    console.log(
      `  OPEN ${String(p._id)} ${p.district}/${p.crop} ends=${new Date(p.endsAt as Date).toISOString()}`
    );
  }

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
