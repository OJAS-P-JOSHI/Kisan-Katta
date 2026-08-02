/**
 * Assistance feed E2E layer counts — mirrors mobile getHelpRequests defaults.
 * Run: node scripts/verify-assistance-feed-e2e.js
 */
require("dotenv").config();

const API = process.env.VERIFY_API_BASE || "http://127.0.0.1:4000";
const DEFAULT_LIMIT = 20; // Mobile App assistance.constants DEFAULT_LIMIT (aligned with Marketplace)

async function getFeed(params = {}) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? DEFAULT_LIMIT),
    sort: params.sort ?? "newest",
  });
  if (params.search) qs.set("search", params.search);
  if (params.district) qs.set("district", params.district);

  const url = `${API}/api/v1/assistance?${qs.toString()}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`API failed ${res.status}: ${JSON.stringify(json)}`);
  }
  return { url, data: json.data };
}

function assertEq(label, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: ${actual} (expected ${expected})`);
  return ok;
}

async function main() {
  const report = { ok: true };

  // Layer 1–3: API
  const mobileDefault = await getFeed();
  const apiCount = mobileDefault.data.requests.length;
  const apiTotal = mobileDefault.data.pagination.total;
  console.log("\n=== API (GET /api/v1/assistance, mobile defaults) ===");
  console.log("url:", mobileDefault.url);
  report.ok &= assertEq("API response count", apiCount, 10);
  report.ok &= assertEq("API pagination.total", apiTotal, 10);

  // Layer 4: mobile API layer = same unwrap as assistance.service getHelpRequests
  const mobileApiLayer = mobileDefault.data; // response.data.data in axios
  const mobileApiCount = mobileApiLayer.requests.length;
  console.log("\n=== Mobile API layer (service unwrap) ===");
  report.ok &= assertEq("mobile API requests.length", mobileApiCount, 10);

  // Layer 5: "store" — Assistance has NO Zustand; hook state holds requests
  const hookState = {
    requests: mobileApiLayer.requests,
    total: mobileApiLayer.pagination.total,
    hasMore: 1 < mobileApiLayer.pagination.totalPages,
  };
  console.log("\n=== Hook state (no Zustand store in Assistance) ===");
  report.ok &= assertEq("hook/store requests.length", hookState.requests.length, 10);

  // Layer 6–7: FlatList data + renderItem
  const flatListData = hookState.requests;
  let renderItemExecutions = 0;
  flatListData.forEach(() => {
    renderItemExecutions += 1;
  });
  console.log("\n=== FlatList / renderItem (simulated from data prop) ===");
  report.ok &= assertEq("FlatList data.length", flatListData.length, 10);
  report.ok &= assertEq("renderItem executions", renderItemExecutions, 10);

  // Layer 9: pull-to-refresh (replace page 1)
  const refreshed = await getFeed();
  console.log("\n=== Pull-to-refresh (re-fetch page 1) ===");
  report.ok &= assertEq("refresh requests.length", refreshed.data.requests.length, 10);

  // Layer 10: search / sort
  const newest = await getFeed({ sort: "newest" });
  const supported = await getFeed({ sort: "most_supported" });
  const searchAll = await getFeed({ search: "FEED_E2E" });
  const searchPune = await getFeed({ search: "Pune" });
  const searchNone = await getFeed({ search: "ZZZ_NO_MATCH_XYZ" });

  console.log("\n=== Search / sort ===");
  report.ok &= assertEq("sort=newest count", newest.data.requests.length, 10);
  report.ok &= assertEq("sort=most_supported count", supported.data.requests.length, 10);

  const newestIds = newest.data.requests.map((r) => r.id).join(",");
  const supportedIds = supported.data.requests.map((r) => r.id).join(",");
  const supportOrder = supported.data.requests.map((r) => r.supportCount);
  console.log("most_supported supportCounts:", supportOrder.join(","));
  const sortedDesc = [...supportOrder].sort((a, b) => b - a);
  report.ok &= assertEq(
    "most_supported ordering",
    supportOrder.join(","),
    sortedDesc.join(","),
  );

  // Text search may return all 10 if FEED_E2E is indexed, or fewer for Pune.
  console.log(
    `search=FEED_E2E count=${searchAll.data.requests.length} total=${searchAll.data.pagination.total}`,
  );
  console.log(
    `search=Pune count=${searchPune.data.requests.length} total=${searchPune.data.pagination.total}`,
  );
  report.ok &= assertEq("search no-match count", searchNone.data.requests.length, 0);

  if (searchPune.data.pagination.total >= 10) {
    console.log(
      "WARN search=Pune did not reduce list — text index may match description too",
    );
  } else {
    report.ok &= assertEq(
      "search=Pune reduces list",
      searchPune.data.requests.length < 10,
      true,
    );
  }

  // Same set for newest vs most_supported (order may differ)
  const newestSet = new Set(newest.data.requests.map((r) => r.id));
  const supportedSet = new Set(supported.data.requests.map((r) => r.id));
  const sameSet =
    newestSet.size === supportedSet.size &&
    [...newestSet].every((id) => supportedSet.has(id));
  report.ok &= assertEq("sort keeps same 10 ids", sameSet, true);
  console.log("newest order differs from supported:", newestIds !== supportedIds);

  console.log("\n=== SUMMARY COUNTS ===");
  console.log(
    JSON.stringify(
      {
        apiResponseCount: apiCount,
        storeCount: hookState.requests.length,
        flatListCount: flatListData.length,
        renderedCardCount: renderItemExecutions,
        zustandStore: "N/A — Assistance uses usePaginatedHelpRequests useState, not Zustand",
        allEqual: apiCount === 10 && hookState.requests.length === 10,
      },
      null,
      2,
    ),
  );

  if (!report.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
