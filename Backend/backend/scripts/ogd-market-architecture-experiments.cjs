/**
 * OGD / AGMARKNET capability experiments for Market Intelligence architecture.
 * Does NOT modify production code.
 *
 * Run: node scripts/ogd-market-architecture-experiments.cjs
 * Output: scripts/ogd-market-architecture-report.json
 *
 * Rate-limit aware: pauses between phases; limited stress probe.
 */
const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");

const ROOT = path.join(__dirname, "..");
const envPath = path.join(ROOT, ".env");
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && process.env[m[1].trim()] === undefined) {
    process.env[m[1].trim()] = m[2].trim();
  }
}

const API_KEY = process.env.MARKET_API_KEY;
const BASE = process.env.MARKET_API_BASE_URL || "https://api.data.gov.in";
const DATASET =
  process.env.MARKET_DATASET_ID || "35985678-0d79-46b4-9ed6-6f13308a1d24";
const GOV_URL = `${BASE}/resource/${DATASET}`;

if (!API_KEY) {
  console.error("MARKET_API_KEY missing");
  process.exit(1);
}

const report = {
  meta: {
    startedAt: new Date().toISOString(),
    finishedAt: null,
    resourceUrl:
      "https://www.data.gov.in/resource/variety-wise-daily-market-prices-data-commodity",
    datasetId: DATASET,
    host: BASE,
  },
  tests: {},
  docsNotes: {},
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildUrl(params) {
  const url = new URL(GOV_URL);
  url.searchParams.append("api-key", API_KEY);
  url.searchParams.append("format", "json");
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    url.searchParams.append(k, String(v));
  }
  return url.toString();
}

async function request(params, { timeoutMs = 30000, label = "" } = {}) {
  const url = buildUrl(params);
  const start = performance.now();
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const headers = {};
    for (const [k, v] of res.headers.entries()) {
      if (/rate|limit|retry/i.test(k)) headers[k] = v;
    }
    const text = await res.text();
    const totalMs = performance.now() - start;
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    const records = Array.isArray(json?.records) ? json.records : null;
    const commodities = records
      ? [...new Set(records.map((r) => (r.Commodity || "").trim()).filter(Boolean))]
      : [];
    return {
      label,
      ok: res.ok,
      status: res.status,
      totalMs,
      bytes: Buffer.byteLength(text, "utf8"),
      recordCount: records ? records.length : null,
      total: json?.total ?? json?.count ?? null,
      limit: json?.limit ?? null,
      offset: json?.offset ?? null,
      commodities,
      commodityCount: commodities.length,
      sampleKeys: records?.[0] ? Object.keys(records[0]) : [],
      rateLimitHeaders: headers,
      message: json?.message || json?.error || null,
      exception: null,
    };
  } catch (error) {
    return {
      label,
      ok: false,
      status: null,
      totalMs: performance.now() - start,
      bytes: 0,
      recordCount: null,
      total: null,
      commodities: [],
      commodityCount: 0,
      sampleKeys: [],
      rateLimitHeaders: {},
      message: null,
      exception: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
  } finally {
    clearTimeout(tid);
  }
}

function log(msg) {
  console.log(msg);
}

async function main() {
  log("OGD architecture experiments starting…");

  // Warm-up with pause if needed
  await sleep(2000);

  // -------- TEST 1: district without commodity --------
  log("\n=== TEST 1: District without commodity (Nashik) ===");
  const t1 = await request({
    limit: 100,
    offset: 0,
    "filters[State]": "Maharashtra",
    "filters[District]": "Nashik",
    "sort[Arrival_Date]": "desc",
  }, { label: "district-no-commodity-limit100" });
  log(`  status=${t1.status} records=${t1.recordCount} commodities=${t1.commodityCount} bytes=${t1.bytes} ms=${t1.totalMs.toFixed(0)}`);
  log(`  commodities sample: ${t1.commodities.slice(0, 15).join(", ")}`);
  report.tests.test1_district_no_commodity = t1;

  await sleep(1500);

  // -------- TEST 2: with commodity --------
  log("\n=== TEST 2: Same district WITH Tomato ===");
  const t2 = await request({
    limit: 100,
    offset: 0,
    "filters[State]": "Maharashtra",
    "filters[District]": "Nashik",
    "filters[Commodity]": "Tomato",
    "sort[Arrival_Date]": "desc",
  }, { label: "district-tomato" });
  log(`  status=${t2.status} records=${t2.recordCount} commodities=${t2.commodities} bytes=${t2.bytes} ms=${t2.totalMs.toFixed(0)}`);
  report.tests.test2_with_commodity = {
    result: t2,
    comparison: {
      withoutCommodityRecords: t1.recordCount,
      withCommodityRecords: t2.recordCount,
      withoutCommodityCount: t1.commodityCount,
      withCommodityCount: t2.commodityCount,
      withoutBytes: t1.bytes,
      withBytes: t2.bytes,
    },
  };

  await sleep(1500);

  // -------- TEST 3: multiple commodity filters --------
  log("\n=== TEST 3: Multiple commodity filters ===");
  // Approach A: repeated filters[Commodity]
  const urlA = new URL(GOV_URL);
  urlA.searchParams.append("api-key", API_KEY);
  urlA.searchParams.append("format", "json");
  urlA.searchParams.append("limit", "100");
  urlA.searchParams.append("offset", "0");
  urlA.searchParams.append("filters[State]", "Maharashtra");
  urlA.searchParams.append("filters[District]", "Nashik");
  for (const c of ["Onion", "Tomato", "Potato", "Soyabean", "Groundnut"]) {
    urlA.searchParams.append("filters[Commodity]", c);
  }
  urlA.searchParams.append("sort[Arrival_Date]", "desc");

  const startA = performance.now();
  let multiA;
  try {
    const res = await fetch(urlA.toString());
    const text = await res.text();
    const json = JSON.parse(text);
    const records = Array.isArray(json.records) ? json.records : [];
    const commodities = [...new Set(records.map((r) => (r.Commodity || "").trim()))];
    multiA = {
      approach: "repeated filters[Commodity]",
      status: res.status,
      ok: res.ok,
      totalMs: performance.now() - startA,
      bytes: Buffer.byteLength(text),
      recordCount: records.length,
      commodities,
      interpretation:
        commodities.length > 1
          ? "OR-like (multiple commodities present)"
          : commodities.length === 1
            ? "Likely last-wins or single match"
            : "No/empty records",
    };
  } catch (e) {
    multiA = { approach: "repeated filters[Commodity]", error: String(e) };
  }
  log(`  multiA: status=${multiA.status} commodities=${(multiA.commodities || []).join("|")} records=${multiA.recordCount}`);

  await sleep(1500);

  // Approach B: comma-separated
  const multiB = await request({
    limit: 100,
    offset: 0,
    "filters[State]": "Maharashtra",
    "filters[District]": "Nashik",
    "filters[Commodity]": "Onion,Tomato,Potato,Soyabean,Groundnut",
    "sort[Arrival_Date]": "desc",
  }, { label: "comma-separated-commodity" });
  log(`  multiB comma: status=${multiB.status} commodities=${multiB.commodities.join("|")} records=${multiB.recordCount}`);

  report.tests.test3_multi_commodity = { repeatedParams: multiA, commaSeparated: multiB };

  await sleep(2000);

  // -------- TEST 4: limits --------
  log("\n=== TEST 4: limit 100 / 500 / 1000 / 2000 / 5000 ===");
  const limitTests = {};
  for (const limit of [100, 500, 1000, 2000, 5000]) {
    const r = await request({
      limit,
      offset: 0,
      "filters[State]": "Maharashtra",
      "filters[District]": "Nashik",
      "sort[Arrival_Date]": "desc",
    }, { label: `limit-${limit}` });
    limitTests[`limit_${limit}`] = {
      status: r.status,
      ok: r.ok,
      requestedLimit: limit,
      returnedRecords: r.recordCount,
      reportedLimit: r.limit,
      total: r.total,
      bytes: r.bytes,
      totalMs: r.totalMs,
      exception: r.exception,
      message: r.message,
    };
    log(`  limit=${limit}: status=${r.status} returned=${r.recordCount} reportedLimit=${r.limit} bytes=${r.bytes} ms=${r.totalMs.toFixed(0)}`);
    await sleep(2000);
  }
  report.tests.test4_limits = limitTests;

  await sleep(2000);

  // -------- TEST 5: pagination --------
  log("\n=== TEST 5: Pagination offsets ===");
  const pageSize = 100;
  const pages = [];
  let cumulative = 0;
  for (const offset of [0, 100, 200, 500, 1000]) {
    const r = await request({
      limit: pageSize,
      offset,
      "filters[State]": "Maharashtra",
      "filters[District]": "Nashik",
      "sort[Arrival_Date]": "desc",
    }, { label: `offset-${offset}` });
    cumulative += r.recordCount || 0;
    pages.push({
      offset,
      status: r.status,
      recordCount: r.recordCount,
      total: r.total,
      firstCommodity: r.commodities[0] || null,
      firstArrival: null,
      totalMs: r.totalMs,
    });
    log(`  offset=${offset}: status=${r.status} records=${r.recordCount} totalField=${r.total}`);
    await sleep(1500);
  }
  // Also try page= param if any
  const pageParam = await request({
    limit: 50,
    page: 2,
    "filters[State]": "Maharashtra",
    "filters[District]": "Nashik",
  }, { label: "page-param" });
  report.tests.test5_pagination = {
    pages,
    pageParamSupport: {
      status: pageParam.status,
      recordCount: pageParam.recordCount,
      note: "If identical to offset=0 behaviour, page= is ignored",
    },
  };

  await sleep(2000);

  // -------- TEST 6: fields projection --------
  log("\n=== TEST 6: Field projection ===");
  const fieldsTests = {};
  for (const fields of [
    "Commodity,Modal_Price,Market,District,Arrival_Date",
    "commodity,modal_price,market,district,arrival_date",
    "Commodity,Market",
  ]) {
    const r = await request({
      limit: 10,
      offset: 0,
      fields,
      "filters[State]": "Maharashtra",
      "filters[District]": "Nashik",
      "filters[Commodity]": "Tomato",
    }, { label: `fields-${fields}` });
    fieldsTests[fields] = {
      status: r.status,
      sampleKeys: r.sampleKeys,
      recordCount: r.recordCount,
      bytes: r.bytes,
      ok: r.ok,
      exception: r.exception,
    };
    log(`  fields=${fields}: status=${r.status} keys=${r.sampleKeys.join(",")} bytes=${r.bytes}`);
    await sleep(1500);
  }
  report.tests.test6_fields = fieldsTests;

  await sleep(2000);

  // -------- TEST 7: sort --------
  log("\n=== TEST 7: Sort ===");
  const sorts = {};
  for (const [key, val] of [
    ["sort[Arrival_Date]", "desc"],
    ["sort[Arrival_Date]", "asc"],
    ["sort[Modal_Price]", "desc"],
    ["sort[modal_price]", "desc"],
  ]) {
    const params = {
      limit: 5,
      offset: 0,
      "filters[State]": "Maharashtra",
      "filters[District]": "Nashik",
      "filters[Commodity]": "Tomato",
      [key]: val,
    };
    const r = await request(params, { label: `${key}=${val}` });
    // Need arrivals/prices from raw — re-fetch small for detail
    sorts[`${key}=${val}`] = {
      status: r.status,
      recordCount: r.recordCount,
      totalMs: r.totalMs,
      ok: r.ok,
    };
    log(`  ${key}=${val}: status=${r.status} records=${r.recordCount}`);
    await sleep(1500);
  }
  // Detailed sort check with arrivals
  async function sortSample(sortKey, sortVal) {
    const url = buildUrl({
      limit: 5,
      offset: 0,
      "filters[State]": "Maharashtra",
      "filters[District]": "Nashik",
      "filters[Commodity]": "Tomato",
      [sortKey]: sortVal,
    });
    const res = await fetch(url);
    const json = await res.json();
    const records = Array.isArray(json.records) ? json.records : [];
    return records.map((rec) => ({
      Arrival_Date: rec.Arrival_Date,
      Modal_Price: rec.Modal_Price,
      Market: rec.Market,
    }));
  }
  const sortDetail = {
    arrivalDesc: await sortSample("sort[Arrival_Date]", "desc"),
    arrivalAsc: await sortSample("sort[Arrival_Date]", "asc"),
    modalDesc: await sortSample("sort[Modal_Price]", "desc"),
  };
  report.tests.test7_sort = { summary: sorts, samples: sortDetail };

  await sleep(3000);

  // -------- TEST 8: payload sizes --------
  log("\n=== TEST 8: Payload sizes ===");
  const oneCrop = await request({
    limit: 100,
    offset: 0,
    "filters[State]": "Maharashtra",
    "filters[District]": "Nashik",
    "filters[Commodity]": "Tomato",
    "sort[Arrival_Date]": "desc",
  });
  await sleep(1500);
  const district = await request({
    limit: 1000,
    offset: 0,
    "filters[State]": "Maharashtra",
    "filters[District]": "Nashik",
    "sort[Arrival_Date]": "desc",
  });
  await sleep(2000);
  const state = await request({
    limit: 1000,
    offset: 0,
    "filters[State]": "Maharashtra",
    "sort[Arrival_Date]": "desc",
  });
  report.tests.test8_payloads = {
    oneCommodity: {
      bytes: oneCrop.bytes,
      records: oneCrop.recordCount,
      commodities: oneCrop.commodityCount,
      ms: oneCrop.totalMs,
      status: oneCrop.status,
    },
    districtLimit1000: {
      bytes: district.bytes,
      records: district.recordCount,
      commodities: district.commodityCount,
      ms: district.totalMs,
      status: district.status,
      commodityList: district.commodities,
    },
    stateLimit1000: {
      bytes: state.bytes,
      records: state.recordCount,
      commodities: state.commodityCount,
      ms: state.totalMs,
      status: state.status,
    },
  };
  log(`  oneCrop: ${oneCrop.bytes}B / ${oneCrop.recordCount} rec`);
  log(`  district: ${district.bytes}B / ${district.recordCount} rec / ${district.commodityCount} crops`);
  log(`  state: ${state.bytes}B / ${state.recordCount} rec / ${state.commodityCount} crops`);

  await sleep(3000);

  // -------- TEST 9: latency × 15 each (30 total) to avoid rate limit from prior investigation --------
  log("\n=== TEST 9: Latency (15 runs each to conserve quota) ===");
  const latSingle = [];
  const latDistrict = [];
  for (let i = 0; i < 15; i += 1) {
    const a = await request({
      limit: 100,
      offset: 0,
      "filters[State]": "Maharashtra",
      "filters[District]": "Nashik",
      "filters[Commodity]": "Tomato",
      "sort[Arrival_Date]": "desc",
    });
    latSingle.push(a);
    process.stdout.write(`  single ${i + 1}/15 status=${a.status} ${a.totalMs.toFixed(0)}ms\n`);
    await sleep(800);
  }
  await sleep(2000);
  for (let i = 0; i < 15; i += 1) {
    const a = await request({
      limit: 500,
      offset: 0,
      "filters[State]": "Maharashtra",
      "filters[District]": "Nashik",
      "sort[Arrival_Date]": "desc",
    });
    latDistrict.push(a);
    process.stdout.write(`  district ${i + 1}/15 status=${a.status} ${a.totalMs.toFixed(0)}ms\n`);
    await sleep(1000);
  }
  const avg = (arr) => {
    const ok = arr.filter((x) => x.ok);
    return ok.length ? ok.reduce((s, x) => s + x.totalMs, 0) / ok.length : null;
  };
  report.tests.test9_latency = {
    singleCommodity: {
      runs: latSingle.length,
      success: latSingle.filter((x) => x.ok).length,
      avgMs: avg(latSingle),
      minMs: Math.min(...latSingle.filter((x) => x.ok).map((x) => x.totalMs).concat([Infinity])),
      maxMs: Math.max(...latSingle.filter((x) => x.ok).map((x) => x.totalMs).concat([0])),
    },
    entireDistrict: {
      runs: latDistrict.length,
      success: latDistrict.filter((x) => x.ok).length,
      avgMs: avg(latDistrict),
      minMs: Math.min(...latDistrict.filter((x) => x.ok).map((x) => x.totalMs).concat([Infinity])),
      maxMs: Math.max(...latDistrict.filter((x) => x.ok).map((x) => x.totalMs).concat([0])),
    },
    note: "15 runs each (not 30) to reduce 429 risk after prior probes; pattern still comparable",
  };

  await sleep(5000);

  // -------- TEST 10: rate limit probe (gentle) --------
  log("\n=== TEST 10: Rate-limit probe (sequential until 429 or 80) ===");
  const rate = { hits: [], first429At: null, firstFailAt: null, stoppedAt: null };
  for (let i = 1; i <= 80; i += 1) {
    const r = await request({
      limit: 10,
      offset: 0,
      "filters[State]": "Maharashtra",
      "filters[District]": "Nashik",
      "filters[Commodity]": i % 2 === 0 ? "Tomato" : "Onion",
    });
    rate.hits.push({ n: i, status: r.status, ms: r.totalMs, ok: r.ok, exception: r.exception });
    if (!rate.first429At && r.status === 429) rate.first429At = i;
    if (!rate.firstFailAt && !r.ok) rate.firstFailAt = i;
    process.stdout.write(`  rate ${i}/80 status=${r.status} ms=${r.totalMs.toFixed(0)}\n`);
    if (r.status === 429) {
      // confirm a few more then stop
      if (i >= (rate.first429At || i) + 2) {
        rate.stoppedAt = i;
        break;
      }
    }
    // tiny delay to mimic app but still stress
    await sleep(50);
  }
  report.tests.test10_rate = {
    ...rate,
    summary: {
      first429At: rate.first429At,
      firstFailAt: rate.firstFailAt,
      totalProbed: rate.hits.length,
      successBefore429: rate.hits.filter((h) => h.ok && (!rate.first429At || h.n < rate.first429At)).length,
    },
  };

  report.meta.finishedAt = new Date().toISOString();
  report.meta.durationMs =
    new Date(report.meta.finishedAt).getTime() -
    new Date(report.meta.startedAt).getTime();

  const out = path.join(__dirname, "ogd-market-architecture-report.json");
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  log(`\nWrote ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
