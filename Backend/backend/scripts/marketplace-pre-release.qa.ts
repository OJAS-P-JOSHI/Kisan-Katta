/**
 * Marketplace + Majur Katta pre-release E2E API suite (local).
 * Creates temporary listings, verifies flows, archives cleanup.
 *
 * Usage: npx ts-node scripts/marketplace-pre-release.qa.ts
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { Admin } from "../src/modules/admin/admin.model";
import { AuthUser } from "../src/modules/auth/auth.model";
import { MarketplaceListing } from "../src/modules/marketplace/marketplace.model";

const BASE = process.env.QA_BASE_URL ?? "http://127.0.0.1:4000/api/v1/marketplace";
const ADMIN_BASE = process.env.QA_ADMIN_BASE_URL ?? "http://127.0.0.1:4000/api/v1/admin";
const JWT_SECRET = process.env.JWT_SECRET!;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/kisan-katta";

const SELLER_ID = "6a50bf8c4e1fa5ccb45ab565"; // Jay / Pune / Ambegaon
const BUYER_ID = "6a50c65679c1c8a5ceac78b1"; // wefwef / Pune

type Result = { name: string; ok: boolean; detail?: string };

const results: Result[] = [];

const tokenFor = (userId: string, mobile: string): string =>
  jwt.sign({ userId, mobile }, JWT_SECRET, { expiresIn: "2h" });

const sellerToken = tokenFor(SELLER_ID, "+913256354213");
const buyerToken = tokenFor(BUYER_ID, "+914353456546");

const record = (name: string, ok: boolean, detail?: string) => {
  results.push({ name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
};

async function api(
  method: string,
  urlPath: string,
  opts: {
    token?: string;
    body?: unknown;
    formData?: any;
    expectStatus?: number | number[];
    base?: string;
  } = {}
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  let body: any;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${opts.base ?? BASE}${urlPath}`, { method, headers, body });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  const expected = opts.expectStatus ?? [200, 201];
  const expectedList = Array.isArray(expected) ? expected : [expected];
  if (!expectedList.includes(res.status)) {
    throw new Error(
      `${method} ${urlPath} → ${res.status} (expected ${expectedList.join("|")}): ${JSON.stringify(json)}`
    );
  }
  return { status: res.status, json };
}

const tinyJpegPath = path.join(__dirname, "qa-tiny.jpg");

function ensureTinyJpeg(): void {
  // Minimal valid JPEG (1x1 pixel)
  const bytes = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k=",
    "base64"
  );
  fs.writeFileSync(tinyJpegPath, bytes);
}

async function uploadImage(token: string): Promise<{ url: string; publicId: string }> {
  const form = new FormData();
  const blob = new Blob([fs.readFileSync(tinyJpegPath)], { type: "image/jpeg" });
  form.append("images", blob, "qa-tiny.jpg");
  const { json } = await api("POST", "/images/upload", { token, formData: form });
  const image = json.data?.images?.[0] ?? json.data?.[0];
  if (!image?.url || !image?.publicId) {
    throw new Error(`Unexpected upload response: ${JSON.stringify(json)}`);
  }
  return { url: image.url, publicId: image.publicId };
}

async function main(): Promise<void> {
  console.log(`\n=== Marketplace Pre-Release QA ===\nBase: ${BASE}\n`);
  ensureTinyJpeg();

  const createdIds: string[] = [];
  let labourIds: string[] = [];
  let produceId = "";
  let productId = "";
  let labourId = "";
  let expireId = "";
  let image: { url: string; publicId: string };

  try {
    await mongoose.connect(MONGODB_URI);

    // Public browse
    {
      const { json } = await api("GET", "/listings?limit=5");
      record("GET /listings", Array.isArray(json.data?.listings));
    }
    {
      const { json } = await api("GET", "/listings?listingType=produce&limit=5");
      record(
        "GET /listings?listingType=produce",
        json.data?.listings?.every((l: any) => l.listingType === "produce") ?? false
      );
    }
    {
      const { json } = await api("GET", "/listings?listingType=product&limit=5");
      record(
        "GET /listings?listingType=product",
        json.data?.listings?.every((l: any) => l.listingType === "product") ?? false
      );
    }
    {
      const { json } = await api("GET", "/listings?listingType=labour&limit=5");
      record("GET /listings?listingType=labour (local accepts)", json.success === true);
    }
    {
      const { status } = await api("POST", "/listings", {
        body: { listingType: "produce", title: "x", category: "Produce", price: 1 },
        expectStatus: 401,
      });
      record("POST /listings without auth → 401", status === 401);
    }

    // Upload image
    image = await uploadImage(sellerToken);
    record("POST /images/upload", !!image.publicId, image.publicId);

    // Create produce
    {
      const { json } = await api("POST", "/listings", {
        token: sellerToken,
        body: {
          listingType: "produce",
          title: "QA Wheat",
          category: "Produce",
          crop: "Wheat",
          price: 2500,
          expectedPrice: 2500,
          quantity: 10,
          unit: "Quintal",
          harvestDate: new Date().toISOString(),
          description: "QA produce listing",
          images: [image],
        },
      });
      produceId = json.data.id;
      createdIds.push(produceId);
      record(
        "POST produce",
        json.data.listingType === "produce" &&
          json.data.district === "Pune" &&
          json.data.status === "ACTIVE",
        produceId
      );
    }

    // Create product
    {
      const productImage = await uploadImage(sellerToken);
      const { json } = await api("POST", "/listings", {
        token: sellerToken,
        body: {
          listingType: "product",
          title: "QA Hybrid Seeds",
          category: "Seeds",
          price: 450,
          brand: "QA Brand",
          stock: 20,
          description: "QA product listing",
          images: [productImage],
        },
      });
      productId = json.data.id;
      createdIds.push(productId);
      record(
        "POST product",
        json.data.listingType === "product" && json.data.category === "Seeds",
        productId
      );
    }

    // Create labour #1–3 + fail #4
    for (let i = 1; i <= 3; i += 1) {
      const labourImage = await uploadImage(sellerToken);
      const { json } = await api("POST", "/listings", {
        token: sellerToken,
        body: {
          listingType: "labour",
          category: i === 1 ? "Harvesting" : i === 2 ? "Weeding" : "General Labour",
          price: 500 + i * 10,
          availableWorkers: i === 1 ? 1 : 4,
          gender: "Mixed Group",
          rateType: "per_day",
          availableFrom: new Date().toISOString(),
          description: `QA labour listing ${i} in Ambegaon village`,
          images: [labourImage],
        },
      });
      labourIds.push(json.data.id);
      createdIds.push(json.data.id);
      const expectedTitle =
        i === 1 ? "Harvesting" : i === 2 ? "Weeding Workers" : "General Labour Group";
      record(
        `POST labour #${i}`,
        json.data.listingType === "labour" &&
          json.data.title === expectedTitle &&
          json.data.village === "NO Name" &&
          json.data.taluka === "Ambegaon" &&
          json.data.district === "Pune" &&
          (json.data.images?.length ?? 0) <= 2,
        `${json.data.id} title=${json.data.title}`
      );
    }
    labourId = labourIds[0]!;

    {
      const labourImage = await uploadImage(sellerToken);
      const { status, json } = await api("POST", "/listings", {
        token: sellerToken,
        body: {
          listingType: "labour",
          category: "Spraying",
          price: 600,
          availableWorkers: 2,
          gender: "Male",
          rateType: "per_hour",
          availableFrom: new Date().toISOString(),
          description: "Should fail active limit",
          images: [labourImage],
        },
        expectStatus: 400,
      });
      record(
        "POST labour #4 → active limit 400",
        status === 400 &&
          String(json.message ?? json.error ?? "").toLowerCase().includes("at most 3"),
        JSON.stringify(json.message ?? json)
      );
    }

    // Reject client location spoof
    {
      const labourImage = await uploadImage(sellerToken);
      // First free a slot by marking one hired
      await api("PUT", `/listings/${labourIds[2]}`, {
        token: sellerToken,
        body: { status: "SOLD" },
      });
      record("PUT labour → SOLD (Hired)", true);

      const { status } = await api("POST", "/listings", {
        token: sellerToken,
        body: {
          listingType: "labour",
          category: "Plantation",
          price: 700,
          availableWorkers: 2,
          gender: "Female",
          rateType: "per_day",
          availableFrom: new Date().toISOString(),
          description: "spoof attempt",
          images: [labourImage],
          district: "Mumbai",
          village: "Fake",
          taluka: "Fake",
        },
        expectStatus: 400,
      });
      record("POST labour with client district → 400", status === 400);

      // recreate labour #3 as ACTIVE for later flows
      const img2 = await uploadImage(sellerToken);
      const { json } = await api("POST", "/listings", {
        token: sellerToken,
        body: {
          listingType: "labour",
          category: "Plantation",
          price: 700,
          availableWorkers: 3,
          gender: "Female",
          rateType: "per_day",
          availableFrom: new Date().toISOString(),
          description: "QA labour after hired slot freed",
          images: [img2],
        },
      });
      labourIds.push(json.data.id);
      createdIds.push(json.data.id);
      record("POST labour after marking one Hired", json.data.status === "ACTIVE", json.data.id);
    }

    // Browse labour + search
    {
      const { json } = await api("GET", "/listings?listingType=labour&limit=20");
      const ids = new Set(json.data.listings.map((l: any) => l.id));
      record(
        "Browse labour includes created ACTIVE",
        labourIds.slice(0, 2).every((id) => ids.has(id)) && !ids.has(labourIds[2]!)
      );
    }
    {
      const { json } = await api("GET", "/listings?listingType=labour&search=Ambegaon&limit=20");
      record(
        "Search labour by taluka Ambegaon",
        (json.data.listings?.length ?? 0) > 0,
        `total=${json.data.pagination?.total}`
      );
    }
    {
      const { json } = await api("GET", "/listings?listingType=labour&search=Harvesting&limit=20");
      record(
        "Search labour by category/title Harvesting",
        (json.data.listings ?? []).some((l: any) => l.id === labourId)
      );
    }
    {
      const { json } = await api("GET", "/listings?search=Irrigation&listingType=product&limit=20");
      record("Search product Irrigation (regression)", json.success === true);
    }

    // Detail — phone must not be on the public DTO
    {
      const { json } = await api("GET", `/listings/${labourId}`);
      record(
        "GET labour detail has no seller.phone",
        json.data.id === labourId &&
          !!json.data.seller?.name &&
          json.data.seller?.phone === undefined
      );
    }

    // Contact security
    {
      const { status } = await api("POST", `/listings/${labourId}/contact`, {
        expectStatus: 401,
      });
      record("POST contact without auth → 401", status === 401);
    }
    {
      const { status } = await api("POST", `/listings/${labourId}/contact`, {
        token: sellerToken,
        expectStatus: 400,
      });
      record("POST contact own listing → 400", status === 400);
    }
    {
      const before = await api("GET", `/listings/${labourId}`, { token: sellerToken });
      const clicksBefore = Number(before.json.data?.contactClicks ?? 0);
      const { json } = await api("POST", `/listings/${labourId}/contact`, {
        token: buyerToken,
      });
      record(
        "POST contact labour returns phone",
        typeof json.data?.phone === "string" && json.data.phone.length > 0
      );
      const after = await api("GET", `/listings/${labourId}`, { token: sellerToken });
      record(
        "Contact increments contactClicks",
        Number(after.json.data?.contactClicks ?? 0) === clicksBefore + 1
      );
      record(
        "GET after contact still has no seller.phone",
        after.json.data?.seller?.phone === undefined &&
          !("phone" in (after.json.data?.seller ?? {}))
      );
    }
    {
      const { json } = await api("POST", `/listings/${produceId}/contact`, {
        token: buyerToken,
      });
      record(
        "POST contact produce returns phone",
        typeof json.data?.phone === "string" && json.data.phone.length > 0
      );
    }
    {
      const { json } = await api("GET", `/listings/${produceId}`);
      const seller = json.data?.seller ?? {};
      record(
        "GET produce after contact still has no seller.phone",
        seller.phone === undefined && !("phone" in seller)
      );
      record(
        "GET produce seller is name+district only",
        typeof seller.name === "string" &&
          typeof seller.district === "string" &&
          Object.keys(seller).every((key) => key === "name" || key === "district")
      );
    }

    // Reports
    {
      const { status } = await api("POST", `/listings/${labourId}/report`, {
        body: { reason: "FAKE_LISTING" },
        expectStatus: 401,
      });
      record("POST report without auth → 401", status === 401);
    }
    {
      const { status } = await api("POST", `/listings/${labourId}/report`, {
        token: sellerToken,
        body: { reason: "FAKE_LISTING" },
        expectStatus: 400,
      });
      record("POST report own listing → 400", status === 400);
    }
    {
      const { json } = await api("POST", `/listings/${labourId}/report`, {
        token: buyerToken,
        body: { reason: "FAKE_LISTING" },
      });
      record("POST report labour", json.data?.reported === true);
    }
    {
      const { status } = await api("POST", `/listings/${labourId}/report`, {
        token: buyerToken,
        body: { reason: "FAKE_LISTING" },
        expectStatus: 409,
      });
      record("POST duplicate report → 409", status === 409);
    }

    // Image delete: attached publicId cannot be deleted by a non-owner
    {
      const { status } = await api("DELETE", "/images", {
        token: buyerToken,
        body: { publicId: image.publicId },
        expectStatus: 403,
      });
      record("DELETE /images non-owner of attached image → 403", status === 403);
    }

    // Save / unsave (buyer)
    {
      const { json } = await api("POST", `/listings/${labourId}/save`, { token: buyerToken });
      record("POST save labour (buyer)", json.success === true);
    }
    {
      const { status } = await api("POST", `/listings/${labourId}/save`, {
        token: sellerToken,
        expectStatus: 400,
      });
      record("POST save own labour → 400", status === 400);
    }
    {
      const { json } = await api("GET", "/saved?limit=20", { token: buyerToken });
      record(
        "GET saved includes labour",
        (json.data.listings ?? []).some((l: any) => l.id === labourId)
      );
    }
    {
      await api("DELETE", `/listings/${labourId}/save`, { token: buyerToken });
      record("DELETE unsave labour", true);
    }
    {
      await api("POST", `/listings/${produceId}/save`, { token: buyerToken });
      await api("POST", `/listings/${productId}/save`, { token: buyerToken });
      record("Save produce + product", true);
    }

    // Update labour
    {
      const { json } = await api("PUT", `/listings/${labourId}`, {
        token: sellerToken,
        body: { availableWorkers: 5, price: 550 },
      });
      record(
        "PUT labour regenerates title",
        json.data?.title === "Harvesting Workers" && json.data?.availableWorkers === 5,
        `id=${labourId} title=${json.data?.title} workers=${json.data?.availableWorkers}`
      );
    }
    {
      const { status } = await api("PUT", `/listings/${labourId}`, {
        token: sellerToken,
        body: { category: "Seeds" },
        expectStatus: 400,
      });
      record("PUT labour invalid category Seeds → 400", status === 400);
    }
    {
      const { status } = await api("PUT", `/listings/${labourId}`, {
        token: buyerToken,
        body: { price: 1 },
        expectStatus: 403,
      });
      record("PUT labour non-owner → 403", status === 403);
    }

    // Mark produce sold
    {
      const { json } = await api("PUT", `/listings/${produceId}`, {
        token: sellerToken,
        body: { status: "SOLD" },
      });
      record("PUT produce → SOLD", json.data.status === "SOLD");
    }
    {
      const { status } = await api("GET", `/listings/${produceId}`, { expectStatus: 404 });
      record("Sold produce hidden from public GET", status === 404);
    }
    {
      const { status } = await api("POST", `/listings/${produceId}/contact`, {
        token: buyerToken,
        expectStatus: 404,
      });
      record("POST contact SOLD listing → 404", status === 404);
    }

    // Expired listing contact
    {
      const expireImg = await uploadImage(sellerToken);
      const { json } = await api("POST", "/listings", {
        token: sellerToken,
        body: {
          listingType: "produce",
          title: "QA Expire Wheat",
          category: "Produce",
          crop: "Wheat",
          price: 100,
          expectedPrice: 100,
          quantity: 1,
          unit: "Kg",
          harvestDate: new Date().toISOString(),
          description: "QA expiry listing",
          images: [expireImg],
        },
      });
      const expireIdCreated = json.data.id as string;
      expireId = expireIdCreated;
      createdIds.push(expireIdCreated);
      await MarketplaceListing.updateOne(
        { _id: new mongoose.Types.ObjectId(expireIdCreated) },
        { $set: { expiresAt: new Date(Date.now() - 60_000) } }
      );
      const { status } = await api("POST", `/listings/${expireIdCreated}/contact`, {
        token: buyerToken,
        expectStatus: 404,
      });
      record("POST contact expired listing → 404", status === 404);
    }
    {
      const { status } = await api("GET", `/listings/${expireId}`, { expectStatus: 404 });
      record("Expired listing hidden from public GET", status === 404);
    }
    {
      const { json } = await api("GET", "/listings?limit=50");
      const ids = (json.data?.listings ?? []).map((l: any) => l.id);
      record("Expired listing excluded from public browse", !ids.includes(expireId));
    }

    // Admin moderation visibility
    {
      const { status } = await api("GET", "/marketplace", {
        token: buyerToken,
        base: ADMIN_BASE,
        expectStatus: 403,
      });
      record("GET admin marketplace as farmer → 403", status === 403);
    }
    {
      const admin = await Admin.findOne({ isActive: true }).lean();
      let adminToken: string | null = null;
      if (admin?.userId) {
        const user = await AuthUser.findById(admin.userId).select("mobile").lean();
        if (user?.mobile) adminToken = tokenFor(String(user._id), user.mobile);
      } else if (admin?.phoneNumber) {
        const user = await AuthUser.findOne({ mobile: admin.phoneNumber })
          .select("mobile")
          .lean();
        if (user?.mobile) adminToken = tokenFor(String(user._id), user.mobile);
      }

      if (!adminToken) {
        record(
          "Admin can see listing reports",
          false,
          "no active admin with linked AuthUser"
        );
        record("Existing admin GET listing still works", false, "skipped");
      } else {
        const { json } = await api("GET", `/marketplace/${labourId}`, {
          token: adminToken,
          base: ADMIN_BASE,
        });
        const reports = json.data?.reports ?? [];
        record(
          "Admin can see listing reports",
          json.data?.hasReports === true &&
            reports.some((r: any) => r.reason === "FAKE_LISTING")
        );
        record(
          "Existing admin GET listing still works",
          json.data?.listing?.id === labourId && !!json.data?.seller?.mobile
        );
      }
    }

    // My listings + summary
    {
      const { json } = await api("GET", "/my-listings?limit=50", { token: sellerToken });
      const mine = json.data.listings ?? [];
      record(
        "GET my-listings includes sold + active labour",
        mine.some((l: any) => l.id === produceId && l.status === "SOLD") &&
          mine.some((l: any) => l.id === labourId && l.status === "ACTIVE")
      );
    }
    {
      const { json } = await api("GET", "/my-summary", { token: sellerToken });
      record(
        "GET my-summary counts",
        typeof json.data.active === "number" &&
          typeof json.data.sold === "number" &&
          typeof json.data.archived === "number" &&
          typeof json.data.saved === "number",
        JSON.stringify(json.data)
      );
    }

    // Phase 2 — discovery + listing lifecycle
    {
      const { json } = await api("GET", "/listings?district=Pune&limit=20");
      const listings = json.data?.listings ?? [];
      record(
        "GET /listings?district=Pune",
        json.success === true && listings.every((l: any) => l.district === "Pune")
      );
    }
    {
      const { json } = await api("GET", "/listings?sort=price_low_to_high&limit=20");
      const prices = (json.data?.listings ?? []).map((l: any) => Number(l.price));
      const isSorted = prices.every(
        (price: number, index: number) => index === 0 || prices[index - 1] <= price
      );
      record("GET /listings?sort=price_low_to_high", json.success === true && isSorted);
    }
    {
      const { json } = await api("GET", "/listings?sort=price_high_to_low&limit=20");
      const prices = (json.data?.listings ?? []).map((l: any) => Number(l.price));
      const isSorted = prices.every(
        (price: number, index: number) => index === 0 || prices[index - 1] >= price
      );
      record("GET /listings?sort=price_high_to_low", json.success === true && isSorted);
    }
    {
      const { json } = await api("GET", "/listings?search=QA%20Hybrid%20Seeds&limit=20");
      const listings = json.data?.listings ?? [];
      record(
        "Cross-type search omits listingType",
        listings.some((l: any) => l.id === productId && l.listingType === "product")
      );
    }
    {
      const { json } = await api(
        "GET",
        "/listings?search=QA%20Hybrid%20Seeds&district=Pune&sort=newest&limit=20"
      );
      const listings = json.data?.listings ?? [];
      record(
        "Search + district + sort",
        listings.some((l: any) => l.id === productId && l.district === "Pune")
      );
    }
    {
      const page1 = await api("GET", "/my-listings?page=1&limit=1", { token: sellerToken });
      const page2 = await api("GET", "/my-listings?page=2&limit=1", { token: sellerToken });
      const id1 = page1.json.data?.listings?.[0]?.id;
      const id2 = page2.json.data?.listings?.[0]?.id;
      record(
        "GET my-listings pagination page 1 vs 2",
        page1.json.data?.pagination?.page === 1 &&
          page2.json.data?.pagination?.page === 2 &&
          !!id1 &&
          !!id2 &&
          id1 !== id2
      );
    }
    {
      const { json } = await api("GET", "/my-listings?status=SOLD&limit=50", {
        token: sellerToken,
      });
      const listings = json.data?.listings ?? [];
      record(
        "GET my-listings?status=SOLD",
        listings.length > 0 &&
          listings.every((l: any) => l.status === "SOLD") &&
          listings.some((l: any) => l.id === produceId)
      );
    }
    {
      const { status } = await api("POST", `/listings/${productId}/renew`, {
        expectStatus: 401,
      });
      record("POST renew without auth → 401", status === 401);
    }
    {
      const { status } = await api("POST", `/listings/${productId}/renew`, {
        token: buyerToken,
        expectStatus: 403,
      });
      record("POST renew non-owner → 403", status === 403);
    }
    {
      const { status } = await api("POST", `/listings/${productId}/renew`, {
        token: sellerToken,
        expectStatus: 400,
      });
      record("POST renew active listing with remaining time → 400", status === 400);
    }
    {
      const { status } = await api("POST", `/listings/${produceId}/renew`, {
        token: sellerToken,
        expectStatus: 400,
      });
      record("POST renew SOLD listing → 400", status === 400);
    }
    {
      const before = new Date();
      const { json } = await api("POST", `/listings/${expireId}/renew`, {
        token: sellerToken,
        body: { expiresAt: "2099-01-01T00:00:00.000Z" },
      });
      const expiresAt = new Date(json.data?.expiresAt);
      const minExpiry = new Date(before.getTime() + 29 * 24 * 60 * 60 * 1000);
      const maxExpiry = new Date(before.getTime() + 31 * 24 * 60 * 60 * 1000);
      record(
        "POST renew expired listing sets server expiry",
        json.data?.id === expireId &&
          json.data?.status === "ACTIVE" &&
          expiresAt >= minExpiry &&
          expiresAt <= maxExpiry
      );
    }
    {
      const { json } = await api("GET", `/listings/${expireId}`);
      record(
        "Renewed listing is public without seller.phone",
        json.data?.id === expireId &&
          json.data?.status === "ACTIVE" &&
          json.data?.seller?.phone === undefined
      );
    }
    {
      const { json } = await api("GET", "/listings?limit=50");
      const ids = (json.data?.listings ?? []).map((l: any) => l.id);
      record("Renewed listing appears in public browse", ids.includes(expireId));
    }
    {
      const { status } = await api("POST", `/listings/${expireId}/renew`, {
        token: sellerToken,
        expectStatus: 400,
      });
      record("POST repeated renew is rejected", status === 400);
    }

    // Archive
    for (const id of [produceId, productId, expireId, ...labourIds]) {
      try {
        await api("DELETE", `/listings/${id}`, { token: sellerToken });
      } catch {
        // may already be archived
      }
    }
    {
      const { json } = await api("GET", `/listings/${labourId}`, {
        token: sellerToken,
      });
      record("Owner can still GET archived labour", json.data.status === "ARCHIVED");
    }
    {
      const { status } = await api("GET", `/listings/${labourId}`, { expectStatus: 404 });
      record("Archived labour hidden from public", status === 404);
    }
    {
      const { status } = await api("POST", `/listings/${labourId}/contact`, {
        token: buyerToken,
        expectStatus: [404, 429],
      });
      record("POST contact ARCHIVED listing rejected", status === 404 || status === 429);
    }
    {
      const { status } = await api("PUT", `/listings/${labourId}`, {
        token: sellerToken,
        body: { price: 999 },
        expectStatus: 400,
      });
      record("Archived labour cannot update → 400", status === 400);
    }
    {
      const { status } = await api("POST", `/listings/${labourId}/renew`, {
        token: sellerToken,
        expectStatus: 400,
      });
      record("POST renew ARCHIVED listing → 400", status === 400);
    }

    // Contact rate limit (buyer already used a few slots this minute)
    {
      let saw429 = false;
      let lastStatus = 0;
      for (let i = 0; i < 20; i += 1) {
        const { status } = await api("POST", `/listings/${productId}/contact`, {
          token: buyerToken,
          expectStatus: [200, 404, 429],
        });
        lastStatus = status;
        if (status === 429) {
          saw429 = true;
          break;
        }
      }
      record("Contact rate limit eventually returns 429", saw429, `lastStatus=${lastStatus}`);
    }

    // Image delete
    {
      await api("DELETE", "/images", {
        token: sellerToken,
        body: { publicId: image.publicId },
      });
      record("DELETE /images", true);
    }

    // Phase 3: duplicate is client-side prefill; create still server-owns lifecycle.
    {
      const img = await uploadImage(sellerToken);
      const { json } = await api("POST", "/listings", {
        token: sellerToken,
        body: {
          listingType: "produce",
          title: "QA Create Ignores Client Lifecycle",
          category: "Produce",
          crop: "Jowar",
          price: 1800,
          expectedPrice: 1800,
          quantity: 5,
          unit: "Quintal",
          harvestDate: new Date().toISOString(),
          description: "client cannot inherit status",
          images: [img],
          status: "SOLD",
          expiresAt: "2020-01-01T00:00:00.000Z",
          views: 999,
          contactClicks: 50,
          sellerId: BUYER_ID,
        },
      });
      createdIds.push(json.data.id);
      const expiresAt = new Date(json.data.expiresAt).getTime();
      record(
        "POST listing ignores client status/expiry/metrics",
        json.data.id !== produceId &&
          json.data.status === "ACTIVE" &&
          json.data.views === 0 &&
          json.data.contactClicks === 0 &&
          json.data.sellerId === SELLER_ID &&
          Number.isFinite(expiresAt) &&
          expiresAt > Date.now()
      );
    }

    // After archive, seller can create labour again (limit freed)
    {
      const img = await uploadImage(sellerToken);
      const { json } = await api("POST", "/listings", {
        token: sellerToken,
        body: {
          listingType: "labour",
          category: "Daily Helper",
          price: 400,
          availableWorkers: 1,
          gender: "Male",
          rateType: "per_day",
          availableFrom: new Date().toISOString(),
          description: "post-archive labour",
          images: [img],
        },
      });
      createdIds.push(json.data.id);
      await api("DELETE", `/listings/${json.data.id}`, { token: sellerToken });
      record("POST labour after archive frees slot", json.data.status === "ACTIVE");
    }
  } catch (error) {
    record("SUITE CRASH", false, error instanceof Error ? error.message : String(error));
    // best-effort cleanup
    for (const id of createdIds) {
      try {
        await api("DELETE", `/listings/${id}`, { token: sellerToken });
      } catch {
        // ignore
      }
    }
  }

  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== Summary: ${results.length - failed.length}/${results.length} passed ===`);
  if (failed.length) {
    console.log("Failed:");
    for (const f of failed) console.log(` - ${f.name}: ${f.detail ?? ""}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
