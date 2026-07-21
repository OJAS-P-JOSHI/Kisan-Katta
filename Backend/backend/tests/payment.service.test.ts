import crypto from "crypto";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// Keep real signature verification (crypto/HMAC via the SDK), but stub the two
// functions that would otherwise make live Razorpay network calls.
vi.mock("../src/modules/payment/service/razorpay.service", async (importActual) => {
  const actual = await importActual<
    typeof import("../src/modules/payment/service/razorpay.service")
  >();
  return {
    ...actual,
    createRazorpayOrder: vi.fn(
      async (params: { amount: number; currency: string }) => ({
        id: "order_test_123",
        amount: params.amount,
        currency: params.currency,
      })
    ),
    fetchPaymentMethod: vi.fn(async () => "upi"),
  };
});

import { GramSahakariApplication } from "../src/modules/gram-sahakari/gram-sahakari.model";
import { RazorpayEvent } from "../src/modules/payment/payment-event.model";
import {
  createPaymentOrder,
  getPaymentDetails,
  recordPaymentFailure,
  verifyPayment,
} from "../src/modules/payment/service/payment.service";
import { createRazorpayOrder } from "../src/modules/payment/service/razorpay.service";
import { AppError } from "../src/utils/AppError";
import { REGISTRATION_FEE_PAISE } from "../src/modules/payment/payment.constants";

const SECRET = "test_secret_key";
const doc = () => ({ url: "https://x/y.png", publicId: "kisan/y" });

const sign = (orderId: string, paymentId: string): string =>
  crypto.createHmac("sha256", SECRET).update(`${orderId}|${paymentId}`).digest("hex");

let mongo: MongoMemoryServer;
let seq = 0;

const createCompleteDraft = async (userId?: string) => {
  seq += 1;
  const uid = userId ?? new mongoose.Types.ObjectId().toString();
  return GramSahakariApplication.create({
    applicationNumber: `GS-2026-${String(seq).padStart(6, "0")}`,
    userId: new mongoose.Types.ObjectId(uid),
    status: "PAYMENT_PENDING",
    paymentStatus: "PENDING",
    fullName: "Test Farmer",
    phone: "9876543210",
    email: "farmer@example.com",
    gender: "MALE",
    dob: new Date("1990-01-01"),
    photo: doc(),
    district: "Pune",
    taluka: "Haveli",
    village: "Wagholi",
    address: "123 Village Road",
    pincode: "411001",
    aadhaarNumber: "123412341234",
    aadhaarFront: doc(),
    aadhaarBack: doc(),
    cancelledChequeImage: doc(),
    bankAccountHolder: "Test Farmer",
    bankAccountNumber: "123456789012",
    bankIFSC: "HDFC0000053",
    bankName: "HDFC Bank",
  });
};

const uidOf = (app: { userId: mongoose.Types.ObjectId }) => app.userId.toString();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "kisan-katta-test" });
  await GramSahakariApplication.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await GramSahakariApplication.deleteMany({});
  await RazorpayEvent.deleteMany({});
  vi.clearAllMocks();
});

describe("Payment: create order", () => {
  it("✓ Create order — creates a Razorpay order and stores PENDING state", async () => {
    const app = await createCompleteDraft();
    const res = await createPaymentOrder(uidOf(app), "FARMER");

    expect(res.orderId).toBe("order_test_123");
    expect(res.amount).toBe(REGISTRATION_FEE_PAISE);
    expect(res.currency).toBe("INR");
    expect(res.key).toBe("rzp_test_dummy");
    expect(res.applicationNumber).toBe(app.applicationNumber);

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentStatus).toBe("PENDING");
    expect(fresh?.razorpayOrderId).toBe("order_test_123");
    expect(fresh?.status).toBe("PAYMENT_PENDING");
  });

  it("✓ Missing application — throws 404", async () => {
    await expect(
      createPaymentOrder(new mongoose.Types.ObjectId().toString(), "FARMER")
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("✓ Wrong application state — DRAFT without submit is rejected (409)", async () => {
    const app = await GramSahakariApplication.create({
      applicationNumber: "GS-2026-900001",
      userId: new mongoose.Types.ObjectId(),
      status: "DRAFT",
    });
    await expect(createPaymentOrder(uidOf(app), "FARMER")).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("✓ Double click Pay button / Payment after refresh — reuses the same order", async () => {
    const app = await createCompleteDraft();
    const first = await createPaymentOrder(uidOf(app), "FARMER");
    const second = await createPaymentOrder(uidOf(app), "FARMER");

    expect(second.orderId).toBe(first.orderId);
    // Order is only created once; the refresh/double-click reuses it.
    expect(createRazorpayOrder).toHaveBeenCalledTimes(1);
  });

  it("✓ Already paid application — cannot create a new order (409)", async () => {
    const app = await createCompleteDraft();
    await GramSahakariApplication.findByIdAndUpdate(app._id, {
      paymentStatus: "PAID",
      paymentVerified: true,
      status: "SUBMITTED",
    });
    await expect(createPaymentOrder(uidOf(app), "FARMER")).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("✓ Razorpay timeout / SDK failure — surfaces 502", async () => {
    const app = await createCompleteDraft();
    vi.mocked(createRazorpayOrder).mockRejectedValueOnce(
      new AppError("Unable to reach the payment gateway. Please try again.", 502)
    );
    await expect(createPaymentOrder(uidOf(app), "FARMER")).rejects.toMatchObject({
      statusCode: 502,
    });
  });
});

describe("Payment: verify", () => {
  it("✓ Verify payment — valid signature marks PAID + SUBMITTED", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    const res = await verifyPayment(
      uidOf(app),
      {
        razorpay_order_id: "order_test_123",
        razorpay_payment_id: "pay_test_1",
        razorpay_signature: sign("order_test_123", "pay_test_1"),
      },
      "FARMER"
    );

    expect(res.paymentStatus).toBe("PAID");
    expect(res.status).toBe("SUBMITTED");
    expect(res.paymentVerified).toBe(true);
    expect(res.razorpayPaymentId).toBe("pay_test_1");
    expect(res.paidAt).not.toBeNull();

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentMethod).toBe("upi");
    expect(fresh?.submittedAt).not.toBeNull();
  });

  it("✓ Invalid signature — returns 400 and does NOT update the database", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    await expect(
      verifyPayment(
        uidOf(app),
        {
          razorpay_order_id: "order_test_123",
          razorpay_payment_id: "pay_test_1",
          razorpay_signature: "deadbeef_invalid",
        },
        "FARMER"
      )
    ).rejects.toMatchObject({ statusCode: 400 });

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentStatus).toBe("PENDING");
    expect(fresh?.paymentVerified).toBe(false);
    expect(fresh?.status).toBe("PAYMENT_PENDING");
  });

  it("✓ Wrong authenticated user — cannot verify another user's order (404)", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");
    const attacker = new mongoose.Types.ObjectId().toString();

    await expect(
      verifyPayment(
        attacker,
        {
          razorpay_order_id: "order_test_123",
          razorpay_payment_id: "pay_test_1",
          razorpay_signature: sign("order_test_123", "pay_test_1"),
        },
        "FARMER"
      )
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("✓ Order id mismatch — rejects with 400", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    await expect(
      verifyPayment(
        uidOf(app),
        {
          razorpay_order_id: "order_someone_else",
          razorpay_payment_id: "pay_test_1",
          razorpay_signature: sign("order_someone_else", "pay_test_1"),
        },
        "FARMER"
      )
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("✓ Duplicate verification — second verify is idempotent (no double write)", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");
    const body = {
      razorpay_order_id: "order_test_123",
      razorpay_payment_id: "pay_test_1",
      razorpay_signature: sign("order_test_123", "pay_test_1"),
    };

    const first = await verifyPayment(uidOf(app), body, "FARMER");
    const second = await verifyPayment(uidOf(app), body, "FARMER");
    expect(first.paymentStatus).toBe("PAID");
    expect(second.paymentStatus).toBe("PAID");

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    const completed = (fresh?.paymentEvents ?? []).filter(
      (e) => e.type === "PAYMENT_COMPLETED"
    );
    expect(completed).toHaveLength(1);
  });

  it("✓ Concurrent verify requests — exactly one write, both resolve", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");
    const body = {
      razorpay_order_id: "order_test_123",
      razorpay_payment_id: "pay_test_1",
      razorpay_signature: sign("order_test_123", "pay_test_1"),
    };

    const results = await Promise.allSettled([
      verifyPayment(uidOf(app), body, "FARMER"),
      verifyPayment(uidOf(app), body, "FARMER"),
    ]);

    expect(results.every((r) => r.status === "fulfilled")).toBe(true);

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentStatus).toBe("PAID");
    const completed = (fresh?.paymentEvents ?? []).filter(
      (e) => e.type === "PAYMENT_COMPLETED"
    );
    expect(completed).toHaveLength(1);
  });
});

describe("Payment: failure & retry", () => {
  it("✓ User closes checkout / Payment failed — stores reason, increments attempts, stays PAYMENT_PENDING", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    const res = await recordPaymentFailure(
      uidOf(app),
      { reason: "User closed the checkout modal." },
      "FARMER"
    );

    expect(res.paymentStatus).toBe("FAILED");
    expect(res.status).toBe("PAYMENT_PENDING");
    expect(res.paymentAttemptCount).toBe(1);
    expect(res.paymentFailureReason).toBe("User closed the checkout modal.");
  });

  it("✓ Retry payment — after a failure, a new order can be created and verified", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");
    await recordPaymentFailure(uidOf(app), { reason: "Card declined." }, "FARMER");

    // Retry: create a new order (state is PAYMENT_PENDING/FAILED, not PAID).
    const retry = await createPaymentOrder(uidOf(app), "FARMER");
    expect(retry.orderId).toBe("order_test_123");

    const res = await verifyPayment(
      uidOf(app),
      {
        razorpay_order_id: "order_test_123",
        razorpay_payment_id: "pay_retry_1",
        razorpay_signature: sign("order_test_123", "pay_retry_1"),
      },
      "FARMER"
    );
    expect(res.paymentStatus).toBe("PAID");
  });

  it("✓ Failure without create-order — rejects 400 (no order to fail against)", async () => {
    const app = await createCompleteDraft();

    await expect(
      recordPaymentFailure(uidOf(app), { reason: "User closed checkout." }, "FARMER")
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "No payment order found. Create an order first.",
    });

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.razorpayOrderId ?? null).toBeNull();
    expect(fresh?.paymentStatus).toBe("PENDING");
  });

  it("✓ Failure cannot poison razorpayOrderId — DB order unchanged", async () => {
    const victim = await createCompleteDraft();
    await createPaymentOrder(uidOf(victim), "FARMER");

    const attacker = await createCompleteDraft();
    // Attacker submitted for payment but never called create-order.
    expect(attacker.razorpayOrderId ?? null).toBeNull();

    await expect(
      recordPaymentFailure(uidOf(attacker), { reason: "cancelled" }, "FARMER")
    ).rejects.toMatchObject({ statusCode: 400 });

    const attackerFresh = await GramSahakariApplication.findById(attacker._id).lean();
    expect(attackerFresh?.razorpayOrderId ?? null).toBeNull();

    const victimFresh = await GramSahakariApplication.findById(victim._id).lean();
    expect(victimFresh?.razorpayOrderId).toBe("order_test_123");
  });

  it("✓ Duplicate razorpayOrderId across applications — rejected by unique index", async () => {
    const first = await createCompleteDraft();
    await createPaymentOrder(uidOf(first), "FARMER");

    const second = await createCompleteDraft();
    await expect(
      GramSahakariApplication.findByIdAndUpdate(
        second._id,
        { $set: { razorpayOrderId: "order_test_123", paymentStatus: "PENDING" } },
        { new: true }
      )
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("✓ Failure after paid — cannot overwrite a completed payment (409)", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");
    await verifyPayment(
      uidOf(app),
      {
        razorpay_order_id: "order_test_123",
        razorpay_payment_id: "pay_test_1",
        razorpay_signature: sign("order_test_123", "pay_test_1"),
      },
      "FARMER"
    );

    await expect(
      recordPaymentFailure(uidOf(app), { reason: "late failure" }, "FARMER")
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("Payment: details", () => {
  it("✓ Payment details — returns the stored payment information", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    const details = await getPaymentDetails(uidOf(app));
    expect(details.applicationNumber).toBe(app.applicationNumber);
    expect(details.paymentStatus).toBe("PENDING");
    expect(details.razorpayOrderId).toBe("order_test_123");
    expect(details.paymentAmount).toBe(REGISTRATION_FEE_PAISE);
    expect(details.paymentCurrency).toBe("INR");
  });

  it("✓ Details for missing application — throws 404", async () => {
    await expect(
      getPaymentDetails(new mongoose.Types.ObjectId().toString())
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
