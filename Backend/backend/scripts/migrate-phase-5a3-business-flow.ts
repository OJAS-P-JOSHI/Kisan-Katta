/**
 * Phase 5A.3 — Idempotent migration for the final Gram Sahakari business flow.
 *
 * Maps legacy application statuses to the final three-state model and removes
 * unused review fields. Safe to run multiple times.
 *
 * Mapping:
 *   DRAFT                              → DRAFT (unchanged)
 *   SUBMITTED + paymentStatus=PAID     → SUBMITTED
 *   SUBMITTED + paymentStatus!=PAID    → PAYMENT_PENDING  (never SUBMITTED+unpaid)
 *   UNDER_REVIEW / APPROVED / ACTIVE / SUSPENDED → SUBMITTED (already past payment)
 *   REJECTED                           → DRAFT (allows re-apply)
 *
 * Also $unsets: reviewedBy, assignedTo, reviewRemarks, approvedAt, rejectedAt
 *
 * Usage:
 *   npx ts-node scripts/migrate-phase-5a3-business-flow.ts
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

interface MigrationCounts {
  toSubmitted: number;
  toPaymentPending: number;
  toDraft: number;
  fieldsUnset: number;
}

const run = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/kisan-katta";
  await mongoose.connect(uri);

  const collection = mongoose.connection.collection("gram_sahakari_applications");
  const counts: MigrationCounts = {
    toSubmitted: 0,
    toPaymentPending: 0,
    toDraft: 0,
    fieldsUnset: 0,
  };

  // eslint-disable-next-line no-console
  console.log("Phase 5A.3 migration starting...");

  // 1. SUBMITTED without PAID → PAYMENT_PENDING (invalid combo must not exist)
  {
    const result = await collection.updateMany(
      {
        status: "SUBMITTED",
        paymentStatus: { $ne: "PAID" },
      },
      {
        $set: { status: "PAYMENT_PENDING", paymentStatus: "PENDING" },
      }
    );
    counts.toPaymentPending += result.modifiedCount;
  }

  // 2. Legacy post-payment / review statuses → SUBMITTED
  {
    const result = await collection.updateMany(
      {
        status: { $in: ["UNDER_REVIEW", "APPROVED", "ACTIVE", "SUSPENDED"] },
      },
      {
        $set: { status: "SUBMITTED" },
      }
    );
    counts.toSubmitted += result.modifiedCount;
  }

  // 3. REJECTED → DRAFT so the farmer can start fresh
  {
    const result = await collection.updateMany(
      { status: "REJECTED" },
      { $set: { status: "DRAFT", paymentStatus: "NOT_REQUIRED" } }
    );
    counts.toDraft += result.modifiedCount;
  }

  // 4. Ensure any remaining PAID applications are SUBMITTED
  {
    const result = await collection.updateMany(
      {
        paymentStatus: "PAID",
        status: { $nin: ["SUBMITTED"] },
      },
      { $set: { status: "SUBMITTED" } }
    );
    counts.toSubmitted += result.modifiedCount;
  }

  // 5. Strip unused review + retired application fields (idempotent)
  {
    const result = await collection.updateMany(
      {},
      {
        $unset: {
          reviewedBy: "",
          assignedTo: "",
          reviewRemarks: "",
          approvedAt: "",
          rejectedAt: "",
          panNumber: "",
          panImage: "",
          education: "",
          occupation: "",
          languages: "",
          experience: "",
          experienceCertificates: "",
          whyJoin: "",
        },
      }
    );
    counts.fieldsUnset = result.modifiedCount;
  }

  // eslint-disable-next-line no-console
  console.log("Phase 5A.3 migration complete:", counts);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error("Phase 5A.3 migration failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
