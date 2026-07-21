/**
 * LOCAL DEVELOPMENT ONLY — Payment state reset utility.
 *
 * Instantly resets a Gram Sahakari application into a known payment state so
 * you can re-run Checkout / verify / webhook tests without hand-editing Mongo.
 *
 * Safety:
 *   - Refuses to run when NODE_ENV === "production"
 *   - CLI only — no HTTP routes
 *   - Does not call completePayment(), webhooks, or reconciliation
 *
 * Usage:
 *   npm run payment:reset
 *   npm run payment:reset -- --state=PENDING
 *   npm run payment:reset -- --state=FAILED
 *   npm run payment:reset -- --state=SUCCESS
 *   npm run payment:reset -- --application=<applicationId>
 *   npm run payment:reset -- --user=<userId>
 *   npm run payment:reset -- --application=GS-2026-000004
 */
import dotenv from "dotenv";
import mongoose, { Types } from "mongoose";
import { AuthUser } from "../src/modules/auth/auth.model";
import { GramSahakariApplication } from "../src/modules/gram-sahakari/gram-sahakari.model";
import type { IGramSahakariApplication } from "../src/modules/gram-sahakari/interfaces/application.interface";
import { RazorpayEvent } from "../src/modules/payment/payment-event.model";

dotenv.config();

type ResetState = "PENDING" | "FAILED" | "SUCCESS";

interface CliOptions {
  application?: string;
  user?: string;
  state: ResetState;
}

const assertNotProduction = (): void => {
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-console
    console.error(
      "\nERROR: payment:reset is a LOCAL DEVELOPMENT utility and cannot run when NODE_ENV=production.\n"
    );
    process.exit(1);
  }
};

const parseArgs = (argv: string[]): CliOptions => {
  const options: CliOptions = { state: "PENDING" };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, ...rest] = arg.slice(2).split("=");
    const key = rawKey?.toLowerCase();
    const value = rest.join("=").trim();

    if (key === "application" || key === "app" || key === "id") {
      if (!value) throw new Error("--application requires a value.");
      options.application = value;
      continue;
    }
    if (key === "user" || key === "userid") {
      if (!value) throw new Error("--user requires a value.");
      options.user = value;
      continue;
    }
    if (key === "state") {
      const normalized = value.toUpperCase();
      if (normalized === "PENDING" || normalized === "PAYMENT_PENDING") {
        options.state = "PENDING";
      } else if (normalized === "FAILED" || normalized === "PAYMENT_FAILED") {
        options.state = "FAILED";
      } else if (normalized === "SUCCESS" || normalized === "PAID" || normalized === "SUBMITTED") {
        options.state = "SUCCESS";
      } else {
        throw new Error(
          `Unknown --state="${value}". Use PENDING | FAILED | SUCCESS.`
        );
      }
    }
  }

  return options;
};

const findTargetApplication = async (
  options: CliOptions
): Promise<IGramSahakariApplication> => {
  if (options.application) {
    const byId = Types.ObjectId.isValid(options.application)
      ? await GramSahakariApplication.findById(options.application).lean()
      : null;
    if (byId) return byId;

    const byNumber = await GramSahakariApplication.findOne({
      applicationNumber: options.application,
    }).lean();
    if (byNumber) return byNumber;

    throw new Error(`Application not found: ${options.application}`);
  }

  if (options.user) {
    if (!Types.ObjectId.isValid(options.user)) {
      throw new Error(`Invalid user id: ${options.user}`);
    }
    const newest = await GramSahakariApplication.findOne({
      userId: new Types.ObjectId(options.user),
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();
    if (!newest) {
      throw new Error(`No applications found for user: ${options.user}`);
    }
    return newest;
  }

  const latest = await GramSahakariApplication.findOne({})
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();
  if (!latest) {
    throw new Error("No Gram Sahakari applications found in the database.");
  }
  return latest;
};

const CLEARED_IDENTITY_FIELDS = [
  "submittedAt",
  "paidAt",
  "paymentReference",
  "razorpayPaymentId",
  "razorpayOrderId",
  "paymentFailureReason",
  "refundId",
  "refundedAt",
  "authorizedAt",
  "paymentMethod",
  "paymentAmount",
  "paymentCurrency",
] as const;

const buildResetUpdate = (
  state: ResetState
): { $set: Record<string, unknown>; $unset?: Record<string, ""> } => {
  if (state === "SUCCESS") {
    return {
      $set: {
        status: "SUBMITTED",
        paymentStatus: "PAID",
        paymentVerified: true,
        submittedAt: new Date(),
        paidAt: new Date(),
        paymentReference: "pay_test_reset",
        razorpayPaymentId: "pay_test_reset",
        razorpayOrderId: "order_test_reset",
        paymentFailureReason: null,
        refundId: null,
        refundedAt: null,
        authorizedAt: null,
        paymentMethod: "upi",
        paymentAmount: 50000,
        paymentCurrency: "INR",
        paymentAttemptCount: 0,
        paymentMeta: {
          paymentGateway: "RAZORPAY",
          gatewayVersion: "dev-reset",
          gatewayResponse: { via: "payment:reset" },
          processingSource: "RECONCILIATION",
        },
        paymentEvents: [
          {
            type: "PAYMENT_COMPLETED",
            source: "RECONCILIATION",
            details: { via: "payment:reset" },
            timestamp: new Date(),
          },
        ],
      },
    };
  }

  // PENDING / FAILED — $unset identity fields so nothing stale can survive
  // (safer than $set: null, which some drivers/layers can no-op).
  const unset: Record<string, ""> = {};
  for (const field of CLEARED_IDENTITY_FIELDS) {
    unset[field] = "";
  }

  return {
    $set: {
      status: "PAYMENT_PENDING",
      paymentStatus: state === "FAILED" ? "FAILED" : "PENDING",
      paymentVerified: false,
      paymentAttemptCount: state === "FAILED" ? 1 : 0,
      paymentMeta: {},
      paymentEvents: [],
      ...(state === "FAILED" ? { paymentFailureReason: "TEST_FAILURE" } : {}),
    },
    $unset: unset,
  };
};

const clearLedgerForApplication = async (
  applicationId: string,
  previous: {
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
  }
): Promise<number> => {
  const clauses: Record<string, unknown>[] = [
    { applicationId: new Types.ObjectId(applicationId) },
  ];

  if (previous.razorpayOrderId) {
    clauses.push({
      razorpayEventId: { $regex: `_${previous.razorpayOrderId}_` },
    });
    clauses.push({
      razorpayEventId: { $regex: `^verify_${previous.razorpayOrderId}_` },
    });
    clauses.push({
      razorpayEventId: { $regex: `_${previous.razorpayOrderId}$` },
    });
  }

  if (previous.razorpayPaymentId) {
    clauses.push({
      razorpayEventId: { $regex: previous.razorpayPaymentId },
    });
  }

  const result = await RazorpayEvent.deleteMany({ $or: clauses });
  return result.deletedCount ?? 0;
};

const printSummary = (params: {
  applicationNumber: string;
  status: string;
  paymentStatus: string;
  role: string;
  state: ResetState;
  eventsCleared: boolean;
}): void => {
  // eslint-disable-next-line no-console
  console.log(`
--------------------------------
Application Reset Complete

Application:
${params.applicationNumber}

Status:
${params.status}

Payment:
${params.paymentStatus}

User Role:
${params.role}

Payment Events Cleared:
${params.eventsCleared ? "YES" : "NO"}

${
  params.state === "SUCCESS"
    ? "Application marked as paid (dev convenience)."
    : "Ready for another payment test."
}
--------------------------------
`);
};

const run = async (): Promise<void> => {
  assertNotProduction();

  const options = parseArgs(process.argv.slice(2));
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/kisan-katta";

  await mongoose.connect(uri);

  try {
    const application = await findTargetApplication(options);
    if (!application._id) {
      throw new Error("Application is missing _id.");
    }

    const applicationId = String(application._id);
    const previousIds = {
      razorpayOrderId: application.razorpayOrderId ?? null,
      razorpayPaymentId: application.razorpayPaymentId ?? null,
    };
    const update = buildResetUpdate(options.state);

    // For PENDING/FAILED, unset paymentFailureReason unless FAILED sets it.
    if (options.state === "PENDING" && update.$unset) {
      update.$unset.paymentFailureReason = "";
    }
    if (options.state === "FAILED" && update.$unset) {
      delete update.$unset.paymentFailureReason;
    }

    const updated = await GramSahakariApplication.findByIdAndUpdate(
      applicationId,
      update,
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      throw new Error("Failed to update application.");
    }

    // Defensive: ensure identity fields are gone even if a previous $set left nulls.
    if (options.state !== "SUCCESS") {
      const fresh = await GramSahakariApplication.findById(applicationId)
        .select("razorpayOrderId razorpayPaymentId paymentReference")
        .lean();
      if (fresh?.razorpayOrderId || fresh?.razorpayPaymentId || fresh?.paymentReference) {
        await GramSahakariApplication.updateOne(
          { _id: applicationId },
          {
            $unset: {
              razorpayOrderId: "",
              razorpayPaymentId: "",
              paymentReference: "",
              authorizedAt: "",
              paidAt: "",
              paymentMethod: "",
            },
          }
        );
      }
    }

    await clearLedgerForApplication(applicationId, previousIds);

    const targetRole = options.state === "SUCCESS" ? "GRAM_SAHAKARI" : "FARMER";
    await AuthUser.findByIdAndUpdate(updated.userId, { role: targetRole });
    const user = await AuthUser.findById(updated.userId).select("role").lean();

    const finalApp = await GramSahakariApplication.findById(applicationId).lean();
    if (!finalApp) {
      throw new Error("Application disappeared after reset.");
    }

    printSummary({
      applicationNumber: finalApp.applicationNumber,
      status: finalApp.status,
      paymentStatus: finalApp.paymentStatus,
      role: user?.role ?? targetRole,
      state: options.state,
      eventsCleared: true,
    });
  } finally {
    await mongoose.disconnect();
  }
};

run().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error(
    "\nPayment reset failed:",
    error instanceof Error ? error.message : error,
    "\n"
  );
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
