/**
 * Optimize Phase 1 gov fetch — live benchmarks (no production imports required).
 * Run: node scripts/optimize-district-fetch-benchmark.cjs
 */
const fs = require("fs");
const path = require("path");
const dns = require("dns").promises;
const net = require("net");
const tls = require("tls");
const { performance } = require("perf_hooks");

const ROOT = path.join(__dirname, "..");
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && process.env[m[1].trim()] === undefined) {
    process.env[m[1].trim()] = m[2].trim();
  }
}

const API_KEY = process.env.MARKET_API_KEY;
const BASE = process.env.MARKET_API_BASE_URL || "https://api.data.gov.in";
const DATASET =
  process.env.MARKET_DATASET_ID || "35985678-0d79-46b4-9ed6-6f13308a1d24";
const GOV = `${BASE}/resource/${DATASET}`;
const HOST = new URL(BASE).hostname;
const STATE = "Maharashtra";
const DISTRICT = process.env.BENCH_DISTRICT || "Nashik";
const RECENT_DAYS = Number(process.env.MARKET_RECENT_DAYS) > 0
  ? Number(process.env.MARKET_RECENT_DAYS)
  : 20;
const FIELDS =
  "State,District,Market,Commodity,Variety,Grade,Arrival_Date,Min_Price,Max_Price,Modal_Price";

if (!API_KEY) {
  console.error("MARKET_API_KEY missing");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

function normalize(records) {
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - RECENT_DAYS);
  cutoff.setHours(0, 0, 0, 0);

  const recent = records.filter((r) => {
    const d = parseArrivalDate(r.Arrival_Date);
    return d && d >= cutoff;
  });

  const seen = new Set();
  const latest = [];
  for (const r of recent) {
    const market = (r.Market || "").trim();
    if (!market) continue;
    const key = `${String(r.Commodity || "").trim().toLowerCase()}|${market}`;
    if (seen.has(key)) continue;
    seen.add(key);
    latest.push(r);
  }

  const commodities = new Set(latest.map((r) => (r.Commodity || "").trim()).filter(Boolean));
  return {
    recentCount: recent.length,
    normalizedCount: latest.length,
    commodityCount: commodities.size,
    commodities: [...commodities].sort(),
    oldestRecent: recent.length
      ? recent.map((r) => r.Arrival_Date).filter(Boolean).slice(-1)[0]
      : null,
    newest: records[0]?.Arrival_Date ?? null,
  };
}

function buildUrl(extra) {
  const url = new URL(GOV);
  url.searchParams.append("api-key", API_KEY);
  url.searchParams.append("format", "json");
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
  }
  return url.toString();
}

async function fetchJson(extra, label, attempts = 4) {
  const url = buildUrl(extra);
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const t0 = performance.now();
      const res = await fetch(url);
      const tHeaders = performance.now();
      const text = await res.text();
      const tBody = performance.now();
      let json = null;
      const tParse0 = performance.now();
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
      const tParse1 = performance.now();
      const records = Array.isArray(json?.records) ? json.records : [];
      const tNorm0 = performance.now();
      const norm = normalize(records);
      const tNorm1 = performance.now();

      return {
        label,
        status: res.status,
        ok: res.ok,
        bytes: Buffer.byteLength(text, "utf8"),
        rawCount: records.length,
        totalMs: tBody - t0,
        ttfbMs: tHeaders - t0,
        downloadMs: tBody - tHeaders,
        parseMs: tParse1 - tParse0,
        normalizeMs: tNorm1 - tNorm0,
        attempt,
        ...norm,
        message: json?.message || null,
      };
    } catch (e) {
      lastErr = e;
      console.log(`  ${label} attempt ${attempt}/${attempts} failed: ${e.message}`);
      await sleep(2000 * attempt);
    }
  }
  throw lastErr;
}

async function connectionPhases() {
  const row = { dnsMs: null, tcpMs: null, tlsMs: null, totalMs: null, error: null };
  const t0 = performance.now();
  try {
    const d0 = performance.now();
    const { address } = await dns.lookup(HOST);
    row.dnsMs = performance.now() - d0;
    await new Promise((resolve, reject) => {
      const tcp0 = performance.now();
      const socket = net.connect({ host: address, port: 443 }, () => {
        row.tcpMs = performance.now() - tcp0;
        const tls0 = performance.now();
        const secure = tls.connect({ socket, servername: HOST }, () => {
          row.tlsMs = performance.now() - tls0;
          row.totalMs = performance.now() - t0;
          secure.end();
          resolve();
        });
        secure.on("error", reject);
      });
      socket.on("error", reject);
      socket.setTimeout(15000, () => socket.destroy(new Error("tcp timeout")));
    });
  } catch (e) {
    row.error = e instanceof Error ? e.message : String(e);
    row.totalMs = performance.now() - t0;
  }
  return row;
}

function fmtDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

async function main() {
  console.log(`Benchmark district=${DISTRICT} recentDays=${RECENT_DAYS}`);
  const report = { meta: { district: DISTRICT, recentDays: RECENT_DAYS, at: new Date().toISOString() } };

  // Warm connection (retry)
  for (let i = 0; i < 5; i += 1) {
    try {
      await fetchJson({
        limit: 10,
        offset: 0,
        fields: FIELDS,
        "filters[State]": STATE,
        "filters[District]": DISTRICT,
        "sort[Arrival_Date]": "desc",
      }, "warmup");
      console.log("warmup ok");
      break;
    } catch (e) {
      console.log("warmup failed", e.message);
      await sleep(3000);
    }
  }
  await sleep(1500);

  try {
    report.connection = await connectionPhases();
  } catch (e) {
    report.connection = { error: String(e.message || e) };
  }
  console.log("connection", report.connection);

  // CHECK 1 — limits
  const limits = [100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000];
  report.limits = [];
  let baseline = null;
  for (const limit of limits) {
    await sleep(1200);
    const r = await fetchJson({
      limit,
      offset: 0,
      fields: FIELDS,
      "filters[State]": STATE,
      "filters[District]": DISTRICT,
      "sort[Arrival_Date]": "desc",
    }, `limit-${limit}`);
    report.limits.push(r);
    console.log(
      `limit=${limit}: status=${r.status} raw=${r.rawCount} norm=${r.normalizedCount} crops=${r.commodityCount} bytes=${r.bytes} totalMs=${r.totalMs.toFixed(0)} ttfb=${r.ttfbMs.toFixed(0)} download=${r.downloadMs.toFixed(0)} parse=${r.parseMs.toFixed(0)}`
    );
    if (limit === 5000) baseline = r;
  }

  if (baseline) {
    const safe = [];
    for (const r of report.limits) {
      const sameCrops = r.commodityCount === baseline.commodityCount;
      const sameNorm = r.normalizedCount === baseline.normalizedCount;
      const cropCoverage =
        baseline.commodityCount > 0
          ? r.commodities.filter((c) => baseline.commodities.includes(c)).length /
            baseline.commodityCount
          : 0;
      safe.push({
        limit: Number(r.label.replace("limit-", "")),
        commodityCount: r.commodityCount,
        normalizedCount: r.normalizedCount,
        sameCropsAs5000: sameCrops,
        sameNormAs5000: sameNorm,
        cropCoveragePct: Math.round(cropCoverage * 1000) / 10,
        bytes: r.bytes,
        totalMs: r.totalMs,
      });
    }
    report.limitSafety = safe;
    const smallestFull = [...safe].reverse().find((s) => s.sameCropsAs5000 && s.sameNormAs5000)
      || [...safe].find((s) => s.sameCropsAs5000);
    report.recommendedLimit = smallestFull
      ? {
          smallestEquivalent: smallestFull.limit,
          withBuffer: Math.min(5000, Math.max(smallestFull.limit * 2, smallestFull.limit + 250)),
        }
      : { smallestEquivalent: 5000, withBuffer: 5000 };
    console.log("recommended", report.recommendedLimit);
  }

  // CHECK 2 — Arrival_Date filters
  await sleep(2000);
  const today = new Date();
  report.dateFilters = [];
  const dateTrials = [
    { name: "exact-today", params: { "filters[Arrival_Date]": fmtDate(today) } },
    {
      name: "exact-7d-ago",
      params: {
        "filters[Arrival_Date]": fmtDate(new Date(today.getTime() - 7 * 86400000)),
      },
    },
    { name: "filters[Arrival_Date][gte]", params: { "filters[Arrival_Date][gte]": fmtDate(new Date(today.getTime() - 7 * 86400000)) } },
    { name: "filters[Arrival_Date][from]", params: { "filters[Arrival_Date][from]": fmtDate(new Date(today.getTime() - 7 * 86400000)) } },
    { name: "from_date", params: { from_date: fmtDate(new Date(today.getTime() - 7 * 86400000)) } },
    { name: "filters[updated_date]", params: { "filters[updated_date]": fmtDate(today) } },
  ];

  for (const trial of dateTrials) {
    await sleep(1200);
    try {
      const r = await fetchJson({
        limit: 500,
        offset: 0,
        fields: FIELDS,
        "filters[State]": STATE,
        "filters[District]": DISTRICT,
        "sort[Arrival_Date]": "desc",
        ...trial.params,
      }, trial.name);
      report.dateFilters.push({
        name: trial.name,
        status: r.status,
        rawCount: r.rawCount,
        commodityCount: r.commodityCount,
        bytes: r.bytes,
        totalMs: r.totalMs,
        newest: r.newest,
        ok: r.ok,
      });
      console.log(
        `dateFilter ${trial.name}: status=${r.status} raw=${r.rawCount} crops=${r.commodityCount} ms=${r.totalMs.toFixed(0)} newest=${r.newest}`
      );
    } catch (e) {
      report.dateFilters.push({ name: trial.name, error: String(e.message || e) });
      console.log(`dateFilter ${trial.name}: ERROR`, e.message);
    }
  }

  // CHECK 3 — fields projection
  await sleep(1500);
  report.fields = [];
  const fieldSets = [
    { name: "current", fields: FIELDS },
    {
      name: "minimal-dto",
      fields:
        "State,District,Market,Commodity,Variety,Grade,Arrival_Date,Min_Price,Max_Price,Modal_Price",
    },
    {
      name: "without-variety-grade",
      fields: "State,District,Market,Commodity,Arrival_Date,Min_Price,Max_Price,Modal_Price",
    },
    { name: "no-fields", fields: undefined },
  ];
  for (const fsSpec of fieldSets) {
    await sleep(1000);
    const extra = {
      limit: 1000,
      offset: 0,
      "filters[State]": STATE,
      "filters[District]": DISTRICT,
      "sort[Arrival_Date]": "desc",
    };
    if (fsSpec.fields) extra.fields = fsSpec.fields;
    const r = await fetchJson(extra, fsSpec.name);
    const sampleKeys = r.rawCount
      ? Object.keys(
          (await (async () => {
            // re-parse not available; approximate from known
            return {};
          })())
        )
      : [];
    report.fields.push({
      name: fsSpec.name,
      status: r.status,
      bytes: r.bytes,
      rawCount: r.rawCount,
      totalMs: r.totalMs,
      commodityCount: r.commodityCount,
    });
    console.log(
      `fields ${fsSpec.name}: status=${r.status} bytes=${r.bytes} raw=${r.rawCount} ms=${r.totalMs.toFixed(0)}`
    );
  }

  // Sample keys for current fields
  await sleep(1000);
  const sample = await fetch(buildUrl({
    limit: 1,
    offset: 0,
    fields: FIELDS,
    "filters[State]": STATE,
    "filters[District]": DISTRICT,
    "sort[Arrival_Date]": "desc",
  }));
  const sampleJson = await sample.json();
  report.sampleRecordKeys = sampleJson.records?.[0]
    ? Object.keys(sampleJson.records[0])
    : [];

  const out = path.join(__dirname, "optimize-district-fetch-report.json");
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log("Wrote", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
