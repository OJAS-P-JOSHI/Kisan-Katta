/**
 * Government Market API reliability / performance investigation.
 * Standalone harness — does NOT import or modify production source.
 *
 * Run: node scripts/investigate-gov-market-api.mjs
 * Output: scripts/gov-market-investigation-report.json
 */
const fs = require("fs");
const path = require("path");
const dns = require("dns").promises;
const net = require("net");
const tls = require("tls");
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
const HOST = new URL(BASE).hostname;
const DEFAULT_TIMEOUT_MS = 30_000;
const CACHE_TTL_MS = 5 * 60 * 1000;

const COMMODITIES = [
  "Tomato",
  "Potato",
  "Onion",
  "Soyabean",
  "Groundnut",
  "Jowar",
  "Bajri",
  "Grapes",
];

const DISTRICTS = [
  "Nashik",
  "Pune",
  "Nagpur",
  "Sangli",
  "Solapur",
  "Ahmednagar",
  "Kolhapur",
  "Satara",
];

if (!API_KEY) {
  console.error("MARKET_API_KEY missing in .env");
  process.exit(1);
}

const allFailures = [];
const report = {
  meta: {
    startedAt: new Date().toISOString(),
    finishedAt: null,
    govHost: HOST,
    datasetId: DATASET,
    note: "API key redacted; requests mirror backend market.service.ts filters",
  },
  tests: {},
  errorTaxonomy: {},
  backendAnalysis: null,
  recommendations: null,
};

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[idx];
}

function summarizeLatencies(results) {
  const ok = results.filter((r) => r.success);
  const latencies = ok.map((r) => r.totalMs).sort((a, b) => a - b);
  const failures = results.filter((r) => !r.success);
  const timeouts = failures.filter((r) => r.category === "AbortError" || r.category === "Timeout");
  return {
    total: results.length,
    success: ok.length,
    failure: failures.length,
    timeout: timeouts.length,
    successPct: results.length ? (100 * ok.length) / results.length : 0,
    failurePct: results.length ? (100 * failures.length) / results.length : 0,
    timeoutPct: results.length ? (100 * timeouts.length) / results.length : 0,
    avgLatencyMs: latencies.length
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : null,
    minLatencyMs: latencies[0] ?? null,
    maxLatencyMs: latencies[latencies.length - 1] ?? null,
    p95LatencyMs: percentile(latencies, 95),
    avgRecords: ok.length
      ? ok.reduce((a, r) => a + (r.recordCount ?? 0), 0) / ok.length
      : null,
  };
}

function categorizeError(error, httpStatus) {
  if (httpStatus === 429) return "HTTP_429";
  if (httpStatus === 503) return "HTTP_503";
  if (httpStatus === 502) return "HTTP_502";
  if (httpStatus === 504) return "HTTP_504";
  if (httpStatus && httpStatus >= 400) return `HTTP_${httpStatus}`;

  if (!error) return "Unknown";
  const name = error.name || "";
  const msg = String(error.message || "");
  const code = error.code || "";

  if (name === "AbortError" || msg.includes("aborted") || msg.includes("AbortError")) {
    return "Timeout";
  }
  if (code === "ENOTFOUND" || msg.includes("ENOTFOUND") || msg.includes("getaddrinfo")) {
    return "DNS_error";
  }
  if (code === "ECONNRESET" || msg.includes("ECONNRESET")) return "ECONNRESET";
  if (code === "ECONNREFUSED" || msg.includes("ECONNREFUSED")) return "ECONNREFUSED";
  if (code === "ETIMEDOUT" || msg.includes("ETIMEDOUT")) return "Connect_timeout";
  if (code === "UND_ERR_CONNECT_TIMEOUT" || msg.includes("Connect Timeout")) {
    return "Connect_timeout";
  }
  if (code === "UND_ERR_HEADERS_TIMEOUT" || msg.includes("Headers Timeout")) {
    return "Response_timeout";
  }
  if (code === "UND_ERR_BODY_TIMEOUT" || msg.includes("Body Timeout")) {
    return "Response_timeout";
  }
  if (
    code === "CERT_HAS_EXPIRED" ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    msg.toLowerCase().includes("certificate") ||
    msg.toLowerCase().includes("ssl") ||
    msg.toLowerCase().includes("tls")
  ) {
    return "TLS_error";
  }
  if (code === "ENETUNREACH" || msg.includes("ENETUNREACH")) return "Network_unreachable";
  if (msg.toLowerCase().includes("fetch failed")) return "Fetch_failed";
  return `Other:${code || name || msg.slice(0, 40)}`;
}

function trackFailure(category, detail) {
  report.errorTaxonomy[category] = (report.errorTaxonomy[category] || 0) + 1;
  allFailures.push({ category, ...detail, at: new Date().toISOString() });
}

function buildUrl({ commodity, district, state = "Maharashtra", limit = 100, offset = 0 }) {
  const url = new URL(GOV_URL);
  url.searchParams.append("api-key", API_KEY);
  url.searchParams.append("format", "json");
  url.searchParams.append("limit", String(limit));
  url.searchParams.append("offset", String(offset));
  url.searchParams.append("filters[State]", state);
  url.searchParams.append("filters[District]", district);
  url.searchParams.append("filters[Commodity]", commodity);
  url.searchParams.append("sort[Arrival_Date]", "desc");
  return url.toString();
}

/**
 * Mirrors backend: AbortController + fetch + JSON parse.
 * connectionMs approximates time to headers (TTFB); totalMs includes body parse.
 */
async function govRequest(opts) {
  const {
    commodity,
    district,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    state = "Maharashtra",
    limit = 100,
  } = opts;
  const url = buildUrl({ commodity, district, state, limit });
  const start = performance.now();
  let headersAt = null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    headersAt = performance.now();
    const httpStatus = response.status;
    if (!response.ok) {
      const totalMs = performance.now() - start;
      const category = categorizeError(null, httpStatus);
      trackFailure(category, { commodity, district, httpStatus, totalMs });
      return {
        success: false,
        httpStatus,
        connectionMs: headersAt - start,
        totalMs,
        recordCount: 0,
        timeout: false,
        category,
        exception: `HTTP ${httpStatus} ${response.statusText}`,
      };
    }

    const data = await response.json();
    const totalMs = performance.now() - start;
    const records = Array.isArray(data.records) ? data.records.length : -1;
    return {
      success: true,
      httpStatus,
      connectionMs: headersAt - start,
      totalMs,
      recordCount: records,
      timeout: false,
      category: null,
      exception: null,
    };
  } catch (error) {
    const totalMs = performance.now() - start;
    const category = categorizeError(error, null);
    const isTimeout = category === "Timeout";
    trackFailure(category, {
      commodity,
      district,
      totalMs,
      message: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      httpStatus: null,
      connectionMs: headersAt ? headersAt - start : null,
      totalMs,
      recordCount: 0,
      timeout: isTimeout,
      category,
      exception: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function measureConnectionPhases(samples = 8) {
  const rows = [];
  for (let i = 0; i < samples; i += 1) {
    const row = {
      sample: i + 1,
      dnsMs: null,
      tcpMs: null,
      tlsMs: null,
      totalConnectMs: null,
      error: null,
    };
    const t0 = performance.now();
    try {
      const lookupStart = performance.now();
      const { address } = await dns.lookup(HOST);
      row.dnsMs = performance.now() - lookupStart;

      const tcpStart = performance.now();
      await new Promise((resolve, reject) => {
        const socket = net.connect({ host: address, port: 443 }, () => {
          row.tcpMs = performance.now() - tcpStart;
          const tlsStart = performance.now();
          const secure = tls.connect(
            { socket, servername: HOST, rejectUnauthorized: true },
            () => {
              row.tlsMs = performance.now() - tlsStart;
              row.totalConnectMs = performance.now() - t0;
              secure.end();
              resolve();
            }
          );
          secure.on("error", reject);
        });
        socket.on("error", reject);
        socket.setTimeout(15_000, () => {
          socket.destroy(new Error("TCP timeout"));
        });
      });
    } catch (error) {
      row.error = error instanceof Error ? error.message : String(error);
      row.totalConnectMs = performance.now() - t0;
    }
    rows.push(row);
    process.stdout.write(`  connection sample ${i + 1}/${samples}\r`);
  }
  process.stdout.write("\n");

  const ok = rows.filter((r) => !r.error);
  const avg = (key) =>
    ok.length ? ok.reduce((a, r) => a + (r[key] ?? 0), 0) / ok.length : null;

  return {
    samples: rows,
    averages: {
      dnsMs: avg("dnsMs"),
      tcpMs: avg("tcpMs"),
      tlsMs: avg("tlsMs"),
      totalConnectMs: avg("totalConnectMs"),
    },
    successPct: (100 * ok.length) / rows.length,
  };
}

async function runWithConcurrency(n, commodity, district, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const tasks = Array.from({ length: n }, () =>
    govRequest({ commodity, district, timeoutMs })
  );
  return Promise.all(tasks);
}

function logSection(title) {
  console.log(`\n========== ${title} ==========`);
}

async function main() {
  console.log("Gov Market API investigation starting…");
  console.log(`Host: ${HOST}`);

  // -------- TEST 1 --------
  logSection("TEST 1 — Single request × 30 (Tomato / Nashik)");
  const t1 = [];
  for (let i = 0; i < 30; i += 1) {
    const r = await govRequest({ commodity: "Tomato", district: "Nashik" });
    t1.push(r);
    console.log(
      `  [${i + 1}/30] ${r.success ? "OK" : "FAIL"} ${r.totalMs.toFixed(0)}ms status=${r.httpStatus} records=${r.recordCount}${r.exception ? ` err=${r.exception}` : ""}`
    );
  }
  report.tests.test1_single = {
    params: { commodity: "Tomato", district: "Nashik", runs: 30 },
    summary: summarizeLatencies(t1),
    samples: t1.map((r, i) => ({ n: i + 1, ...r })),
  };

  // -------- TEST 2 --------
  logSection("TEST 2 — Multiple commodities × 20 each");
  const t2 = {};
  for (const commodity of COMMODITIES) {
    const runs = [];
    for (let i = 0; i < 20; i += 1) {
      const r = await govRequest({ commodity, district: "Nashik" });
      runs.push(r);
      process.stdout.write(
        `  ${commodity} ${i + 1}/20 ${r.success ? "OK" : "FAIL"} ${r.totalMs.toFixed(0)}ms   \r`
      );
    }
    console.log("");
    t2[commodity] = {
      summary: summarizeLatencies(runs),
      failureCategories: runs
        .filter((r) => !r.success)
        .reduce((acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + 1;
          return acc;
        }, {}),
    };
    console.log(
      `  ${commodity}: success=${t2[commodity].summary.successPct.toFixed(1)}% avg=${t2[commodity].summary.avgLatencyMs?.toFixed(0) ?? "n/a"}ms failures=${t2[commodity].summary.failure} timeouts=${t2[commodity].summary.timeout}`
    );
  }
  report.tests.test2_commodities = t2;

  // -------- TEST 3 --------
  logSection("TEST 3 — Concurrency");
  const concurrencyLevels = [1, 2, 4, 6, 8, 10];
  const t3 = {};
  for (const n of concurrencyLevels) {
    // Two batches per level for a slightly better signal without exploding runtime
    const batch1 = await runWithConcurrency(n, "Tomato", "Nashik");
    const batch2 = await runWithConcurrency(n, "Tomato", "Nashik");
    const combined = [...batch1, ...batch2];
    t3[`c${n}`] = {
      concurrency: n,
      requests: combined.length,
      summary: summarizeLatencies(combined),
    };
    console.log(
      `  concurrency=${n}: success=${t3[`c${n}`].summary.successPct.toFixed(1)}% avg=${t3[`c${n}`].summary.avgLatencyMs?.toFixed(0) ?? "n/a"}ms timeout%=${t3[`c${n}`].summary.timeoutPct.toFixed(1)}`
    );
  }
  report.tests.test3_concurrency = t3;

  // -------- TEST 4 --------
  logSection("TEST 4 — Connection stability (DNS/TCP/TLS)");
  report.tests.test4_connection = await measureConnectionPhases(10);
  console.log("  averages:", report.tests.test4_connection.averages);

  // Also one full HTTP with timing split
  const fullHttp = await govRequest({ commodity: "Tomato", district: "Nashik" });
  report.tests.test4_connection.fullHttpSample = fullHttp;

  // -------- TEST 5 --------
  logSection("TEST 5 — Timeout behaviour");
  const timeouts = [5000, 10000, 15000, 20000, 30000];
  const t5 = {};
  for (const timeoutMs of timeouts) {
    const runs = [];
    for (let i = 0; i < 8; i += 1) {
      runs.push(await govRequest({ commodity: "Tomato", district: "Nashik", timeoutMs }));
      process.stdout.write(`  timeout=${timeoutMs} ${i + 1}/8\r`);
    }
    console.log("");
    t5[`t${timeoutMs}`] = {
      timeoutMs,
      summary: summarizeLatencies(runs),
      timeoutFailures: runs.filter((r) => r.timeout).length,
      otherFailures: runs.filter((r) => !r.success && !r.timeout).length,
    };
    console.log(
      `  ${timeoutMs}ms: success=${t5[`t${timeoutMs}`].summary.successPct.toFixed(1)}% timeouts=${t5[`t${timeoutMs}`].timeoutFailures}`
    );
  }
  report.tests.test5_timeouts = t5;

  // -------- TEST 6 --------
  logSection("TEST 6 — Retry recovery");
  const retryOutcomes = [];
  // Generate failures by running concurrent bursts, then retry failed ones
  const burst = await runWithConcurrency(10, "Onion", "Pune");
  const failed = burst.filter((r) => !r.success);
  console.log(`  Seed failures from burst: ${failed.length}/${burst.length}`);

  // Also force some sequential attempts that may fail randomly
  for (let i = 0; i < 15; i += 1) {
    const first = await govRequest({ commodity: "Tomato", district: "Nashik" });
    if (first.success) {
      retryOutcomes.push({ recovered: true, attempts: 1, neededRetry: false });
      continue;
    }
    const immediate = await govRequest({ commodity: "Tomato", district: "Nashik" });
    if (immediate.success) {
      retryOutcomes.push({ recovered: true, attempts: 2, neededRetry: true, delayMs: 0 });
      continue;
    }
    await new Promise((r) => setTimeout(r, 2000));
    const after2 = await govRequest({ commodity: "Tomato", district: "Nashik" });
    if (after2.success) {
      retryOutcomes.push({ recovered: true, attempts: 3, neededRetry: true, delayMs: 2000 });
      continue;
    }
    await new Promise((r) => setTimeout(r, 5000));
    const after5 = await govRequest({ commodity: "Tomato", district: "Nashik" });
    retryOutcomes.push({
      recovered: after5.success,
      attempts: 4,
      neededRetry: true,
      delayMs: 5000,
      finalCategory: after5.category,
    });
  }

  // Retry the burst failures with the same policy
  for (const _ of failed) {
    const immediate = await govRequest({ commodity: "Onion", district: "Pune" });
    if (immediate.success) {
      retryOutcomes.push({ recovered: true, attempts: 2, neededRetry: true, delayMs: 0, fromBurst: true });
      continue;
    }
    await new Promise((r) => setTimeout(r, 2000));
    const after2 = await govRequest({ commodity: "Onion", district: "Pune" });
    if (after2.success) {
      retryOutcomes.push({ recovered: true, attempts: 3, neededRetry: true, delayMs: 2000, fromBurst: true });
      continue;
    }
    await new Promise((r) => setTimeout(r, 5000));
    const after5 = await govRequest({ commodity: "Onion", district: "Pune" });
    retryOutcomes.push({
      recovered: after5.success,
      attempts: 4,
      neededRetry: true,
      delayMs: 5000,
      fromBurst: true,
      finalCategory: after5.category,
    });
  }

  const needingRetry = retryOutcomes.filter((o) => o.neededRetry);
  const recovered = needingRetry.filter((o) => o.recovered);
  report.tests.test6_retry = {
    totalSequences: retryOutcomes.length,
    sequencesWithInitialFailure: needingRetry.length,
    recoveredAmongFailures: recovered.length,
    recoveryRatePct: needingRetry.length
      ? (100 * recovered.length) / needingRetry.length
      : null,
    avgAttemptsWhenFailedInitially: needingRetry.length
      ? needingRetry.reduce((a, o) => a + o.attempts, 0) / needingRetry.length
      : null,
    outcomes: retryOutcomes,
  };
  console.log(
    `  recoveryRate=${report.tests.test6_retry.recoveryRatePct?.toFixed(1) ?? "n/a"}% avgAttempts=${report.tests.test6_retry.avgAttemptsWhenFailedInitially?.toFixed(2) ?? "n/a"}`
  );

  // -------- TEST 7 --------
  logSection("TEST 7 — Stress 100 random");
  const t7 = [];
  for (let i = 0; i < 100; i += 1) {
    const commodity = COMMODITIES[Math.floor(Math.random() * COMMODITIES.length)];
    const district = DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)];
    const r = await govRequest({ commodity, district });
    t7.push({ commodity, district, ...r });
    process.stdout.write(
      `  ${i + 1}/100 ${r.success ? "OK" : "FAIL"} ${commodity}/${district} ${r.totalMs.toFixed(0)}ms\r`
    );
  }
  console.log("");
  report.tests.test7_stress = {
    summary: summarizeLatencies(t7),
    connectionFailures: t7.filter((r) =>
      ["Connect_timeout", "ECONNRESET", "ECONNREFUSED", "DNS_error", "Network_unreachable", "Fetch_failed"].includes(
        r.category
      )
    ).length,
    byCommodity: Object.fromEntries(
      COMMODITIES.map((c) => {
        const subset = t7.filter((r) => r.commodity === c);
        return [c, summarizeLatencies(subset)];
      })
    ),
    byDistrict: Object.fromEntries(
      DISTRICTS.map((d) => {
        const subset = t7.filter((r) => r.district === d);
        return [d, summarizeLatencies(subset)];
      })
    ),
  };
  console.log(
    `  success=${report.tests.test7_stress.summary.successPct.toFixed(1)}% timeout%=${report.tests.test7_stress.summary.timeoutPct.toFixed(1)} avg=${report.tests.test7_stress.summary.avgLatencyMs?.toFixed(0)}ms`
  );

  // -------- TEST 8 --------
  logSection("TEST 8 — Cache effect (in-memory TTL mirror)");
  const cache = new Map();
  async function cachedGet(key, fn) {
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return { ...hit.data, cache: "hit", totalMs: 0.1 };
    }
    const data = await fn();
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return { ...data, cache: "miss" };
  }

  const cold = await cachedGet("Tomato|Nashik", () =>
    govRequest({ commodity: "Tomato", district: "Nashik" })
  );
  const warm1 = await cachedGet("Tomato|Nashik", () =>
    govRequest({ commodity: "Tomato", district: "Nashik" })
  );
  const warm2 = await cachedGet("Tomato|Nashik", () =>
    govRequest({ commodity: "Tomato", district: "Nashik" })
  );
  const missOther = await cachedGet("Potato|Nashik", () =>
    govRequest({ commodity: "Potato", district: "Nashik" })
  );

  report.tests.test8_cache = {
    cold: { cache: cold.cache, success: cold.success, totalMs: cold.totalMs },
    warm1: { cache: warm1.cache, success: warm1.success, totalMs: warm1.totalMs },
    warm2: { cache: warm2.cache, success: warm2.success, totalMs: warm2.totalMs },
    differentKeyMiss: {
      cache: missOther.cache,
      success: missOther.success,
      totalMs: missOther.totalMs,
    },
    improvementFactor:
      cold.success && warm1.cache === "hit" && cold.totalMs > 0
        ? cold.totalMs / Math.max(warm1.totalMs, 0.1)
        : null,
  };
  console.log("  cache:", report.tests.test8_cache);

  // -------- Aggregate --------
  const allSuccessSamples = [
    ...t1.filter((r) => r.success).map((r) => r.totalMs),
    ...t7.filter((r) => r.success).map((r) => r.totalMs),
  ].sort((a, b) => a - b);

  const overallTracked =
    Object.values(report.errorTaxonomy).reduce((a, b) => a + b, 0) +
    t1.filter((r) => r.success).length +
    // approximate: use stress + test1 as core reliability window + commodity tests
    0;

  // Better overall: combine test1 + test2 all + test7
  const overallResults = [
    ...t1,
    ...Object.values(t2).flatMap((c) => {
      // we didn't keep raw samples for t2 — use summary only
      return [];
    }),
    ...t7,
  ];

  // Reconstruct test2 contribution from summaries for overall %
  let overallSuccess = t1.filter((r) => r.success).length + t7.filter((r) => r.success).length;
  let overallTotal = t1.length + t7.length;
  for (const commodity of COMMODITIES) {
    overallSuccess += t2[commodity].summary.success;
    overallTotal += t2[commodity].summary.total;
  }

  report.overall = {
    successPct: (100 * overallSuccess) / overallTotal,
    totalRequestsCounted: overallTotal,
    successes: overallSuccess,
    failures: overallTotal - overallSuccess,
    avgLatencyMsFromTest1AndStress: allSuccessSamples.length
      ? allSuccessSamples.reduce((a, b) => a + b, 0) / allSuccessSamples.length
      : null,
    p95LatencyMsFromTest1AndStress: percentile(allSuccessSamples, 95),
    errorTaxonomy: report.errorTaxonomy,
    failureSampleCount: allFailures.length,
  };

  report.meta.finishedAt = new Date().toISOString();
  report.meta.durationMs =
    new Date(report.meta.finishedAt).getTime() -
    new Date(report.meta.startedAt).getTime();

  const outPath = path.join(__dirname, "gov-market-investigation-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nReport written: ${outPath}`);
  console.log(
    `Overall success (tests 1+2+7): ${report.overall.successPct.toFixed(2)}% of ${report.overall.totalRequestsCounted}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
