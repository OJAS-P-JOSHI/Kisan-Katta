import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { Counter } from "../src/modules/counter/counter.model";
import { getNextSequence } from "../src/modules/counter/counter.repository";
import { GramSahakariApplication } from "../src/modules/gram-sahakari/gram-sahakari.model";
import {
  formatApplicationNumber,
  generateApplicationNumber,
} from "../src/modules/gram-sahakari/service/application-number.service";
import { GRAM_SAHAKARI_COUNTER_ID } from "../src/modules/gram-sahakari/gram-sahakari.constants";
import { backfillApplicationNumbers } from "../scripts/backfill-application-numbers";
import { Types } from "mongoose";

let memoryServer: MongoMemoryServer;

beforeAll(async () => {
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
  // Ensure indexes (including the unique applicationNumber index) are built.
  await GramSahakariApplication.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await memoryServer.stop();
});

afterEach(async () => {
  await Counter.deleteMany({});
  await GramSahakariApplication.deleteMany({});
});

// Minimal required fields to insert a valid application document.
const baseApplicationData = (overrides: Record<string, unknown> = {}) => ({
  userId: new Types.ObjectId(),
  status: "DRAFT",
  paymentStatus: "NOT_REQUIRED",
  languages: [],
  metadata: {},
  ...overrides,
});

describe("formatApplicationNumber", () => {
  it("formats with a 6-digit zero-padded sequence", () => {
    expect(formatApplicationNumber(2026, 1)).toBe("GS-2026-000001");
    expect(formatApplicationNumber(2026, 2)).toBe("GS-2026-000002");
    expect(formatApplicationNumber(2026, 103)).toBe("GS-2026-000103");
    expect(formatApplicationNumber(2026, 12431)).toBe("GS-2026-012431");
  });

  it("does not truncate sequences beyond 6 digits", () => {
    expect(formatApplicationNumber(2026, 1_234_567)).toBe("GS-2026-1234567");
  });
});

describe("counter sequence generation", () => {
  it("returns 1 for the first application", async () => {
    const first = await getNextSequence(GRAM_SAHAKARI_COUNTER_ID);
    expect(first).toBe(1);
  });

  it("returns 2 for the second application", async () => {
    await getNextSequence(GRAM_SAHAKARI_COUNTER_ID);
    const second = await getNextSequence(GRAM_SAHAKARI_COUNTER_ID);
    expect(second).toBe(2);
  });

  it("produces unique, contiguous values under concurrent creation", async () => {
    const CONCURRENCY = 100;
    const results = await Promise.all(
      Array.from({ length: CONCURRENCY }, () =>
        getNextSequence(GRAM_SAHAKARI_COUNTER_ID)
      )
    );

    const unique = new Set(results);
    expect(unique.size).toBe(CONCURRENCY);

    const sorted = [...results].sort((a, b) => a - b);
    expect(sorted[0]).toBe(1);
    expect(sorted[sorted.length - 1]).toBe(CONCURRENCY);
  });
});

describe("generateApplicationNumber", () => {
  it("combines the provided year with the next sequence", async () => {
    const a = await generateApplicationNumber(new Date("2026-01-15T00:00:00Z"));
    const b = await generateApplicationNumber(new Date("2026-06-20T00:00:00Z"));

    expect(a.sequence).toBe(1);
    expect(a.applicationNumber).toBe("GS-2026-000001");
    expect(b.sequence).toBe(2);
    expect(b.applicationNumber).toBe("GS-2026-000002");
  });
});

describe("uniqueness constraint", () => {
  it("rejects a duplicate applicationNumber at the database level", async () => {
    await GramSahakariApplication.create(
      baseApplicationData({ applicationNumber: "GS-2026-000001" })
    );

    await expect(
      GramSahakariApplication.create(
        baseApplicationData({ applicationNumber: "GS-2026-000001" })
      )
    ).rejects.toThrowError();
  });

  it("allows multiple legacy documents without an applicationNumber (partial index)", async () => {
    await GramSahakariApplication.collection.insertOne(
      baseApplicationData({ createdAt: new Date(), updatedAt: new Date() })
    );
    await GramSahakariApplication.collection.insertOne(
      baseApplicationData({ createdAt: new Date(), updatedAt: new Date() })
    );

    const count = await GramSahakariApplication.countDocuments({
      applicationNumber: { $exists: false },
    });
    expect(count).toBe(2);
  });
});

describe("backfill migration", () => {
  it("assigns numbers in createdAt order and is idempotent", async () => {
    // Insert three legacy docs (native driver bypasses required validation).
    const older = await GramSahakariApplication.collection.insertOne(
      baseApplicationData({
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      })
    );
    const middle = await GramSahakariApplication.collection.insertOne(
      baseApplicationData({
        createdAt: new Date("2026-02-01T00:00:00Z"),
        updatedAt: new Date("2026-02-01T00:00:00Z"),
      })
    );
    const newest = await GramSahakariApplication.collection.insertOne(
      baseApplicationData({
        createdAt: new Date("2026-03-01T00:00:00Z"),
        updatedAt: new Date("2026-03-01T00:00:00Z"),
      })
    );

    const firstRun = await backfillApplicationNumbers();
    expect(firstRun.scanned).toBe(3);
    expect(firstRun.updated).toBe(3);

    const olderDoc = await GramSahakariApplication.findById(older.insertedId).lean();
    const middleDoc = await GramSahakariApplication.findById(middle.insertedId).lean();
    const newestDoc = await GramSahakariApplication.findById(newest.insertedId).lean();

    expect(olderDoc?.applicationNumber).toBe("GS-2026-000001");
    expect(middleDoc?.applicationNumber).toBe("GS-2026-000002");
    expect(newestDoc?.applicationNumber).toBe("GS-2026-000003");

    // Idempotent: a second run finds nothing and consumes no new sequences.
    const secondRun = await backfillApplicationNumbers();
    expect(secondRun.scanned).toBe(0);
    expect(secondRun.updated).toBe(0);

    // Numbers must be unchanged after re-run.
    const olderAfter = await GramSahakariApplication.findById(older.insertedId).lean();
    expect(olderAfter?.applicationNumber).toBe("GS-2026-000001");
  });

  it("never overwrites an already-assigned number", async () => {
    await GramSahakariApplication.create(
      baseApplicationData({ applicationNumber: "GS-2026-999999" })
    );

    const result = await backfillApplicationNumbers();
    expect(result.scanned).toBe(0);

    const doc = await GramSahakariApplication.findOne({
      applicationNumber: "GS-2026-999999",
    }).lean();
    expect(doc?.applicationNumber).toBe("GS-2026-999999");
  });
});
