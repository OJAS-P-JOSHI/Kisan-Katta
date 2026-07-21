/**
 * Phase 5A.3 — Business flow restructure tests.
 * DRAFT → PAYMENT_PENDING → SUBMITTED; edit rules; simplified validation.
 */
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
import crypto from "crypto";

vi.mock("../src/modules/payment/service/razorpay.service", async (importActual) => {
  const actual = await importActual<
    typeof import("../src/modules/payment/service/razorpay.service")
  >();
  return {
    ...actual,
    createRazorpayOrder: vi.fn(
      async (params: { amount: number; currency: string }) => ({
        id: "order_flow_001",
        amount: params.amount,
        currency: params.currency,
      })
    ),
    fetchPaymentMethod: vi.fn(async () => "upi"),
  };
});

import { AuthUser } from "../src/modules/auth/auth.model";
import { GramSahakariApplication } from "../src/modules/gram-sahakari/gram-sahakari.model";
import {
  startApplication,
  submitApplication,
  updateMyApplication,
} from "../src/modules/gram-sahakari/service/application.service";
import {
  createPaymentOrder,
  recordPaymentFailure,
  verifyPayment,
} from "../src/modules/payment/service/payment.service";

const SECRET = "test_secret_key";
const doc = () => ({ url: "https://x/y.png", publicId: "kisan/y" });
const sign = (orderId: string, paymentId: string) =>
  crypto.createHmac("sha256", SECRET).update(`${orderId}|${paymentId}`).digest("hex");

let mongo: MongoMemoryServer;

const fillRequired = async (userId: string) => {
  await updateMyApplication(
    userId,
    {
      fullName: "Flow Farmer",
      gender: "MALE",
      dob: "1990-01-01",
      district: "Pune",
      taluka: "Haveli",
      village: "Wagholi",
      address: "123 Road",
      pincode: "411001",
      aadhaarNumber: "123412341234",
      bankAccountHolder: "Flow Farmer",
      bankAccountNumber: "123456789012",
      bankIFSC: "HDFC0000053",
      bankName: "HDFC Bank",
    },
    "FARMER"
  );

  await GramSahakariApplication.updateOne(
    { userId },
    {
      aadhaarFront: doc(),
      aadhaarBack: doc(),
      cancelledChequeImage: doc(),
    }
  );
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "business-flow" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await GramSahakariApplication.deleteMany({});
  await AuthUser.deleteMany({});
  vi.clearAllMocks();
});

describe("Phase 5A.3 business flow", () => {
  it("✓ Draft creation", async () => {
    const user = await AuthUser.create({
      mobile: "9000000001",
      role: "FARMER",
      isVerified: true,
    });
    const app = await startApplication(String(user._id), "FARMER");
    expect(app.status).toBe("DRAFT");
    expect(app.paymentStatus).toBe("NOT_REQUIRED");
  });

  it("✓ Draft editing allowed", async () => {
    const user = await AuthUser.create({
      mobile: "9000000002",
      role: "FARMER",
      isVerified: true,
    });
    await startApplication(String(user._id), "FARMER");
    const updated = await updateMyApplication(
      String(user._id),
      { fullName: "Edited Name" },
      "FARMER"
    );
    expect(updated.fullName).toBe("Edited Name");
    expect(updated.status).toBe("DRAFT");
  });

  it("✓ Submit → PAYMENT_PENDING (not SUBMITTED)", async () => {
    const user = await AuthUser.create({
      mobile: "9000000003",
      role: "FARMER",
      isVerified: true,
    });
    await startApplication(String(user._id), "FARMER");
    await fillRequired(String(user._id));

    const submitted = await submitApplication(String(user._id), "FARMER");
    expect(submitted.status).toBe("PAYMENT_PENDING");
    expect(submitted.paymentStatus).toBe("PENDING");
    expect(submitted.submittedAt).toBeNull();
  });

  it("✓ Create Order only from PAYMENT_PENDING", async () => {
    const user = await AuthUser.create({
      mobile: "9000000004",
      role: "FARMER",
      isVerified: true,
    });
    await startApplication(String(user._id), "FARMER");
    await fillRequired(String(user._id));
    await submitApplication(String(user._id), "FARMER");

    const order = await createPaymentOrder(String(user._id), "FARMER");
    expect(order.orderId).toBe("order_flow_001");
    expect(order.amount).toBe(50000);
  });

  it("✓ Payment Success → SUBMITTED + GRAM_SAHAKARI role", async () => {
    const user = await AuthUser.create({
      mobile: "9000000005",
      role: "FARMER",
      isVerified: true,
    });
    await startApplication(String(user._id), "FARMER");
    await fillRequired(String(user._id));
    await submitApplication(String(user._id), "FARMER");
    await createPaymentOrder(String(user._id), "FARMER");

    const result = await verifyPayment(
      String(user._id),
      {
        razorpay_order_id: "order_flow_001",
        razorpay_payment_id: "pay_flow_ok",
        razorpay_signature: sign("order_flow_001", "pay_flow_ok"),
      },
      "FARMER"
    );

    expect(result.status).toBe("SUBMITTED");
    expect(result.paymentStatus).toBe("PAID");

    const auth = await AuthUser.findById(user._id).lean();
    expect(auth?.role).toBe("GRAM_SAHAKARI");
  });

  it("✓ Failed Payment → stays PAYMENT_PENDING; Retry → SUBMITTED", async () => {
    const user = await AuthUser.create({
      mobile: "9000000006",
      role: "FARMER",
      isVerified: true,
    });
    await startApplication(String(user._id), "FARMER");
    await fillRequired(String(user._id));
    await submitApplication(String(user._id), "FARMER");
    await createPaymentOrder(String(user._id), "FARMER");

    const failed = await recordPaymentFailure(
      String(user._id),
      { reason: "Card declined" },
      "FARMER"
    );
    expect(failed.status).toBe("PAYMENT_PENDING");
    expect(failed.paymentStatus).toBe("FAILED");

    await createPaymentOrder(String(user._id), "FARMER");
    const paid = await verifyPayment(
      String(user._id),
      {
        razorpay_order_id: "order_flow_001",
        razorpay_payment_id: "pay_retry",
        razorpay_signature: sign("order_flow_001", "pay_retry"),
      },
      "FARMER"
    );
    expect(paid.status).toBe("SUBMITTED");
    expect(paid.paymentStatus).toBe("PAID");
  });

  it("✓ Editing PAYMENT_PENDING rejected", async () => {
    const user = await AuthUser.create({
      mobile: "9000000007",
      role: "FARMER",
      isVerified: true,
    });
    await startApplication(String(user._id), "FARMER");
    await fillRequired(String(user._id));
    await submitApplication(String(user._id), "FARMER");

    await expect(
      updateMyApplication(String(user._id), { fullName: "Nope" }, "FARMER")
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("✓ Editing SUBMITTED rejected", async () => {
    const user = await AuthUser.create({
      mobile: "9000000008",
      role: "FARMER",
      isVerified: true,
    });
    await startApplication(String(user._id), "FARMER");
    await fillRequired(String(user._id));
    await submitApplication(String(user._id), "FARMER");
    await createPaymentOrder(String(user._id), "FARMER");
    await verifyPayment(
      String(user._id),
      {
        razorpay_order_id: "order_flow_001",
        razorpay_payment_id: "pay_done",
        razorpay_signature: sign("order_flow_001", "pay_done"),
      },
      "FARMER"
    );

    await expect(
      updateMyApplication(String(user._id), { fullName: "Nope" }, "FARMER")
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("✓ Required-only fields are sufficient for submit", async () => {
    const user = await AuthUser.create({
      mobile: "9000000009",
      role: "FARMER",
      isVerified: true,
    });
    await startApplication(String(user._id), "FARMER");
    await fillRequired(String(user._id));

    const submitted = await submitApplication(String(user._id), "FARMER");
    expect(submitted.status).toBe("PAYMENT_PENDING");
  });

  it("✓ Never SUBMITTED + PENDING", async () => {
    const user = await AuthUser.create({
      mobile: "9000000010",
      role: "FARMER",
      isVerified: true,
    });
    await startApplication(String(user._id), "FARMER");
    await fillRequired(String(user._id));
    const afterSubmit = await submitApplication(String(user._id), "FARMER");
    expect(afterSubmit.status).not.toBe("SUBMITTED");
    expect(
      afterSubmit.status === "PAYMENT_PENDING" && afterSubmit.paymentStatus === "PENDING"
    ).toBe(true);
  });
});
