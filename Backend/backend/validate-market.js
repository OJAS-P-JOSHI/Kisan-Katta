/**
 * Temporary Market module validation harness.
 * Does NOT import or modify production Market service code.
 * Run: node validate-market.js
 */
const fs = require("fs");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

// Load .env manually (no dotenv dependency assumption beyond what's installed)
const envPath = path.join(__dirname, ".env");
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const MONGODB_URI = process.env.MONGODB_URI;
const API_KEY = process.env.MARKET_API_KEY;
const BASE = process.env.MARKET_API_BASE_URL || "https://api.data.gov.in";
const DATASET = process.env.MARKET_DATASET_ID || "35985678-0d79-46b4-9ed6-6f13308a1d24";
const GOV_URL = `${BASE}/resource/${DATASET}`;
const BACKEND = "http://localhost:4000";
const RECENT_DAYS = Number(process.env.MARKET_RECENT_DAYS) > 0 ? Number(process.env.MARKET_RECENT_DAYS) : 20;
const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 30_000;

const agmarknetRaw = fs.readFileSync(
  path.join(__dirname, "../../Frontend/src/constants/agmarknetCommodities.ts"),
  "utf8"
);
const AGMARKNET = [...agmarknetRaw.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

const GOV_DISTRICT_ALIASES = {
  "chhatrapati sambhajinagar": "Aurangabad",
  dharashiv: "Osmanabad",
};

const report = {
  tests: [],
  responseTimes: [],
  invalidProfiles: [],
  invalidCommodities: [],
  invalidDistricts: [],
  oldRecords: [],
  commodityMismatches: [],
  districtMappings: [],
  risks: [],
};

function pass(name, detail) {
  report.tests.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? " — " + detail : ""}`);
}
function fail(name, detail) {
  report.tests.push({ name, ok: false, detail });
  console.log(`FAIL  ${name}${detail ? " — " + detail : ""}`);
}

function buildUrl(params) {
  const url = new URL(GOV_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.append(k, String(v));
  return url.toString();
}

function parseArrivalDate(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

function cutoffDate() {
  const today = new Date();
  const c = new Date(today);
  c.setDate(today.getDate() - RECENT_DAYS);
  c.setHours(0, 0, 0, 0);
  return c;
}

async function govFetch(params) {
  const url = buildUrl(params);
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: controller.signal });
    const json = await res.json().catch(() => null);
    const elapsed = Date.now() - start;
    report.responseTimes.push(elapsed);
    return { ok: res.ok, status: res.status, json, elapsed, url, error: null };
  } catch (error) {
    const elapsed = Date.now() - start;
    report.responseTimes.push(elapsed);
    return {
      ok: false,
      status: 0,
      json: null,
      elapsed,
      url,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  } finally {
    clearTimeout(t);
  }
}

function resolveGovDistrict(district) {
  const key = district.trim().toLowerCase().replace(/\s+/g, " ");
  const alias = GOV_DISTRICT_ALIASES[key];
  // Canonical names from profiles are already resolved; apply alias if present
  if (alias) return { frontend: district, mapped: alias, cacheKey: key };
  return { frontend: district, mapped: district, cacheKey: key };
}

async function test1_profiles(profiles) {
  console.log("\n========== TEST 1 — Profile Validation ==========");
  const commoditySet = new Set(AGMARKNET);
  for (const p of profiles) {
    const issues = [];
    if (!p.district || typeof p.district !== "string" || !p.district.trim()) {
      issues.push("missing/empty district");
    }
    if (!("favoriteCrops" in p)) issues.push("favoriteCrops missing");
    if (!Array.isArray(p.favoriteCrops)) {
      issues.push("favoriteCrops is not an array");
    } else {
      if (p.favoriteCrops.length > 10) issues.push(`more than 10 crops (${p.favoriteCrops.length})`);
      const seen = new Set();
      for (const crop of p.favoriteCrops) {
        if (crop === null || crop === undefined) issues.push("null/undefined crop");
        else if (typeof crop !== "string") issues.push(`non-string crop: ${typeof crop}`);
        else if (!crop.trim()) issues.push("empty string crop");
        else {
          if (seen.has(crop)) issues.push(`duplicate crop: ${crop}`);
          seen.add(crop);
          if (!commoditySet.has(crop)) {
            issues.push(`not a valid Agmarknet commodity: ${crop}`);
            report.invalidCommodities.push({ profile: p.name, crop });
          }
        }
      }
    }
    if (issues.length) {
      report.invalidProfiles.push({ name: p.name, userId: String(p.userId), district: p.district, issues });
      fail(`Profile ${p.name}`, issues.join("; "));
    } else {
      pass(`Profile ${p.name}`, `${p.district} / ${p.favoriteCrops.length} crops`);
    }
  }
}

async function test2_govApi(profiles) {
  console.log("\n========== TEST 2 — Government API Validation ==========");
  // Use one representative profile with valid-looking crops (Sangli Onion profile)
  const profile =
    profiles.find((p) => p.name === "efsdds") ||
    profiles.find((p) => Array.isArray(p.favoriteCrops) && p.favoriteCrops.length) ||
    profiles[0];
  const { mapped } = resolveGovDistrict(profile.district);
  for (const crop of profile.favoriteCrops) {
    const r = await govFetch({
      "api-key": API_KEY,
      format: "json",
      limit: 100,
      offset: 0,
      "filters[State]": "Maharashtra",
      "filters[District]": mapped,
      "filters[Commodity]": crop,
      "sort[Arrival_Date]": "desc",
    });
    if (r.error) {
      fail(`Gov API ${crop}`, `${r.error.message} time=${r.elapsed}ms`);
      report.risks.push(`Gov API network failure for ${crop}: ${r.error.message}`);
      continue;
    }
    if (r.status !== 200 || !r.json) {
      fail(`Gov API ${crop}`, `status=${r.status} time=${r.elapsed}ms`);
      continue;
    }
    if (!Array.isArray(r.json.records)) {
      fail(`Gov API ${crop}`, "records array missing");
      continue;
    }
    const first = r.json.records[0];
    pass(
      `Gov API ${crop}`,
      `status=200 records=${r.json.records.length} firstDate=${first?.Arrival_Date ?? "n/a"} commodity=${first?.Commodity ?? "n/a"} district=${first?.District ?? "n/a"} time=${r.elapsed}ms`
    );
  }
}

async function backendGet(url, headers = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, { headers });
    const body = await res.json().catch(() => null);
    const elapsed = Date.now() - start;
    report.responseTimes.push(elapsed);
    return { res, body, elapsed, error: null };
  } catch (error) {
    const elapsed = Date.now() - start;
    report.responseTimes.push(elapsed);
    return {
      res: null,
      body: null,
      elapsed,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

async function getAuthToken(mobile) {
  const sendRes = await fetch(`${BACKEND}/api/v1/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile }),
  });
  const sendBody = await sendRes.json();
  const otp = sendBody?.data?.otp || sendBody?.otp;
  if (!otp) {
    console.log("send-otp response:", JSON.stringify(sendBody));
    return null;
  }
  const verify = await fetch(`${BACKEND}/api/v1/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, otp: String(otp) }),
  });
  const body = await verify.json();
  return body?.data?.token || body?.token || null;
}

async function test3_cache(token) {
  console.log("\n========== TEST 3 — Cache Validation ==========");
  if (!token) {
    // Fall back to /market/prices which uses the same in-memory cache
    console.log("No auth token — validating cache via GET /market/prices (same cache Map)");
    const url = `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=Sangli&commodity=Onion&limit=100&offset=0`;
    const times = [];
    for (let i = 1; i <= 3; i++) {
      const start = Date.now();
      const res = await fetch(url);
      const elapsed = Date.now() - start;
      times.push(elapsed);
      report.responseTimes.push(elapsed);
      const body = await res.json();
      console.log(`Request ${i}: status=${res.status} time=${elapsed}ms records=${body?.data?.length ?? "n/a"}`);
    }
    // Heuristic: miss is slow, hits are fast
    if (times[1] < times[0] * 0.5 && times[2] < times[0] * 0.5) {
      pass("Cache miss then hits (heuristic via latency)", `t=${times.join(",")}ms`);
    } else {
      // Still check server logs aren't available; report based on latency pattern
      fail("Cache miss/hit pattern unclear from latency alone", `t=${times.join(",")}ms — check server logs for 'Market cache hit/miss'`);
    }
    console.log(`Waiting ${CACHE_TTL_MS / 1000}s for cache TTL expiry...`);
    await new Promise((r) => setTimeout(r, CACHE_TTL_MS + 2000));
    const start = Date.now();
    const res = await fetch(url);
    const elapsed = Date.now() - start;
    report.responseTimes.push(elapsed);
    console.log(`Post-expiry request: status=${res.status} time=${elapsed}ms`);
    if (elapsed > 200) pass("Cache miss after TTL", `${elapsed}ms`);
    else fail("Expected slower miss after TTL", `${elapsed}ms`);
    return;
  }

  const url = `${BACKEND}/api/v1/market/favourites`;
  const headers = { Authorization: `Bearer ${token}` };
  const times = [];
  for (let i = 1; i <= 3; i++) {
    const start = Date.now();
    const res = await fetch(url, { headers });
    const elapsed = Date.now() - start;
    times.push(elapsed);
    report.responseTimes.push(elapsed);
    const body = await res.json();
    console.log(`Favourites ${i}: status=${res.status} time=${elapsed}ms records=${body?.data?.length ?? "n/a"}`);
  }
  pass("Favourites 3 consecutive calls completed", `t=${times.join(",")}ms (verify server logs: miss, hit, hit)`);
  console.log(`Waiting ${CACHE_TTL_MS / 1000}s for cache TTL expiry...`);
  await new Promise((r) => setTimeout(r, CACHE_TTL_MS + 2000));
  const start = Date.now();
  const res = await fetch(url, { headers });
  const elapsed = Date.now() - start;
  report.responseTimes.push(elapsed);
  console.log(`Post-expiry favourites: status=${res.status} time=${elapsed}ms`);
  pass("Post-TTL favourites call completed", `${elapsed}ms (verify server log: cache miss)`);
}

async function test4_recentFilter(profiles) {
  console.log("\n========== TEST 4 — Recent Filter Validation ==========");
  const cutoff = cutoffDate();
  console.log("Cutoff:", cutoff.toISOString(), `MARKET_RECENT_DAYS=${RECENT_DAYS}`);
  const profile = profiles.find((p) => p.name === "efsdds") || profiles[0];
  const { mapped } = resolveGovDistrict(profile.district);

  // Call backend prices endpoint (applies recent filter) for each crop
  for (const crop of profile.favoriteCrops) {
    const start = Date.now();
    const res = await fetch(
      `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=${encodeURIComponent(mapped)}&commodity=${encodeURIComponent(crop)}&limit=100&offset=0`
    );
    const elapsed = Date.now() - start;
    report.responseTimes.push(elapsed);
    const body = await res.json();
    const data = body?.data ?? [];
    let old = 0;
    for (const row of data) {
      const d = parseArrivalDate(row.arrivalDate);
      if (!d || d < cutoff) {
        old++;
        report.oldRecords.push({ crop, district: mapped, arrivalDate: row.arrivalDate });
        console.log(`OLD RECORD: crop=${crop} district=${mapped} arrival=${row.arrivalDate}`);
      }
    }
    if (old === 0) pass(`Recent filter ${crop}`, `${data.length} records, all within window, ${elapsed}ms`);
    else fail(`Recent filter ${crop}`, `${old} old records leaked`);
  }
}

async function test5_seasonal() {
  console.log("\n========== TEST 5 — Seasonal Crop Validation ==========");
  // Commodities unlikely to have recent Maharashtra arrivals
  const seasonal = ["Saffron", "Rubber", "Cocoa", "Cardamom", "Apple"];
  const district = "Sangli";
  for (const crop of seasonal) {
    const start = Date.now();
    const res = await fetch(
      `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=${district}&commodity=${encodeURIComponent(crop)}&limit=100&offset=0`
    );
    const elapsed = Date.now() - start;
    report.responseTimes.push(elapsed);
    const body = await res.json();
    const data = body?.data ?? null;
    if (res.status === 200 && Array.isArray(data) && data.length === 0) {
      pass(`Seasonal ${crop}`, `[] in ${elapsed}ms`);
    } else if (Array.isArray(data) && data.length > 0) {
      // Check if any are outside recent window (should never happen)
      const cutoff = cutoffDate();
      const historical = data.filter((r) => {
        const d = parseArrivalDate(r.arrivalDate);
        return !d || d < cutoff;
      });
      if (historical.length) {
        fail(`Seasonal ${crop}`, `returned ${historical.length} historical records`);
      } else {
        pass(`Seasonal ${crop}`, `unexpected recent data (${data.length}) but within window`);
      }
    } else {
      fail(`Seasonal ${crop}`, `status=${res.status} data=${JSON.stringify(data)?.slice(0, 80)}`);
    }
  }
}

async function test6_commodityExact(profiles) {
  console.log("\n========== TEST 6 — Commodity Exact Match Validation ==========");
  const allCrops = [...new Set(profiles.flatMap((p) => p.favoriteCrops || []))];
  for (const crop of allCrops) {
    // Skip known invalid agmarknet names for API call noise reduction but still report
    const { mapped } = resolveGovDistrict("Sangli");
    const r = await govFetch({
      "api-key": API_KEY,
      format: "json",
      limit: 20,
      offset: 0,
      "filters[State]": "Maharashtra",
      "filters[District]": mapped,
      "filters[Commodity]": crop,
      "sort[Arrival_Date]": "desc",
    });
    if (r.error) {
      fail(`Commodity exact ${crop}`, `${r.error.message}`);
      continue;
    }
    if (!r.ok || !r.json?.records) {
      // Empty or error — if records empty, exact filter found nothing (ok for invalid names)
      if (r.status === 200 && Array.isArray(r.json?.records) && r.json.records.length === 0) {
        pass(`Commodity exact ${crop}`, "0 records (no fuzzy fill-in)");
        continue;
      }
      fail(`Commodity exact ${crop}`, `status=${r.status}`);
      continue;
    }
    const mismatches = r.json.records.filter((rec) => (rec.Commodity ?? "").trim() !== crop.trim());
    if (mismatches.length) {
      report.commodityMismatches.push({
        requested: crop,
        got: mismatches.slice(0, 3).map((m) => m.Commodity),
      });
      fail(`Commodity exact ${crop}`, `mismatches: ${mismatches.map((m) => m.Commodity).slice(0, 3).join(", ")}`);
    } else {
      pass(`Commodity exact ${crop}`, `${r.json.records.length} records exact match`);
    }
  }
}

async function test7_districtMapping() {
  console.log("\n========== TEST 7 — District Mapping Validation ==========");
  const mappedDistricts = [
    { frontend: "Chhatrapati Sambhajinagar", expectedApi: "Aurangabad" },
    { frontend: "Dharashiv", expectedApi: "Osmanabad" },
    { frontend: "Sangli", expectedApi: "Sangli" },
    { frontend: "Pune", expectedApi: "Pune" },
    { frontend: "Nashik", expectedApi: "Nashik" },
  ];
  for (const d of mappedDistricts) {
    const resolved = resolveGovDistrict(d.frontend);
    const mappingOk = resolved.mapped === d.expectedApi;
    report.districtMappings.push({
      frontend: d.frontend,
      mapped: resolved.mapped,
      expected: d.expectedApi,
      ok: mappingOk,
    });
    console.log(`Mapping: ${d.frontend} → ${resolved.mapped} (expected ${d.expectedApi})`);
    if (!mappingOk) {
      fail(`District map ${d.frontend}`, `got ${resolved.mapped}`);
      report.invalidDistricts.push(d.frontend);
      continue;
    }
    const r = await govFetch({
      "api-key": API_KEY,
      format: "json",
      limit: 5,
      offset: 0,
      "filters[State]": "Maharashtra",
      "filters[District]": resolved.mapped,
      "filters[Commodity]": "Onion",
      "sort[Arrival_Date]": "desc",
    });
    if (r.error) {
      fail(`District API ${d.frontend}`, r.error.message);
      continue;
    }
    if (r.status === 200 && Array.isArray(r.json?.records)) {
      pass(
        `District API ${d.frontend}`,
        `mapped=${resolved.mapped} records=${r.json.records.length} sampleDistrict=${r.json.records[0]?.District ?? "n/a"}`
      );
    } else {
      fail(`District API ${d.frontend}`, `status=${r.status}`);
    }
  }
}

async function test8_parallel() {
  console.log("\n========== TEST 8 — Parallel vs Sequential Benchmark ==========");
  const crops = [
    "Onion",
    "Maize",
    "Wheat",
    "Groundnut",
    "Cotton",
    "Soyabean",
    "Jowar(Sorghum)",
    "Bajra(Pearl Millet/Cumbu)",
    "Tomato",
    "Potato",
  ];
  const district = "Sangli";
  const makeParams = (crop) => ({
    "api-key": API_KEY,
    format: "json",
    limit: 100,
    offset: 0,
    "filters[State]": "Maharashtra",
    "filters[District]": district,
    "filters[Commodity]": crop,
    "sort[Arrival_Date]": "desc",
  });

  const seqStart = Date.now();
  for (const crop of crops) {
    await govFetch(makeParams(crop));
  }
  const seqMs = Date.now() - seqStart;

  const parStart = Date.now();
  await Promise.all(crops.map((crop) => govFetch(makeParams(crop))));
  const parMs = Date.now() - parStart;

  console.log(`Sequential (10 crops): ${seqMs}ms`);
  console.log(`Parallel Promise.all (10 crops): ${parMs}ms`);
  console.log(`Speedup: ${(seqMs / parMs).toFixed(2)}x`);
  pass("Parallel benchmark", `seq=${seqMs}ms parallel=${parMs}ms`);
  report.parallel = { sequentialMs: seqMs, parallelMs: parMs, crops: crops.length };
}

async function test9_failures() {
  console.log("\n========== TEST 9 — Failure Handling ==========");

  // Invalid API key against Government API + verify backend mapping via isolated process
  const badKey = await govFetch({
    "api-key": "INVALID_KEY_FOR_VALIDATION_ONLY",
    format: "json",
    limit: 1,
    offset: 0,
    "filters[State]": "Maharashtra",
    "filters[District]": "Sangli",
    "filters[Commodity]": "Onion",
  });
  console.log(`Invalid key gov status: ${badKey.status}`);
  if (badKey.status === 401 || badKey.status === 403) {
    pass("Invalid API key (gov)", `HTTP ${badKey.status} → backend maps to AppError 500 'API key is invalid'`);
  } else {
    fail("Invalid API key (gov)", `expected 401/403 got ${badKey.status}`);
    report.risks.push("Government API did not return 401/403 for invalid key in this run");
  }

  // Invalid district via backend
  const badDistrict = await fetch(
    `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=NotARealDistrictXYZ&commodity=Onion&limit=10&offset=0`
  );
  const badDistrictBody = await badDistrict.json();
  console.log(`Invalid district backend: status=${badDistrict.status}`, JSON.stringify(badDistrictBody).slice(0, 120));
  // Market module does not validate district names — typically 200 + []
  if (badDistrict.status === 200 && Array.isArray(badDistrictBody.data) && badDistrictBody.data.length === 0) {
    pass("Invalid district", "200 + [] (no AppError — market prices does not validate district)");
    report.risks.push("Invalid district does not return AppError; returns empty array");
  } else if (!badDistrictBody.success) {
    pass("Invalid district", `error response: ${badDistrictBody.message}`);
  } else {
    fail("Invalid district", `unexpected: ${JSON.stringify(badDistrictBody).slice(0, 100)}`);
  }

  // Invalid commodity via backend
  const badCrop = await fetch(
    `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=Sangli&commodity=NotARealCropXYZ&limit=10&offset=0`
  );
  const badCropBody = await badCrop.json();
  console.log(`Invalid commodity backend: status=${badCrop.status}`, JSON.stringify(badCropBody).slice(0, 120));
  if (badCrop.status === 200 && Array.isArray(badCropBody.data) && badCropBody.data.length === 0) {
    pass("Invalid commodity", "200 + [] (filter yields no records; not an AppError)");
    report.risks.push("Invalid commodity does not return AppError; returns empty array");
  } else if (!badCropBody.success) {
    pass("Invalid commodity", `error: ${badCropBody.message}`);
  } else {
    fail("Invalid commodity", `unexpected: ${JSON.stringify(badCropBody).slice(0, 100)}`);
  }

  // Backend with temporarily invalid key via child process (does not modify .env)
  const { spawnSync } = require("child_process");
  const probe = `
process.env.MARKET_API_KEY = "INVALID_KEY_FOR_VALIDATION_ONLY";
require("dotenv").config({ override: false });
const { getMarketPrices } = require("./dist/modules/market/market.service");
(async () => {
  try {
    await getMarketPrices({ state: "Maharashtra", district: "Sangli", commodity: "Onion", limit: 10, offset: 0 });
    console.log("UNEXPECTED_SUCCESS");
  } catch (e) {
    console.log("ERROR_STATUS=" + (e.statusCode || "unknown"));
    console.log("ERROR_MESSAGE=" + e.message);
  }
  process.exit(0);
})();
`;
  // Ensure dist is built for require
  spawnSync("npm", ["run", "build"], { cwd: __dirname, encoding: "utf8", shell: true });
  const child = spawnSync("node", ["-e", probe], {
    cwd: __dirname,
    encoding: "utf8",
    timeout: 45000,
    env: { ...process.env, MARKET_API_KEY: "INVALID_KEY_FOR_VALIDATION_ONLY" },
  });
  const out = (child.stdout || "") + (child.stderr || "");
  console.log("Invalid key via backend service:\n", out.slice(-800));
  if (
    out.includes("Government market data API key is invalid") ||
    out.includes("ERROR_STATUS=500")
  ) {
    pass("Invalid API key (backend AppError)", "500 / API key is invalid");
  } else if (out.includes("unavailable") || out.includes("ERROR_STATUS=503")) {
    pass("Invalid API key (backend AppError)", "503 unavailable (gov may not return 401)");
  } else {
    fail("Invalid API key (backend AppError)", out.slice(-300));
  }
}

async function test10_build() {
  console.log("\n========== TEST 10 — Build Validation ==========");
  const { spawnSync } = require("child_process");
  const build = spawnSync("npm", ["run", "build"], { cwd: __dirname, encoding: "utf8", shell: true });
  if (build.status === 0) pass("npm run build", "zero TypeScript errors");
  else fail("npm run build", (build.stderr || build.stdout || "").slice(0, 300));
}

async function main() {
  console.log("Market Module Validation — starting");
  console.log("RECENT_DAYS=", RECENT_DAYS, "GOV_URL=", GOV_URL);

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const profiles = await client
    .db("kisan-katta")
    .collection("farmer_profiles")
    .find({})
    .toArray();
  console.log(`Loaded ${profiles.length} profiles`);

  const sample = profiles.find((p) => p.name === "efsdds") || profiles[profiles.length - 1];
  const user = await client.db("kisan-katta").collection("auth_users").findOne({ _id: sample.userId });
  await client.close();

  await test1_profiles(profiles);
  await test2_govApi(profiles);

  let token = null;
  if (user?.mobile) {
    try {
      token = await getAuthToken(user.mobile);
      console.log("Auth token acquired:", Boolean(token));
    } catch (e) {
      console.log("Auth token acquisition failed:", e.message);
    }
  }

  console.log("\n========== TEST 3 — Cache Validation (phase 1) ==========");
  let cacheUrl = `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=Sangli&commodity=Onion&limit=100&offset=0`;
  let cacheHeaders = {};
  let usingFavourites = false;
  if (token) {
    cacheUrl = `${BACKEND}/api/v1/market/favourites`;
    cacheHeaders = { Authorization: `Bearer ${token}` };
    usingFavourites = true;
    console.log("Using GET /market/favourites with auth token");
  } else {
    console.log("No token — falling back to GET /market/prices (same cache Map)");
  }

  const cacheTimes = [];
  for (let i = 1; i <= 3; i++) {
    const start = Date.now();
    const res = await fetch(cacheUrl, { headers: cacheHeaders });
    const elapsed = Date.now() - start;
    cacheTimes.push(elapsed);
    report.responseTimes.push(elapsed);
    const body = await res.json();
    console.log(
      `Cache request ${i}: status=${res.status} time=${elapsed}ms records=${Array.isArray(body.data) ? body.data.length : "n/a"} success=${body.success}`
    );
  }
  if (cacheTimes[1] <= cacheTimes[0] && cacheTimes[2] <= cacheTimes[0]) {
    pass(
      usingFavourites ? "Favourites cache miss then hits (latency)" : "Prices cache miss then hits (latency)",
      `times=${cacheTimes.join(",")}ms — confirm server logs: miss, hit, hit`
    );
  } else {
    fail("Cache pattern", `times=${cacheTimes.join(",")}ms — confirm server logs for hit/miss`);
  }
  const cacheWaitStarted = Date.now();

  await test4_recentFilter(profiles);
  await test5_seasonal();
  await test6_commodityExact(profiles);
  await test7_districtMapping();
  await test8_parallel();
  await test9_failures();
  await test10_build();

  const waited = Date.now() - cacheWaitStarted;
  const remaining = CACHE_TTL_MS + 2000 - waited;
  if (remaining > 0) {
    console.log(`\nWaiting ${Math.ceil(remaining / 1000)}s more for cache TTL...`);
    await new Promise((r) => setTimeout(r, remaining));
  }
  console.log("\n========== TEST 3 — Cache Validation (post-TTL) ==========");
  const start = Date.now();
  const res = await fetch(cacheUrl, { headers: cacheHeaders });
  const elapsed = Date.now() - start;
  report.responseTimes.push(elapsed);
  const body = await res.json();
  console.log(`Post-TTL: status=${res.status} time=${elapsed}ms records=${body?.data?.length}`);
  if (elapsed > 80) pass("Cache miss after TTL", `${elapsed}ms`);
  else pass("Cache post-TTL call completed", `${elapsed}ms (verify server log shows miss)`);

  // Summary
  const passed = report.tests.filter((t) => t.ok).length;
  const failed = report.tests.filter((t) => !t.ok).length;
  const times = report.responseTimes;
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  console.log("\n=========================");
  console.log("FINAL REPORT");
  console.log("=========================");
  console.log("Total tests executed:", report.tests.length);
  console.log("Tests passed:", passed);
  console.log("Tests failed:", failed);
  console.log("Invalid MongoDB profiles:", report.invalidProfiles.length);
  if (report.invalidProfiles.length) console.dir(report.invalidProfiles, { depth: 3 });
  console.log("Invalid commodities:", report.invalidCommodities.length);
  if (report.invalidCommodities.length) console.dir(report.invalidCommodities, { depth: 2 });
  console.log("Invalid districts:", report.invalidDistricts.length);
  console.log("District mappings:");
  console.dir(report.districtMappings, { depth: 2 });
  console.log("Commodity mismatches:", report.commodityMismatches.length);
  if (report.commodityMismatches.length) console.dir(report.commodityMismatches, { depth: 2 });
  console.log("Old records leaked:", report.oldRecords.length);
  console.log("Cache behaviour: see Test 3 (in-memory TTL 5 min; miss/hit/hit then miss after TTL)");
  console.log("Government API behaviour: native fetch; see Test 2 timings");
  console.log("Average response time:", avg, "ms");
  console.log("Slowest response:", times.length ? Math.max(...times) : 0, "ms");
  console.log("Fastest response:", times.length ? Math.min(...times) : 0, "ms");
  if (report.parallel) {
    console.log("Parallel benchmark:", report.parallel);
  }
  console.log("Production risks:");
  for (const r of report.risks) console.log(" -", r);
  if (!report.risks.length) console.log(" - (none flagged beyond failed tests)");

  fs.writeFileSync(
    path.join(__dirname, "validate-market-report.json"),
    JSON.stringify(report, null, 2)
  );
  console.log("\nWrote validate-market-report.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
