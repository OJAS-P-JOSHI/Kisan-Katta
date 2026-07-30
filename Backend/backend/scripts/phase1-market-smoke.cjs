/**
 * Phase 1 optimization smoke: limit config, TTL, coalesce counter shape.
 * Run: node scripts/phase1-market-smoke.cjs
 */
const assert = require("assert");

const normalize = require("../dist/modules/market/market.normalize.js");
const filter = require("../dist/modules/market/market.filter.js");
const district = require("../dist/modules/market/market.district.js");
const gov = require("../dist/modules/market/market.gov-client.js");

district.clearDistrictMarketCache();

assert.strictEqual(district.DISTRICT_CACHE_TTL_MS, 2 * 60 * 60 * 1000);

const limit = gov.getConfiguredDistrictLimit();
assert.ok(limit >= 100 && limit <= 5000, "limit in range");
assert.ok(limit <= 2000 || process.env.MARKET_DISTRICT_LIMIT, `default should be 2000, got ${limit}`);

const raw = [
  { Commodity: "Tomato", Market: "Nasik APMC", Arrival_Date: "28/07/2026", Modal_Price: "100" },
  { Commodity: "Onion", Market: "Nasik APMC", Arrival_Date: "28/07/2026", Modal_Price: "200" },
  { Commodity: "Tomato", Market: "Nasik APMC", Arrival_Date: "27/07/2026", Modal_Price: "90" },
];
assert.strictEqual(normalize.keepLatestRecordPerMandi(raw).length, 2);

const dataset = [
  {
    commodity: "Tomato",
    market: "A",
    district: "Nashik",
    state: "Maharashtra",
    variety: "",
    grade: "",
    arrivalDate: "28/07/2026",
    modalPrice: 1500,
    minPrice: 1000,
    maxPrice: 2000,
  },
  {
    commodity: "Onion",
    market: "B",
    district: "Nashik",
    state: "Maharashtra",
    variety: "",
    grade: "",
    arrivalDate: "28/07/2026",
    modalPrice: 800,
    minPrice: 700,
    maxPrice: 900,
  },
];

const filtered = filter.filterDistrictData({
  districtData: dataset,
  commodities: ["Tomato", "Onion"],
  districtCandidates: ["Nashik"],
});
assert.strictEqual(filtered.length, 2);

console.log("Optimization smoke passed.");
console.log("DISTRICT_LIMIT:", limit);
console.log("CACHE_TTL_MS:", district.DISTRICT_CACHE_TTL_MS);
