/**
 * End-to-end QA script for Farmer Assistance.
 * Run: node scripts/qa-assistance.js
 */
require("dotenv").config();
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:4000";
const secret = process.env.JWT_SECRET;

const accounts = {
  A: { userId: "6a5126dd996d6dab06c9b751", mobile: "+919325773460" },
  B: { userId: "6a50bf8c4e1fa5ccb45ab565", mobile: "+913256354213" },
  C: { userId: "6a50c65679c1c8a5ceac78b1", mobile: "+914353456546" },
  ADMIN: { userId: "6a5d0bced5b65a2a5d3ace61", mobile: "+917741075483" },
};

const token = (key) =>
  jwt.sign(
    { userId: accounts[key].userId, mobile: accounts[key].mobile },
    secret,
    { expiresIn: "1d" }
  );

const results = [];
const pass = (name, detail = "") => {
  results.push({ ok: true, name, detail });
  console.log(`PASS  ${name}${detail ? " — " + detail : ""}`);
};
const fail = (name, detail = "") => {
  results.push({ ok: false, name, detail });
  console.log(`FAIL  ${name}${detail ? " — " + detail : ""}`);
};

async function req(method, urlPath, { token: t, body, formData, expect } = {}) {
  const headers = {};
  if (t) headers.Authorization = `Bearer ${t}`;
  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: payload,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (expect !== undefined && res.status !== expect) {
    fail(
      `${method} ${urlPath}`,
      `expected ${expect} got ${res.status}: ${JSON.stringify(json).slice(0, 300)}`
    );
  }
  return { status: res.status, json, headers: res.headers };
}

function tinyPngBuffer() {
  // 1x1 PNG
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
}

function tinyJpegBuffer() {
  // Minimal valid JPEG
  return Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAABpwD/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/AX//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AX//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AX//2Q==",
    "base64"
  );
}

async function uploadImage(accountKey) {
  const form = new FormData();
  const blob = new Blob([tinyJpegBuffer()], { type: "image/jpeg" });
  form.append("images", blob, "qa.jpg");
  const res = await req("POST", "/api/v1/assistance/images/upload", {
    token: token(accountKey),
    formData: form,
  });
  return res;
}

async function main() {
  console.log(`\n=== Assistance QA against ${BASE} ===\n`);

  // 0. Health / feed without auth
  {
    const r = await req("GET", "/api/v1/assistance?page=1&limit=10&sort=newest", {
      expect: 200,
    });
    if (r.status === 200 && r.json?.success) {
      pass("Public feed without auth", `total=${r.json.data?.pagination?.total ?? "?"}`);
    }
  }

  // 1. Unauthenticated create → 401
  {
    const r = await req("POST", "/api/v1/assistance", {
      body: { title: "x", description: "y".repeat(120), images: [] },
      expect: 401,
    });
    if (r.status === 401) pass("Create without JWT → 401");
  }

  // 2. Upload image as A
  let imageA = null;
  {
    const r = await uploadImage("A");
    if (r.status === 201 && r.json?.data?.images?.[0]) {
      imageA = r.json.data.images[0];
      const owned = imageA.publicId.includes(accounts.A.userId);
      if (owned) pass("Upload stores userId-scoped publicId", imageA.publicId);
      else fail("Upload publicId missing userId", imageA.publicId);
    } else {
      fail("Upload image A", `${r.status} ${JSON.stringify(r.json).slice(0, 400)}`);
    }
  }

  if (!imageA) {
    console.log("\nAborting remaining create-dependent tests — upload failed.\n");
    summarize();
    process.exit(1);
  }

  // 3. Validation failures
  {
    const r = await req("POST", "/api/v1/assistance", {
      token: token("A"),
      body: {
        title: "x".repeat(81),
        description: "y".repeat(120),
        images: [imageA],
      },
      expect: 400,
    });
    if (r.status === 400) pass("Title > 80 → 400");
  }
  {
    const r = await req("POST", "/api/v1/assistance", {
      token: token("A"),
      body: {
        title: "Short title",
        description: "too short",
        images: [imageA],
      },
      expect: 400,
    });
    if (r.status === 400) pass("Description < 100 → 400");
  }
  {
    const r = await req("POST", "/api/v1/assistance", {
      token: token("A"),
      body: {
        title: "Need Help After Crop Loss",
        description: "d".repeat(120),
        images: [],
      },
      expect: 400,
    });
    if (r.status === 400) pass("Zero images → 400");
  }

  // 4. B cannot attach A's image
  {
    const r = await req("POST", "/api/v1/assistance", {
      token: token("B"),
      body: {
        title: "Stolen image attempt",
        description: "d".repeat(120),
        images: [imageA],
      },
      expect: 403,
    });
    if (r.status === 403) pass("B cannot use A's publicId → 403");
    else fail("B using A's image", `${r.status} ${JSON.stringify(r.json).slice(0, 200)}`);
  }

  // 5. Create valid request as A
  let requestId = null;
  {
    const r = await req("POST", "/api/v1/assistance", {
      token: token("A"),
      body: {
        title: "QA Need Help After Rain",
        description:
          "Heavy rain damaged the onion crop. Current situation is waterlogged fields and we need guidance on recovery and soil treatment for the next sowing cycle urgently now.",
        images: [imageA],
      },
      expect: 201,
    });
    if (r.status === 201 && r.json?.data?.id) {
      requestId = r.json.data.id;
      const status = r.json.data.status;
      if (status === "PENDING_REVIEW") pass("Create starts PENDING_REVIEW", requestId);
      else fail("Create status", status);
    } else {
      fail("Create help request", `${r.status} ${JSON.stringify(r.json).slice(0, 400)}`);
    }
  }

  if (!requestId) {
    summarize();
    process.exit(1);
  }

  // 6. Before approval: B/C cannot see in feed or detail
  {
    const feed = await req("GET", "/api/v1/assistance?page=1&limit=50&sort=newest", {
      token: token("B"),
      expect: 200,
    });
    const found = (feed.json?.data?.requests || []).some((x) => x.id === requestId);
    if (!found) pass("Pre-approval: B feed does not include request");
    else fail("Pre-approval: B feed leaked PENDING request");
  }
  {
    const r = await req("GET", `/api/v1/assistance/${requestId}`, {
      token: token("B"),
      expect: 404,
    });
    if (r.status === 404) pass("Pre-approval: B detail → 404");
  }
  {
    const r = await req("GET", `/api/v1/assistance/${requestId}`, {
      token: token("A"),
      expect: 200,
    });
    if (r.status === 200 && r.json?.data?.isOwner) pass("Pre-approval: A (owner) can see detail");
  }

  // 7. Admin list + approve
  {
    const list = await req("GET", "/api/v1/admin/assistance?page=1&limit=50", {
      token: token("ADMIN"),
      expect: 200,
    });
    if (list.status === 200) {
      const found = (list.json?.data?.requests || []).some((x) => x.id === requestId);
      if (found) pass("Admin list includes pending request");
      else fail("Admin list missing request", JSON.stringify(list.json?.data?.pagination));
    }
  }
  {
    const r = await req("PATCH", `/api/v1/admin/assistance/${requestId}/approve`, {
      token: token("ADMIN"),
      body: { note: "QA approve" },
      expect: 200,
    });
    if (r.status === 200 && r.json?.data?.status === "OPEN") {
      pass("Admin approve → OPEN");
    } else {
      fail("Admin approve", `${r.status} ${JSON.stringify(r.json).slice(0, 400)}`);
    }
  }

  // 8. Post-approval visibility for B and C — THE KEY BUG SCENARIO
  {
    const feedB = await req("GET", "/api/v1/assistance?page=1&limit=50&sort=newest", {
      token: token("B"),
      expect: 200,
    });
    const foundB = (feedB.json?.data?.requests || []).some((x) => x.id === requestId);
    if (foundB) pass("Post-approval: B feed includes request");
    else
      fail(
        "Post-approval: B feed missing request",
        `total=${feedB.json?.data?.pagination?.total} sample=${JSON.stringify(
          (feedB.json?.data?.requests || []).slice(0, 2).map((x) => ({
            id: x.id,
            status: x.status,
          }))
        )}`
      );
  }
  {
    const feedC = await req("GET", "/api/v1/assistance?page=1&limit=50&sort=newest", {
      token: token("C"),
      expect: 200,
    });
    const foundC = (feedC.json?.data?.requests || []).some((x) => x.id === requestId);
    if (foundC) pass("Post-approval: C feed includes request");
    else fail("Post-approval: C feed missing request");
  }
  {
    const r = await req("GET", `/api/v1/assistance/${requestId}`, {
      token: token("B"),
      expect: 200,
    });
    if (r.status === 200 && r.json?.data?.status === "OPEN")
      pass("Post-approval: B detail → 200 OPEN");
    else fail("Post-approval: B detail", `${r.status} ${r.json?.data?.status}`);
  }
  {
    const anon = await req("GET", "/api/v1/assistance?page=1&limit=50", { expect: 200 });
    const found = (anon.json?.data?.requests || []).some((x) => x.id === requestId);
    if (found) pass("Post-approval: anonymous feed includes request");
    else fail("Post-approval: anonymous feed missing request");
  }

  // 9. Support flow
  {
    const r = await req("POST", `/api/v1/assistance/${requestId}/support`, {
      token: token("A"),
      expect: 400,
    });
    if (r.status === 400) pass("A cannot support own request → 400");
  }
  {
    const r = await req("POST", `/api/v1/assistance/${requestId}/support`, {
      token: token("B"),
      expect: 201,
    });
    if (r.status === 201 && r.json?.data?.supportCount === 1)
      pass("B support → 201 count=1");
    else fail("B support", `${r.status} ${JSON.stringify(r.json)}`);
  }
  {
    const r = await req("POST", `/api/v1/assistance/${requestId}/support`, {
      token: token("B"),
      expect: 409,
    });
    if (r.status === 409) pass("B duplicate support → 409");
  }

  // 10. Report flow
  {
    const r = await req("POST", `/api/v1/assistance/${requestId}/report`, {
      token: token("C"),
      body: { reason: "SPAM" },
      expect: 201,
    });
    if (r.status === 201) pass("C report → 201");
  }
  {
    const r = await req("POST", `/api/v1/assistance/${requestId}/report`, {
      token: token("C"),
      body: { reason: "SPAM" },
      expect: 409,
    });
    if (r.status === 409) pass("C duplicate report → 409");
  }
  {
    const r = await req("POST", `/api/v1/assistance/${requestId}/report`, {
      token: token("A"),
      body: { reason: "SPAM" },
      expect: 400,
    });
    if (r.status === 400) pass("A cannot report own → 400");
  }

  // 11. Edit OPEN → PENDING_REVIEW (re-moderation)
  let imageA2 = null;
  {
    const up = await uploadImage("A");
    imageA2 = up.json?.data?.images?.[0] || imageA;
  }
  {
    const r = await req("PATCH", `/api/v1/assistance/${requestId}`, {
      token: token("A"),
      body: {
        title: "QA Updated Title After Approval",
        description:
          "Updated description after approval should return this request to pending review for moderation before it is public again for everyone.",
        images: [imageA2],
      },
      expect: 200,
    });
    if (r.status === 200 && r.json?.data?.status === "PENDING_REVIEW")
      pass("Edit OPEN → PENDING_REVIEW (re-moderation)");
    else fail("Edit OPEN remoderation", `${r.status} ${r.json?.data?.status}`);
  }
  {
    const feed = await req("GET", "/api/v1/assistance?page=1&limit=50", {
      token: token("B"),
      expect: 200,
    });
    const found = (feed.json?.data?.requests || []).some((x) => x.id === requestId);
    if (!found) pass("After edit: B no longer sees request (back in review)");
    else fail("After edit: B still sees remoderated request");
  }
  {
    const r = await req("PATCH", `/api/v1/assistance/${requestId}`, {
      token: token("B"),
      body: { title: "Hacked" },
      expect: 403,
    });
    if (r.status === 403) pass("B cannot edit A's request → 403");
  }

  // Re-approve for remaining lifecycle tests
  {
    await req("PATCH", `/api/v1/admin/assistance/${requestId}/approve`, {
      token: token("ADMIN"),
      body: {},
      expect: 200,
    });
  }

  // 12. Resolve
  {
    const r = await req("PATCH", `/api/v1/assistance/${requestId}/resolve`, {
      token: token("B"),
      expect: 403,
    });
    if (r.status === 403) pass("B cannot resolve A's request → 403");
  }
  {
    const r = await req("PATCH", `/api/v1/assistance/${requestId}/resolve`, {
      token: token("A"),
      expect: 200,
    });
    if (r.status === 200 && r.json?.data?.status === "RESOLVED")
      pass("A resolve → RESOLVED");
  }
  {
    const r = await req("POST", `/api/v1/assistance/${requestId}/support`, {
      token: token("C"),
      expect: 400,
    });
    if (r.status === 400) pass("Cannot support RESOLVED → 400");
  }
  {
    const feed = await req("GET", "/api/v1/assistance?page=1&limit=50", {
      token: token("B"),
      expect: 200,
    });
    const item = (feed.json?.data?.requests || []).find((x) => x.id === requestId);
    if (item && item.status === "RESOLVED")
      pass("Resolved request still visible in feed with RESOLVED status");
    else if (!item) fail("Resolved request missing from feed (should remain visible)");
    else fail("Resolved feed status", item.status);
  }

  // 13. Soft delete
  {
    // Create another request to delete (active limit: resolved doesn't count)
    const up = await uploadImage("A");
    const img = up.json?.data?.images?.[0];
    const created = await req("POST", "/api/v1/assistance", {
      token: token("A"),
      body: {
        title: "QA Delete Me",
        description:
          "This request exists only to verify soft delete removes it from the public feed while keeping the database row intact for audit.",
        images: [img],
      },
      expect: 201,
    });
    const delId = created.json?.data?.id;
    await req("PATCH", `/api/v1/admin/assistance/${delId}/approve`, {
      token: token("ADMIN"),
      body: {},
      expect: 200,
    });
    {
      const r = await req("DELETE", `/api/v1/assistance/${delId}`, {
        token: token("B"),
        expect: 403,
      });
      if (r.status === 403) pass("B cannot delete A's request → 403");
    }
    {
      const r = await req("DELETE", `/api/v1/assistance/${delId}`, {
        token: token("A"),
        expect: 200,
      });
      if (r.status === 200) pass("A soft-delete → 200");
    }
    {
      const feed = await req("GET", "/api/v1/assistance?page=1&limit=50", {
        token: token("B"),
        expect: 200,
      });
      const found = (feed.json?.data?.requests || []).some((x) => x.id === delId);
      if (!found) pass("Soft-deleted request absent from feed");
      else fail("Soft-deleted request still in feed");
    }
    {
      const r = await req("GET", `/api/v1/assistance/${delId}`, {
        token: token("A"),
        expect: 404,
      });
      if (r.status === 404) pass("Soft-deleted detail → 404 even for owner");
    }
  }

  // 14. Admin reject / archive on a fresh request
  {
    const up = await uploadImage("A");
    const img = up.json?.data?.images?.[0];
    const created = await req("POST", "/api/v1/assistance", {
      token: token("A"),
      body: {
        title: "QA Reject Me",
        description:
          "This request exists only to verify admin reject removes public visibility and stores the rejected status for the author to review later.",
        images: [img],
      },
      expect: 201,
    });
    const id = created.json?.data?.id;
    const rej = await req("PATCH", `/api/v1/admin/assistance/${id}/reject`, {
      token: token("ADMIN"),
      body: { note: "spam" },
      expect: 200,
    });
    if (rej.status === 200 && rej.json?.data?.status === "REJECTED")
      pass("Admin reject → REJECTED");
    const feed = await req("GET", "/api/v1/assistance?page=1&limit=50", {
      token: token("B"),
      expect: 200,
    });
    const found = (feed.json?.data?.requests || []).some((x) => x.id === id);
    if (!found) pass("Rejected request absent from public feed");
    else fail("Rejected request leaked to feed");
  }

  // 15. Image delete ownership
  {
    const up = await uploadImage("A");
    const publicId = up.json?.data?.images?.[0]?.publicId;
    const r = await req("DELETE", "/api/v1/assistance/images", {
      token: token("B"),
      body: { publicId },
      expect: 403,
    });
    if (r.status === 403) pass("B cannot delete A's uploaded image → 403");
    const r2 = await req("DELETE", "/api/v1/assistance/images", {
      token: token("A"),
      body: { publicId },
      expect: 200,
    });
    if (r2.status === 200) pass("A can delete own uploaded image → 200");
  }

  // 16. My requests + summary
  {
    const r = await req("GET", "/api/v1/assistance/my-assistance?page=1&limit=20", {
      token: token("A"),
      expect: 200,
    });
    if (r.status === 200 && Array.isArray(r.json?.data?.requests))
      pass("My assistance list", `count=${r.json.data.requests.length}`);
  }
  {
    const r = await req("GET", "/api/v1/assistance/my-summary", {
      token: token("A"),
      expect: 200,
    });
    if (r.status === 200 && typeof r.json?.data?.canCreate === "boolean")
      pass(
        "My summary",
        `active=${r.json.data.activeCount} canCreate=${r.json.data.canCreate}`
      );
  }

  // 17. Pagination shape
  {
    const r = await req("GET", "/api/v1/assistance?page=1&limit=1&sort=newest", {
      expect: 200,
    });
    const p = r.json?.data?.pagination;
    if (p && p.limit === 1 && typeof p.total === "number" && typeof p.totalPages === "number")
      pass("Pagination meta present");
    else fail("Pagination meta", JSON.stringify(p));
  }

  // 18. Non-admin cannot approve
  {
    const r = await req("PATCH", `/api/v1/admin/assistance/${requestId}/approve`, {
      token: token("B"),
      body: {},
      expect: 403,
    });
    if (r.status === 403) pass("Non-admin cannot approve → 403");
  }

  summarize();
}

function summarize() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed, ${results.length} total ===\n`);
  if (failed) {
    console.log("Failures:");
    for (const r of results.filter((x) => !x.ok)) {
      console.log(` - ${r.name}: ${r.detail}`);
    }
  }
  fs.writeFileSync(
    path.join(__dirname, "qa-assistance-results.json"),
    JSON.stringify({ passed, failed, results }, null, 2)
  );
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
