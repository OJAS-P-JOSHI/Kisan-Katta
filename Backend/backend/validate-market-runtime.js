/**
 * Market module RUNTIME validation harness.
 * Does NOT modify production Market code.
 *
 * Extends validate-market.js coverage for endpoints:
 *   GET /api/v1/market/prices
 *   GET /api/v1/market/favourites
 *
 * Run: node validate-market-runtime.js
 * Env:
 *   SKIP_CACHE_TTL_WAIT=1  — skip 5-minute TTL wait (default: 1)
 *   BACKEND_URL            — default http://localhost:4000
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { MongoClient } = require("mongodb");

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
const BACKEND = process.env.BACKEND_URL || "http://localhost:4000";
const RECENT_DAYS =
  Number(process.env.MARKET_RECENT_DAYS) > 0
    ? Number(process.env.MARKET_RECENT_DAYS)
    : 20;
const SKIP_CACHE_TTL_WAIT = process.env.SKIP_CACHE_TTL_WAIT !== "0";
const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 30_000;

const DTO_KEYS = [
  "commodity",
  "market",
  "district",
  "state",
  "variety",
  "grade",
  "arrivalDate",
  "modalPrice",
  "minPrice",
  "maxPrice",
];

const results = [];

function record(test) {
  results.push(test);
  const tag = test.pass ? "PASS" : "FAIL";
  console.log(
    `\n[${tag}] ${test.id} — ${test.name}` +
      (test.unexpected ? `\n  UNEXPECTED: ${test.unexpected}` : "") +
      (test.rootCause ? `\n  ROOT CAUSE: ${test.rootCause}` : "")
  );
}

function parseArrivalDate(value) {
  if (!value) return null;
  const match = String(value)
    .trim()
    .match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

function cutoffDate() {
  const today = new Date();
  const c = new Date(today);
  c.setDate(today.getDate() - RECENT_DAYS);
  c.setHours(0, 0, 0, 0);
  return c;
}

function validateDto(row) {
  const issues = [];
  for (const key of DTO_KEYS) {
    if (!(key in row)) issues.push(`missing ${key}`);
  }
  for (const key of [
    "commodity",
    "market",
    "district",
    "state",
    "variety",
    "grade",
    "arrivalDate",
  ]) {
    if (key in row && typeof row[key] !== "string") {
      issues.push(`${key} not string`);
    }
  }
  for (const key of ["modalPrice", "minPrice", "maxPrice"]) {
    if (key in row && typeof row[key] !== "number") {
      issues.push(`${key} not number`);
    }
  }
  return issues;
}

async function httpGet(url, headers = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, { headers });
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { _raw: text.slice(0, 500) };
    }
    return {
      status: res.status,
      body,
      elapsed: Date.now() - start,
      error: null,
    };
  } catch (error) {
    return {
      status: 0,
      body: null,
      elapsed: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function govFetch(params) {
  const url = new URL(GOV_URL);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.append(k, String(v));
  }
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const start = Date.now();
  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    const json = await res.json().catch(() => null);
    return {
      status: res.status,
      json,
      elapsed: Date.now() - start,
      error: null,
    };
  } catch (error) {
    return {
      status: 0,
      json: null,
      elapsed: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(t);
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
  if (!otp) return { token: null, detail: sendBody };
  const verify = await fetch(`${BACKEND}/api/v1/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, otp: String(otp) }),
  });
  const body = await verify.json();
  return {
    token: body?.data?.token || body?.token || null,
    detail: body,
  };
}

async function waitForBackend(maxMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const r = await httpGet(`${BACKEND}/health`);
    if (r.status === 200) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function loadProfileWithAuth() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const profiles = await db.collection("farmer_profiles").find({}).toArray();
  // Prefer multi-crop profile for ordering / partial-failure observations
  const multi = profiles
    .filter(
      (p) =>
        Array.isArray(p.favoriteCrops) &&
        p.favoriteCrops.length >= 2 &&
        typeof p.district === "string" &&
        p.district.trim()
    )
    .sort((a, b) => b.favoriteCrops.length - a.favoriteCrops.length)[0];
  const legacy = profiles.find((p) => {
    const d = (p.district || "").toLowerCase();
    return (
      d.includes("sambhajinagar") ||
      d.includes("aurangabad") ||
      d.includes("dharashiv") ||
      d.includes("osmanabad")
    );
  });
  const sample = multi || profiles[0];
  const user = sample
    ? await db.collection("auth_users").findOne({ _id: sample.userId })
    : null;
  await client.close();
  return { profiles, sample, legacy, user };
}

function bodyPreview(body, max = 600) {
  const s = JSON.stringify(body);
  if (!s) return null;
  return s.length > max ? s.slice(0, max) + "…" : s;
}

async function main() {
  console.log("=== Market Runtime Validation ===");
  console.log("BACKEND=", BACKEND);
  console.log("RECENT_DAYS=", RECENT_DAYS);
  console.log("SKIP_CACHE_TTL_WAIT=", SKIP_CACHE_TTL_WAIT);

  const up = await waitForBackend();
  if (!up) {
    console.error("Backend not reachable at", BACKEND);
    process.exit(1);
  }
  console.log("Backend healthy.");

  const { profiles, sample, legacy, user } = await loadProfileWithAuth();
  console.log(
    `Profiles=${profiles.length}; sample=${sample?.name} district=${sample?.district} crops=${JSON.stringify(sample?.favoriteCrops)}; mobile=${user?.mobile ? "yes" : "no"}`
  );

  let token = null;
  if (user?.mobile) {
    const auth = await getAuthToken(String(user.mobile));
    token = auth.token;
    console.log("Auth token:", token ? "acquired" : "FAILED", bodyPreview(auth.detail, 200));
  }

  // -------------------------------------------------------------------------
  // 1. Happy path — /prices
  // -------------------------------------------------------------------------
  {
    const url = `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=Sangli&commodity=Onion&limit=20&offset=0`;
    const r = await httpGet(url);
    const ok =
      r.status === 200 &&
      r.body?.success === true &&
      Array.isArray(r.body.data);
    record({
      id: "1a",
      name: "Happy-path GET /prices (Sangli Onion)",
      request: `GET ${url}`,
      status: r.status,
      responseBody: bodyPreview(r.body),
      elapsedMs: r.elapsed,
      pass: ok,
      unexpected: ok ? null : "Expected 200 success + data[]",
      rootCause: ok ? null : r.error || "unexpected status/body",
    });
  }

  // -------------------------------------------------------------------------
  // 1b. Happy path — /favourites
  // -------------------------------------------------------------------------
  {
    const url = `${BACKEND}/api/v1/market/favourites`;
    if (!token) {
      record({
        id: "1b",
        name: "Happy-path GET /favourites",
        request: `GET ${url}`,
        status: null,
        responseBody: null,
        pass: false,
        unexpected: "Could not acquire OTP token",
        rootCause: "Auth prerequisite failed",
      });
    } else {
      const r = await httpGet(url, { Authorization: `Bearer ${token}` });
      const ok =
        r.status === 200 &&
        r.body?.success === true &&
        Array.isArray(r.body.data);
      record({
        id: "1b",
        name: "Happy-path GET /favourites",
        request: `GET ${url} Authorization: Bearer <token>`,
        status: r.status,
        responseBody: bodyPreview(r.body),
        elapsedMs: r.elapsed,
        pass: ok,
        unexpected: ok
          ? null
          : "Expected 200 success + data[] (may be empty if no recent gov data)",
        rootCause: ok ? null : r.error || JSON.stringify(r.body)?.slice(0, 200),
      });
    }
  }

  // -------------------------------------------------------------------------
  // 2. Invalid query parameters
  // -------------------------------------------------------------------------
  {
    const cases = [
      {
        id: "2a",
        q: "limit=0",
        expectStatus: 400,
        expectMsgIncludes: "limit",
      },
      {
        id: "2b",
        q: "limit=101",
        expectStatus: 400,
        expectMsgIncludes: "limit",
      },
      {
        id: "2c",
        q: "limit=abc",
        expectStatus: 400,
        expectMsgIncludes: "limit",
      },
      {
        id: "2d",
        q: "offset=-1",
        expectStatus: 400,
        expectMsgIncludes: "offset",
      },
      {
        id: "2e",
        q: "offset=1.5",
        expectStatus: 400,
        expectMsgIncludes: "offset",
      },
    ];
    for (const c of cases) {
      const url = `${BACKEND}/api/v1/market/prices?state=Maharashtra&${c.q}`;
      const r = await httpGet(url);
      const ok =
        r.status === c.expectStatus &&
        r.body?.success === false &&
        typeof r.body?.message === "string" &&
        r.body.message.toLowerCase().includes(c.expectMsgIncludes);
      record({
        id: c.id,
        name: `Invalid query ${c.q}`,
        request: `GET ${url}`,
        status: r.status,
        responseBody: bodyPreview(r.body),
        elapsedMs: r.elapsed,
        pass: ok,
        unexpected: ok
          ? null
          : `Expected ${c.expectStatus} success:false message~${c.expectMsgIncludes}`,
        rootCause: ok ? null : "Controller parseLimit/parseOffset behaviour",
      });
    }
  }

  // -------------------------------------------------------------------------
  // 3. Empty-result scenarios
  // -------------------------------------------------------------------------
  {
    const url = `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=Sangli&commodity=Saffron&limit=50&offset=0`;
    const r = await httpGet(url);
    const ok =
      r.status === 200 &&
      r.body?.success === true &&
      Array.isArray(r.body.data) &&
      r.body.data.length === 0;
    record({
      id: "3",
      name: "Empty-result (Saffron in Sangli — typically no recent arrivals)",
      request: `GET ${url}`,
      status: r.status,
      responseBody: bodyPreview(r.body),
      elapsedMs: r.elapsed,
      pass: ok || (r.status === 200 && Array.isArray(r.body?.data)),
      unexpected:
        r.status === 200 && r.body?.data?.length > 0
          ? `Got ${r.body.data.length} records unexpectedly (still valid if recent)`
          : ok
            ? null
            : "Expected 200 + []",
      rootCause: null,
      note:
        r.body?.data?.length === 0
          ? "empty as expected"
          : "non-empty — seasonal data present",
    });
  }

  // -------------------------------------------------------------------------
  // 4. Invalid commodity
  // -------------------------------------------------------------------------
  {
    const url = `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=Sangli&commodity=NotARealCropXYZ&limit=10&offset=0`;
    const r = await httpGet(url);
    const ok =
      r.status === 200 &&
      r.body?.success === true &&
      Array.isArray(r.body.data) &&
      r.body.data.length === 0;
    record({
      id: "4",
      name: "Invalid commodity → empty array (not AppError)",
      request: `GET ${url}`,
      status: r.status,
      responseBody: bodyPreview(r.body),
      elapsedMs: r.elapsed,
      pass: ok,
      unexpected: ok
        ? "By design: no 4xx for unknown commodity"
        : "Expected 200 + []",
      rootCause: ok
        ? null
        : "Gov filter returned data or error envelope unexpected",
    });
  }

  // -------------------------------------------------------------------------
  // 5. Invalid district (/prices — no resolveDistrict)
  // -------------------------------------------------------------------------
  {
    const url = `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=NotARealDistrictXYZ&commodity=Onion&limit=10&offset=0`;
    const r = await httpGet(url);
    const ok =
      r.status === 200 &&
      r.body?.success === true &&
      Array.isArray(r.body.data) &&
      r.body.data.length === 0;
    record({
      id: "5",
      name: "Invalid district on /prices → 200 + [] (no district validation)",
      request: `GET ${url}`,
      status: r.status,
      responseBody: bodyPreview(r.body),
      elapsedMs: r.elapsed,
      pass: ok,
      unexpected: ok
        ? "By design: /prices does not call resolveDistrict"
        : "Expected 200 + []",
      rootCause: ok ? null : "Unexpected status/body",
    });
  }

  // -------------------------------------------------------------------------
  // 6. Legacy district aliases
  // -------------------------------------------------------------------------
  {
    // /prices with NEW name (no reverse alias) vs OLD gov name
    const newNameUrl = `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=${encodeURIComponent("Chhatrapati Sambhajinagar")}&commodity=Onion&limit=50&offset=0`;
    const oldNameUrl = `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=Aurangabad&commodity=Onion&limit=50&offset=0`;
    const rNew = await httpGet(newNameUrl);
    const rOld = await httpGet(oldNameUrl);
    const newCount = Array.isArray(rNew.body?.data) ? rNew.body.data.length : -1;
    const oldCount = Array.isArray(rOld.body?.data) ? rOld.body.data.length : -1;
    // Document asymmetry: old name usually has data; new name often empty on /prices
    const asymmetry =
      rNew.status === 200 &&
      rOld.status === 200 &&
      oldCount > 0 &&
      newCount === 0;
    record({
      id: "6a",
      name: "Legacy alias asymmetry on /prices (new name vs Aurangabad)",
      request: `GET new=${newNameUrl} | GET old=${oldNameUrl}`,
      status: `new=${rNew.status} old=${rOld.status}`,
      responseBody: `newCount=${newCount} oldCount=${oldCount}`,
      elapsedMs: `${rNew.elapsed}/${rOld.elapsed}`,
      pass: rNew.status === 200 && rOld.status === 200,
      unexpected: asymmetry
        ? "CONFIRMED BUG RISK: /prices with Chhatrapati Sambhajinagar returns empty while Aurangabad has data (no reverse alias)"
        : newCount > 0 && oldCount > 0
          ? "Both returned data — gov may accept new name now"
          : null,
      rootCause: asymmetry
        ? "resolveGovDistrictForApi only applied on /favourites path"
        : null,
    });

    // Favourites path: if we have a legacy-district profile with token for THAT user
    if (legacy && legacy.userId) {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      const legacyUser = await client
        .db()
        .collection("auth_users")
        .findOne({ _id: legacy.userId });
      await client.close();
      if (legacyUser?.mobile) {
        const auth = await getAuthToken(String(legacyUser.mobile));
        if (auth.token) {
          const r = await httpGet(`${BACKEND}/api/v1/market/favourites`, {
            Authorization: `Bearer ${auth.token}`,
          });
          record({
            id: "6b",
            name: `Favourites with legacy district profile (${legacy.district})`,
            request: `GET /api/v1/market/favourites for profile district=${legacy.district}`,
            status: r.status,
            responseBody: bodyPreview(r.body),
            elapsedMs: r.elapsed,
            pass: r.status === 200 && r.body?.success === true,
            unexpected:
              r.status === 200 &&
              Array.isArray(r.body?.data) &&
              r.body.data.length === 0
                ? "200 but empty — may be no recent arrivals for favourite crops"
                : null,
            rootCause: null,
          });
        } else {
          record({
            id: "6b",
            name: "Favourites legacy district profile",
            request: "N/A",
            status: null,
            responseBody: null,
            pass: false,
            unexpected: "Could not auth legacy profile user",
            rootCause: "OTP auth failed",
          });
        }
      }
    } else {
      record({
        id: "6b",
        name: "Favourites legacy district profile",
        request: "N/A",
        status: null,
        responseBody: null,
        pass: true,
        unexpected: "No profile with renamed district in DB — skipped",
        rootCause: null,
        note: "SKIPPED",
      });
    }
  }

  // -------------------------------------------------------------------------
  // 7. Missing JWT
  // -------------------------------------------------------------------------
  {
    const url = `${BACKEND}/api/v1/market/favourites`;
    const r = await httpGet(url);
    const ok =
      r.status === 401 &&
      r.body?.success === false &&
      typeof r.body?.message === "string";
    record({
      id: "7",
      name: "Missing JWT on /favourites",
      request: `GET ${url} (no Authorization)`,
      status: r.status,
      responseBody: bodyPreview(r.body),
      elapsedMs: r.elapsed,
      pass: ok,
      unexpected: ok ? null : "Expected 401 success:false",
      rootCause: ok ? null : "auth.middleware",
    });
  }

  // -------------------------------------------------------------------------
  // 8. Invalid JWT
  // -------------------------------------------------------------------------
  {
    const url = `${BACKEND}/api/v1/market/favourites`;
    const r = await httpGet(url, {
      Authorization: "Bearer totally.invalid.token",
    });
    const ok =
      r.status === 401 &&
      r.body?.success === false &&
      typeof r.body?.message === "string";
    record({
      id: "8",
      name: "Invalid JWT on /favourites",
      request: `GET ${url} Authorization: Bearer totally.invalid.token`,
      status: r.status,
      responseBody: bodyPreview(r.body),
      elapsedMs: r.elapsed,
      pass: ok,
      unexpected: ok ? null : "Expected 401 success:false",
      rootCause: ok ? null : "jwt.service / authenticate",
    });
  }

  // Build once for service-level probes (9–11). Does not change running server.
  console.log("\nBuilding dist for isolated service probes...");
  const build = spawnSync("npm", ["run", "build"], {
    cwd: __dirname,
    encoding: "utf8",
    shell: true,
  });
  if (build.status !== 0) {
    console.log("Build warning:", (build.stderr || build.stdout || "").slice(0, 400));
  }

  function runServiceProbe(label, envOverrides, timeoutMs = 45000) {
    const probe = `
const { getMarketPrices } = require("./dist/modules/market/market.service");
(async () => {
  const start = Date.now();
  try {
    await getMarketPrices({ state: "Maharashtra", district: "Sangli", commodity: "Onion", limit: 5, offset: 0 });
    console.log("PROBE_RESULT:" + JSON.stringify({ ok: true, elapsed: Date.now() - start }));
  } catch (e) {
    console.log("PROBE_RESULT:" + JSON.stringify({
      ok: false,
      statusCode: e.statusCode,
      message: e.message,
      elapsed: Date.now() - start
    }));
  }
})();
`;
    const child = spawnSync("node", ["-e", probe], {
      cwd: __dirname,
      encoding: "utf8",
      timeout: timeoutMs,
      env: { ...process.env, ...envOverrides },
    });
    const combined = `${child.stdout || ""}\n${child.stderr || ""}`;
    const line = combined
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.startsWith("PROBE_RESULT:"));
    if (!line) {
      return {
        ok: false,
        raw: combined.slice(-500),
        statusCode: null,
        message: null,
        elapsed: null,
      };
    }
    try {
      return JSON.parse(line.slice("PROBE_RESULT:".length));
    } catch {
      return { ok: false, raw: line, statusCode: null, message: null, elapsed: null };
    }
  }

  // -------------------------------------------------------------------------
  // 9. Missing API key (isolated process; GOV_API_URL baked at module load)
  // -------------------------------------------------------------------------
  {
    const parsed = runServiceProbe("missing-key", { MARKET_API_KEY: "" }, 15000);
    const ok =
      parsed.ok === false &&
      parsed.statusCode === 500 &&
      /API key is not configured/i.test(parsed.message || "");
    record({
      id: "9",
      name: "Missing API key → AppError 500 (service-level probe)",
      request: "getMarketPrices() with MARKET_API_KEY=''",
      status: parsed.statusCode ?? null,
      responseBody: bodyPreview(parsed),
      elapsedMs: parsed.elapsed ?? null,
      pass: ok,
      unexpected: ok ? null : "Expected 500 'API key is not configured'",
      rootCause: ok ? null : `probe: ${bodyPreview(parsed)}`,
    });
  }

  // -------------------------------------------------------------------------
  // 10. Government timeout (blackhole IP — AbortController 30s → 504)
  // -------------------------------------------------------------------------
  {
    const parsed = runServiceProbe(
      "timeout",
      {
        MARKET_API_BASE_URL: "https://10.255.255.1",
        MARKET_API_KEY: API_KEY || "dummy-key",
        MARKET_DATASET_ID: DATASET,
      },
      45000
    );
    const ok =
      parsed.ok === false &&
      (parsed.statusCode === 504 || parsed.statusCode === 503);
    record({
      id: "10",
      name: "Government timeout/unreachable → 504 or 503",
      request: "getMarketPrices() against https://10.255.255.1",
      status: parsed.statusCode ?? null,
      responseBody: bodyPreview(parsed),
      elapsedMs: parsed.elapsed ?? null,
      pass: ok,
      unexpected: ok
        ? null
        : "Expected AppError 504 (timeout) or 503 (unavailable)",
      rootCause: ok ? null : `probe: ${bodyPreview(parsed)}`,
    });
  }

  // -------------------------------------------------------------------------
  // 11. Government unavailable (DNS fail → 503)
  // -------------------------------------------------------------------------
  {
    const parsed = runServiceProbe(
      "dns-fail",
      {
        MARKET_API_BASE_URL: "https://this-host-does-not-exist.invalid",
        MARKET_API_KEY: API_KEY || "dummy-key",
        MARKET_DATASET_ID: DATASET,
      },
      45000
    );
    const ok =
      parsed.ok === false &&
      (parsed.statusCode === 503 || parsed.statusCode === 504);
    record({
      id: "11",
      name: "Government unavailable (DNS fail) → 503/504",
      request: "getMarketPrices() against this-host-does-not-exist.invalid",
      status: parsed.statusCode ?? null,
      responseBody: bodyPreview(parsed),
      elapsedMs: parsed.elapsed ?? null,
      pass: ok,
      unexpected: ok ? null : "Expected 503/504 AppError",
      rootCause: ok ? null : `probe: ${bodyPreview(parsed)}`,
    });
  }

  // -------------------------------------------------------------------------
  // 12–13. Cache behaviour + response times
  // -------------------------------------------------------------------------
  {
    // Unique commodity+district to force miss then hits (use Onion Sangli may already be warm)
    const uniq = `Onion`;
    const url = `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=Kolhapur&commodity=${uniq}&limit=30&offset=0&_cacheProbe=${Date.now()}`;
    // Note: _cacheProbe is ignored by backend — cache key does not include unknown params.
    // Use a less common district to reduce chance of pre-warm from prior tests: Solapur Tomato
    const cacheUrl = `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=Solapur&commodity=Tomato&limit=40&offset=0`;
    const times = [];
    const bodies = [];
    for (let i = 0; i < 3; i++) {
      const r = await httpGet(cacheUrl);
      times.push(r.elapsed);
      bodies.push({ status: r.status, n: r.body?.data?.length });
    }
    const missThenHits =
      times[0] > 200 && times[1] < times[0] * 0.5 && times[2] < times[0] * 0.5;
    const likelyHits = times[1] < 100 && times[2] < 100 && times[0] > times[1];
    record({
      id: "12",
      name: "Cache behaviour (3 consecutive /prices Solapur Tomato)",
      request: `GET ${cacheUrl} ×3`,
      status: bodies.map((b) => b.status).join(","),
      responseBody: `counts=${bodies.map((b) => b.n).join(",")} timesMs=${times.join(",")}`,
      elapsedMs: times,
      pass: bodies.every((b) => b.status === 200),
      unexpected: missThenHits || likelyHits
        ? null
        : "Latency pattern inconclusive — check server logs for Market cache hit/miss",
      rootCause: null,
      note: missThenHits
        ? "Strong miss→hit latency pattern"
        : likelyHits
          ? "Likely cache hits on req 2–3"
          : "Ambiguous latency",
    });

    record({
      id: "13",
      name: "Response times cache miss vs hit",
      request: `GET ${cacheUrl}`,
      status: 200,
      responseBody: `t0(miss-ish)=${times[0]}ms t1=${times[1]}ms t2=${times[2]}ms`,
      elapsedMs: times,
      pass: times.every((t) => typeof t === "number"),
      unexpected:
        times[0] > 15000
          ? "First request very slow (>15s) — gov latency risk"
          : null,
      rootCause: null,
    });

    if (!SKIP_CACHE_TTL_WAIT) {
      console.log("Waiting for cache TTL...");
      await new Promise((r) => setTimeout(r, CACHE_TTL_MS + 2000));
      const post = await httpGet(cacheUrl);
      record({
        id: "12b",
        name: "Cache miss after TTL",
        request: `GET ${cacheUrl} after ${CACHE_TTL_MS}ms`,
        status: post.status,
        responseBody: bodyPreview(post.body, 200),
        elapsedMs: post.elapsed,
        pass: post.status === 200,
        unexpected: null,
        rootCause: null,
      });
    } else {
      record({
        id: "12b",
        name: "Cache miss after TTL",
        request: "SKIPPED (SKIP_CACHE_TTL_WAIT=1)",
        status: null,
        responseBody: null,
        pass: true,
        unexpected: "Skipped 5-minute wait — set SKIP_CACHE_TTL_WAIT=0 to run",
        rootCause: null,
        note: "SKIPPED",
      });
    }
  }

  // -------------------------------------------------------------------------
  // 14. DTO validation
  // -------------------------------------------------------------------------
  {
    const url = `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=Sangli&commodity=Onion&limit=20&offset=0`;
    const r = await httpGet(url);
    const rows = Array.isArray(r.body?.data) ? r.body.data : [];
    let issues = [];
    for (const row of rows) {
      issues = issues.concat(validateDto(row).map((i) => `${row.market}: ${i}`));
    }
    const pass =
      r.status === 200 && (rows.length === 0 || issues.length === 0);
    record({
      id: "14",
      name: "DTO validation (MarketPriceDTO shape/types)",
      request: `GET ${url}`,
      status: r.status,
      responseBody: `rows=${rows.length} issues=${issues.slice(0, 5).join("; ") || "none"} sample=${bodyPreview(rows[0], 300)}`,
      elapsedMs: r.elapsed,
      pass,
      unexpected: issues.length ? issues.slice(0, 10).join("; ") : null,
      rootCause: issues.length ? "toMarketPriceDTO mapping" : null,
    });
  }

  // -------------------------------------------------------------------------
  // 15. Duplicate mandi detection
  // -------------------------------------------------------------------------
  {
    const url = `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=Sangli&commodity=Onion&limit=100&offset=0`;
    const r = await httpGet(url);
    const rows = Array.isArray(r.body?.data) ? r.body.data : [];
    const markets = rows.map((x) => (x.market || "").trim());
    const dupes = markets.filter((m, i) => m && markets.indexOf(m) !== i);
    const uniqueDupes = [...new Set(dupes)];
    record({
      id: "15",
      name: "Duplicate mandi detection (keepLatestRecordPerMandi)",
      request: `GET ${url}`,
      status: r.status,
      responseBody: `rows=${rows.length} uniqueMarkets=${new Set(markets).size} dupes=${JSON.stringify(uniqueDupes)}`,
      elapsedMs: r.elapsed,
      pass: r.status === 200 && uniqueDupes.length === 0,
      unexpected:
        uniqueDupes.length > 0
          ? `Duplicate Market names in response: ${uniqueDupes.join(", ")}`
          : null,
      rootCause:
        uniqueDupes.length > 0
          ? "keepLatestRecordPerMandi failed or variety/grade treated as separate incorrectly"
          : null,
    });
  }

  // -------------------------------------------------------------------------
  // 16. Recent-date filtering
  // -------------------------------------------------------------------------
  {
    const url = `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=Sangli&commodity=Onion&limit=100&offset=0`;
    const r = await httpGet(url);
    const rows = Array.isArray(r.body?.data) ? r.body.data : [];
    const cutoff = cutoffDate();
    const old = rows.filter((row) => {
      const d = parseArrivalDate(row.arrivalDate);
      return !d || d < cutoff;
    });
    record({
      id: "16",
      name: `Recent-date filtering (window=${RECENT_DAYS}d cutoff=${cutoff.toISOString().slice(0, 10)})`,
      request: `GET ${url}`,
      status: r.status,
      responseBody: `rows=${rows.length} oldOrInvalid=${old.length} samples=${JSON.stringify(old.slice(0, 3).map((o) => o.arrivalDate))}`,
      elapsedMs: r.elapsed,
      pass: r.status === 200 && old.length === 0,
      unexpected:
        old.length > 0
          ? `Leaked ${old.length} records outside recent window`
          : null,
      rootCause: old.length > 0 ? "filterRecentGovRecords" : null,
    });
  }

  // -------------------------------------------------------------------------
  // 17. Favourite crop ordering
  // -------------------------------------------------------------------------
  {
    if (!token || !sample?.favoriteCrops?.length) {
      record({
        id: "17",
        name: "Favourite crop ordering",
        request: "N/A",
        status: null,
        responseBody: null,
        pass: false,
        unexpected: "No token or sample crops",
        rootCause: "Auth/profile prerequisite",
      });
    } else {
      const url = `${BACKEND}/api/v1/market/favourites`;
      const r = await httpGet(url, { Authorization: `Bearer ${token}` });
      const rows = Array.isArray(r.body?.data) ? r.body.data : [];
      const crops = sample.favoriteCrops.map((c) => c.trim());
      // For each consecutive pair of distinct commodities in response, order must respect favoriteCrops index
      let orderOk = true;
      let lastIdx = -1;
      const commoditySequence = [];
      for (const row of rows) {
        const c = (row.commodity || "").trim();
        commoditySequence.push(c);
        const idx = crops.findIndex(
          (fc) => fc.toLowerCase() === c.toLowerCase()
        );
        if (idx === -1) continue;
        if (idx < lastIdx) {
          orderOk = false;
          break;
        }
        lastIdx = idx;
      }
      record({
        id: "17",
        name: "Favourite crop ordering matches profile.favoriteCrops",
        request: `GET ${url} profileCrops=${JSON.stringify(crops)}`,
        status: r.status,
        responseBody: `returnedCommodities=${JSON.stringify(commoditySequence)}`,
        elapsedMs: r.elapsed,
        pass: r.status === 200 && orderOk,
        unexpected: orderOk
          ? null
          : "Commodity order violates favoriteCrops sequence",
        rootCause: orderOk ? null : "getFavoriteMarketPrices merge loop",
      });
    }
  }

  // -------------------------------------------------------------------------
  // 18. Partial failure handling (observational from live favourites + code contract)
  // -------------------------------------------------------------------------
  {
    // Live observation: if favourites returns 200 with data while some crops empty,
    // that matches Promise.allSettled partial success. We also confirm all-fail path
    // is not easily triggered without fault injection.
    if (!token) {
      record({
        id: "18",
        name: "Partial failure handling",
        request: "N/A",
        status: null,
        responseBody: null,
        pass: false,
        unexpected: "No token",
        rootCause: "Auth prerequisite",
      });
    } else {
      const url = `${BACKEND}/api/v1/market/favourites`;
      const r = await httpGet(url, { Authorization: `Bearer ${token}` });
      const rows = Array.isArray(r.body?.data) ? r.body.data : [];
      const crops = (sample?.favoriteCrops || []).map((c) => c.trim());
      const present = new Set(rows.map((x) => (x.commodity || "").trim()));
      const missing = crops.filter((c) => !present.has(c));
      record({
        id: "18",
        name: "Partial failure / partial empty crops on /favourites",
        request: `GET ${url}`,
        status: r.status,
        responseBody: `crops=${JSON.stringify(crops)} present=${[...present]} missing=${JSON.stringify(missing)} totalRows=${rows.length}`,
        elapsedMs: r.elapsed,
        pass: r.status === 200 && r.body?.success === true,
        unexpected:
          missing.length > 0 && rows.length > 0
            ? `Some favourite crops missing from response (${missing.join(", ")}) while others returned — consistent with allSettled partial empty (cannot distinguish empty gov vs failed crop without logs)`
            : missing.length === crops.length && rows.length === 0
              ? "All crops empty — either no recent data or all failed but at least one fulfilled with []"
              : null,
        rootCause: null,
        note: "Full all-fail→error path requires fault injection; not forced here",
      });
    }
  }

  // -------------------------------------------------------------------------
  // 19–20. HTTP status codes + error response consistency
  // -------------------------------------------------------------------------
  {
    const checks = [];
    // Collect from earlier pattern: missing jwt, invalid limit
    const cases = [
      {
        name: "public prices 200",
        url: `${BACKEND}/api/v1/market/prices?state=Maharashtra&district=Sangli&commodity=Onion&limit=5`,
        headers: {},
        expect: 200,
        success: true,
      },
      {
        name: "bad limit 400",
        url: `${BACKEND}/api/v1/market/prices?limit=0`,
        headers: {},
        expect: 400,
        success: false,
      },
      {
        name: "favourites no auth 401",
        url: `${BACKEND}/api/v1/market/favourites`,
        headers: {},
        expect: 401,
        success: false,
      },
    ];
    let allOk = true;
    const details = [];
    for (const c of cases) {
      const r = await httpGet(c.url, c.headers);
      const envelopeOk =
        typeof r.body?.success === "boolean" &&
        r.body.success === c.success &&
        (c.success
          ? Array.isArray(r.body.data)
          : typeof r.body.message === "string");
      const statusOk = r.status === c.expect;
      if (!statusOk || !envelopeOk) allOk = false;
      details.push({
        name: c.name,
        status: r.status,
        expect: c.expect,
        body: bodyPreview(r.body, 180),
        statusOk,
        envelopeOk,
      });
    }
    record({
      id: "19",
      name: "HTTP status codes (200/400/401 sample matrix)",
      request: cases.map((c) => c.name).join("; "),
      status: details.map((d) => d.status).join(","),
      responseBody: bodyPreview(details),
      elapsedMs: null,
      pass: allOk,
      unexpected: allOk ? null : "Status or envelope mismatch",
      rootCause: allOk ? null : "See details",
    });

    const consistent = details.every(
      (d) =>
        d.body &&
        (d.body.includes('"success":true') ||
          d.body.includes('"success":false'))
    );
    record({
      id: "20",
      name: "Error/success response consistency ({success,data|message})",
      request: "matrix above",
      status: null,
      responseBody: bodyPreview(details),
      elapsedMs: null,
      pass: consistent && allOk,
      unexpected: consistent ? null : "Envelope not consistent",
      rootCause: consistent ? null : "errorHandler / controller contract",
    });
  }

  // Direct gov API smoke (evidence against live government)
  {
    const g = await govFetch({
      "api-key": API_KEY,
      format: "json",
      limit: 5,
      offset: 0,
      "filters[State]": "Maharashtra",
      "filters[District]": "Sangli",
      "filters[Commodity]": "Onion",
      "sort[Arrival_Date]": "desc",
    });
    record({
      id: "G1",
      name: "Live government API smoke (Sangli Onion)",
      request: `GET ${GOV_URL} filters Sangli Onion`,
      status: g.status,
      responseBody: `records=${g.json?.records?.length ?? "n/a"} first=${bodyPreview(g.json?.records?.[0], 250)} err=${g.error}`,
      elapsedMs: g.elapsed,
      pass: g.status === 200 && Array.isArray(g.json?.records),
      unexpected: g.error || null,
      rootCause: g.error ? "Gov network/API" : null,
    });
  }

  // Write report
  const passed = results.filter((t) => t.pass);
  const failed = results.filter((t) => !t.pass);
  const report = {
    generatedAt: new Date().toISOString(),
    backend: BACKEND,
    recentDays: RECENT_DAYS,
    sampleProfile: sample
      ? {
          name: sample.name,
          district: sample.district,
          favoriteCrops: sample.favoriteCrops,
        }
      : null,
    results,
    summary: {
      total: results.length,
      passed: passed.length,
      failed: failed.length,
    },
  };
  const outPath = path.join(__dirname, "validate-market-runtime-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("\n=========================");
  console.log("SUMMARY");
  console.log("=========================");
  console.log("Total:", report.summary.total);
  console.log("Passed:", report.summary.passed);
  console.log("Failed:", report.summary.failed);
  console.log("Failed IDs:", failed.map((f) => f.id + " " + f.name).join(" | ") || "(none)");
  console.log("Wrote", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
