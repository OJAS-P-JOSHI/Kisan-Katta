/**
 * Phase 5A.2 — Production readiness audit suite.
 * HTTP-level + DB-level verification of the full payment engine.
 */
import crypto from "crypto";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("../src/modules/payment/service/razorpay.service", async (importActual) => {
  const actual = await importActual<
    typeof import("../src/modules/payment/service/razorpay.service")
  >();
  return {
    ...actual,
    createRazorpayOrder: vi.fn(
      async (params: { amount: number; currency: string }) => ({
        id: "order_audit_001",
        amount: params.amount,
        currency: params.currency,
      })
    ),
    fetchPaymentMethod: vi.fn(async () => "upi"),
    fetchOrderPayments: vi.fn(async () => []),
  };
});

import { createApp } from "../src/app";
import { AuthUser } from "../src/modules/auth/auth.model";
import { signToken } from "../src/modules/auth/jwt.service";
import { GramSahakariApplication } from "../src/modules/gram-sahakari/gram-sahakari.model";
import { RazorpayEvent } from "../src/modules/payment/payment-event.model";
import { REGISTRATION_FEE_PAISE } from "../src/modules/payment/payment.constants";
import { claimEvent } from "../src/modules/payment/repository/event.repository";
import { verifyPayment } from "../src/modules/payment/service/payment.service";
import { fetchOrderPayments } from "../src/modules/payment/service/razorpay.service";

const PAYMENT_SECRET = "test_secret_key";
const WEBHOOK_SECRET = "test_webhook_secret";
const BASE = "/api/v1/gram-sahakari";
const doc = () => ({ url: "https://x/y.png", publicId: "kisan/y" });

const signPayment = (orderId: string, paymentId: string): string =>
  crypto.createHmac("sha256", PAYMENT_SECRET).update(`${orderId}|${paymentId}`).digest("hex");

const signWebhook = (raw: string): string =>
  crypto.createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");

let mongo: MongoMemoryServer;
let app: ReturnType<typeof createApp>;
let seq = 0;

const createFarmer = async () => {
  const mobile = `98765${String(seq++).padStart(5, "0")}`;
  const user = await AuthUser.create({ mobile, role: "FARMER", isVerified: true });
  const token = signToken({ userId: String(user._id), mobile });
  return { user, token, userId: String(user._id) };
};

const createAdmin = async () => {
  const mobile = `99999${String(seq++).padStart(5, "0")}`;
  const user = await AuthUser.create({ mobile, role: "ADMIN", isVerified: true });
  const token = signToken({ userId: String(user._id), mobile });
  return { user, token, userId: String(user._id) };
};

const createCompleteApplication = async (userId: string) =>
  GramSahakariApplication.create({
    applicationNumber: `GS-2026-${String(seq++).padStart(6, "0")}`,
    userId: new mongoose.Types.ObjectId(userId),
    status: "PAYMENT_PENDING",
    paymentStatus: "PENDING",
    fullName: "Audit Farmer",
    phone: "9876543210",
    email: "audit@example.com",
    gender: "MALE",
    dob: new Date("1990-01-01"),
    photo: doc(),
    district: "Pune",
    taluka: "Haveli",
    village: "Wagholi",
    address: "123 Road",
    pincode: "411001",
    aadhaarNumber: "123412341234",
    aadhaarFront: doc(),
    aadhaarBack: doc(),
    cancelledChequeImage: doc(),
    bankAccountHolder: "Audit Farmer",
    bankAccountNumber: "123456789012",
    bankIFSC: "HDFC0000053",
    bankName: "HDFC Bank",
  });

const webhookBody = (event: string, over: Record<string, unknown> = {}) => ({
  event,
  payload: {
    payment: {
      entity: {
        id: "pay_wh_audit",
        order_id: "order_audit_001",
        method: "upi",
        amount: REGISTRATION_FEE_PAISE,
        currency: "INR",
        status: "captured",
        ...over,
      },
    },
  },
});

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "payment-audit" });
  app = createApp();
  await Promise.all([GramSahakariApplication.init(), RazorpayEvent.init(), AuthUser.init()]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await Promise.all([
    GramSahakariApplication.deleteMany({}),
    RazorpayEvent.deleteMany({}),
    AuthUser.deleteMany({}),
  ]);
  vi.mocked(fetchOrderPayments).mockResolvedValue([]);
  vi.clearAllMocks();
});

describe("PART 1 — HTTP API validation", () => {
  it("POST create-order → 201 with order payload", async () => {
    const { token, userId } = await createFarmer();
    await createCompleteApplication(userId);

    const res = await request(app)
      .post(`${BASE}/application/payment/create-order`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBe("order_audit_001");
    expect(res.body.data.amount).toBe(REGISTRATION_FEE_PAISE);
    expect(res.body.data.key).toBeTruthy();
  });

  it("POST create-order without auth → 401", async () => {
    const res = await request(app).post(`${BASE}/application/payment/create-order`).send();
    expect(res.status).toBe(401);
  });

  it("POST verify with valid signature → 200 PAID", async () => {
    const { token, userId } = await createFarmer();
    await createCompleteApplication(userId);
    await request(app)
      .post(`${BASE}/application/payment/create-order`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .post(`${BASE}/application/payment/verify`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        razorpay_order_id: "order_audit_001",
        razorpay_payment_id: "pay_audit_1",
        razorpay_signature: signPayment("order_audit_001", "pay_audit_1"),
      });

    expect(res.status).toBe(200);
    expect(res.body.data.paymentStatus).toBe("PAID");
    expect(res.body.data.status).toBe("SUBMITTED");
  });

  it("POST verify invalid signature → 400, DB unchanged", async () => {
    const { token, userId } = await createFarmer();
    await createCompleteApplication(userId);
    await request(app)
      .post(`${BASE}/application/payment/create-order`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .post(`${BASE}/application/payment/verify`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        razorpay_order_id: "order_audit_001",
        razorpay_payment_id: "pay_audit_1",
        razorpay_signature: "bad_sig",
      });

    expect(res.status).toBe(400);
    const appDoc = await GramSahakariApplication.findOne({ userId }).lean();
    expect(appDoc?.paymentStatus).toBe("PENDING");
  });

  it("POST failure without create-order → 400", async () => {
    const { token, userId } = await createFarmer();
    await createCompleteApplication(userId);

    const res = await request(app)
      .post(`${BASE}/application/payment/failure`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "User closed checkout" });

    expect(res.status).toBe(400);
  });

  it("POST failure rejects client-supplied payment identity fields → 400", async () => {
    const { token, userId } = await createFarmer();
    await createCompleteApplication(userId);
    await request(app)
      .post(`${BASE}/application/payment/create-order`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .post(`${BASE}/application/payment/failure`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        reason: "User closed checkout",
        razorpay_order_id: "order_someone_else",
        razorpay_payment_id: "pay_malicious",
      });

    expect(res.status).toBe(400);
  });

  it("POST failure → 200 FAILED, attempt count incremented", async () => {
    const { token, userId } = await createFarmer();
    await createCompleteApplication(userId);
    await request(app)
      .post(`${BASE}/application/payment/create-order`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .post(`${BASE}/application/payment/failure`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "User closed checkout" });

    expect(res.status).toBe(200);
    expect(res.body.data.paymentStatus).toBe("FAILED");
    expect(res.body.data.paymentAttemptCount).toBe(1);
    expect(res.body.data.status).toBe("PAYMENT_PENDING");
  });

  it("POST webhook valid signature → 200", async () => {
    const { userId } = await createFarmer();
    await createCompleteApplication(userId);
    await GramSahakariApplication.updateOne(
      { userId },
      { paymentStatus: "PENDING", razorpayOrderId: "order_audit_001", paymentAmount: REGISTRATION_FEE_PAISE }
    );

    const body = webhookBody("payment.captured");
    const raw = JSON.stringify(body);
    const res = await request(app)
      .post(`${BASE}/application/payment/webhook`)
      .set("X-Razorpay-Signature", signWebhook(raw))
      .set("X-Razorpay-Event-Id", "evt_http_1")
      .set("Content-Type", "application/json")
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.data.received).toBe(true);
  });

  it("POST webhook invalid signature → 400", async () => {
    const body = webhookBody("payment.captured");
    const res = await request(app)
      .post(`${BASE}/application/payment/webhook`)
      .set("X-Razorpay-Signature", "bad")
      .send(body);
    expect(res.status).toBe(400);
  });

  it("GET details → 200 with timeline and meta", async () => {
    const { token, userId } = await createFarmer();
    await createCompleteApplication(userId);
    await request(app)
      .post(`${BASE}/application/payment/create-order`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .get(`${BASE}/application/payment/details`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.razorpayOrderId).toBe("order_audit_001");
    expect(Array.isArray(res.body.data.events)).toBe(true);
    // paymentMeta is populated on completion (verify/webhook), not at order creation.
    expect(res.body.data.meta.paymentGateway).toBeNull();
  });

  it("GET reconcile admin only → 403 for farmer, 200 for admin", async () => {
    const farmer = await createFarmer();
    const admin = await createAdmin();
    const appDoc = await createCompleteApplication(farmer.userId);

    const forbidden = await request(app)
      .get(`${BASE}/application/payment/reconcile/${appDoc._id}`)
      .set("Authorization", `Bearer ${farmer.token}`);
    expect(forbidden.status).toBe(403);

    const ok = await request(app)
      .get(`${BASE}/application/payment/reconcile/${appDoc._id}`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(ok.status).toBe(200);
  });
});

describe("PART 2 — Complete farmer flow", () => {
  it("login → application → order → verify → webhook → details → reconcile", async () => {
    const farmer = await createFarmer();
    const admin = await createAdmin();
    await createCompleteApplication(farmer.userId);

    const orderRes = await request(app)
      .post(`${BASE}/application/payment/create-order`)
      .set("Authorization", `Bearer ${farmer.token}`);
    expect(orderRes.status).toBe(201);

    const verifyRes = await request(app)
      .post(`${BASE}/application/payment/verify`)
      .set("Authorization", `Bearer ${farmer.token}`)
      .send({
        razorpay_order_id: "order_audit_001",
        razorpay_payment_id: "pay_flow_1",
        razorpay_signature: signPayment("order_audit_001", "pay_flow_1"),
      });
    expect(verifyRes.body.data.paymentStatus).toBe("PAID");

    const body = webhookBody("payment.captured", { id: "pay_flow_1" });
    const raw = JSON.stringify(body);
    await request(app)
      .post(`${BASE}/application/payment/webhook`)
      .set("X-Razorpay-Signature", signWebhook(raw))
      .set("X-Razorpay-Event-Id", "evt_flow_dup")
      .send(body);

    const details = await request(app)
      .get(`${BASE}/application/payment/details`)
      .set("Authorization", `Bearer ${farmer.token}`);
    expect(details.body.data.paymentVerified).toBe(true);
    expect(details.body.data.paidAt).toBeTruthy();

    const appDoc = await GramSahakariApplication.findOne({ userId: farmer.userId }).lean();
    vi.mocked(fetchOrderPayments).mockResolvedValueOnce([
      {
        id: "pay_flow_1",
        orderId: "order_audit_001",
        status: "captured",
        method: "upi",
        amount: REGISTRATION_FEE_PAISE,
        currency: "INR",
        raw: {},
      },
    ]);
    const recon = await request(app)
      .get(`${BASE}/application/payment/reconcile/${appDoc!._id}`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(recon.body.data.repaired).toBe(false);
    expect(recon.body.data.currentStatus).toBe("PAID");
  });
});

describe("PART 4/5 — Security & idempotency", () => {
  it("wrong JWT → 401", async () => {
    const res = await request(app)
      .get(`${BASE}/application/payment/details`)
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
  });

  it("cross-user verify blocked (404 — no application for attacker)", async () => {
    const victim = await createFarmer();
    const attacker = await createFarmer();
    await createCompleteApplication(victim.userId);
    await request(app)
      .post(`${BASE}/application/payment/create-order`)
      .set("Authorization", `Bearer ${victim.token}`);

    const res = await request(app)
      .post(`${BASE}/application/payment/verify`)
      .set("Authorization", `Bearer ${attacker.token}`)
      .send({
        razorpay_order_id: "order_audit_001",
        razorpay_payment_id: "pay_x",
        razorpay_signature: signPayment("order_audit_001", "pay_x"),
      });
    expect(res.status).toBe(404);
  });

  it("wrong order id on verify → 400", async () => {
    const { token, userId } = await createFarmer();
    await createCompleteApplication(userId);
    await request(app)
      .post(`${BASE}/application/payment/create-order`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .post(`${BASE}/application/payment/verify`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        razorpay_order_id: "order_wrong",
        razorpay_payment_id: "pay_x",
        razorpay_signature: signPayment("order_wrong", "pay_x"),
      });
    expect(res.status).toBe(400);
  });

  it("webhook tampered amount → rejected, DB stays PENDING", async () => {
    const { userId } = await createFarmer();
    await createCompleteApplication(userId);
    await GramSahakariApplication.updateOne(
      { userId },
      { paymentStatus: "PENDING", razorpayOrderId: "order_audit_001", paymentAmount: REGISTRATION_FEE_PAISE }
    );

    const body = webhookBody("payment.captured", { amount: 100 });
    const raw = JSON.stringify(body);
    const res = await request(app)
      .post(`${BASE}/application/payment/webhook`)
      .set("X-Razorpay-Signature", signWebhook(raw))
      .set("X-Razorpay-Event-Id", "evt_bad_amount")
      .send(body);

    expect(res.status).toBe(200); // terminal AppError acked
    const appDoc = await GramSahakariApplication.findOne({ userId }).lean();
    expect(appDoc?.paymentStatus).toBe("PENDING");
  });

  it("failure on REFUNDED → 409", async () => {
    const { token, userId } = await createFarmer();
    await createCompleteApplication(userId);
    await GramSahakariApplication.updateOne(
      { userId },
      { paymentStatus: "REFUNDED", paymentVerified: true }
    );

    const res = await request(app)
      .post(`${BASE}/application/payment/failure`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "late" });
    expect(res.status).toBe(409);
  });

  it("stuck PROCESSING verify event can recover to PAID", async () => {
    const { userId } = await createFarmer();
    await createCompleteApplication(userId);
    await GramSahakariApplication.updateOne(
      { userId },
      {
        paymentStatus: "PENDING",
        razorpayOrderId: "order_audit_001",
        paymentAmount: REGISTRATION_FEE_PAISE,
        paymentCurrency: "INR",
      }
    );

    const eventId = "verify_order_audit_001_pay_stuck";
    await claimEvent(eventId, "verify", "VERIFY"); // simulates crash mid-flight

    const result = await verifyPayment(
      userId,
      {
        razorpay_order_id: "order_audit_001",
        razorpay_payment_id: "pay_stuck",
        razorpay_signature: signPayment("order_audit_001", "pay_stuck"),
      },
      "FARMER"
    );
    expect(result.paymentStatus).toBe("PAID");

    const evt = await RazorpayEvent.findOne({ razorpayEventId: eventId }).lean();
    expect(evt?.processingResult).toBe("PROCESSED");
  });
});

describe("PART 10 — Performance / concurrency", () => {
  it("20 concurrent verify → single PAYMENT_COMPLETED", async () => {
    const { token, userId } = await createFarmer();
    await createCompleteApplication(userId);
    await request(app)
      .post(`${BASE}/application/payment/create-order`)
      .set("Authorization", `Bearer ${token}`);

    const body = {
      razorpay_order_id: "order_audit_001",
      razorpay_payment_id: "pay_conc_20",
      razorpay_signature: signPayment("order_audit_001", "pay_conc_20"),
    };

    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        request(app)
          .post(`${BASE}/application/payment/verify`)
          .set("Authorization", `Bearer ${token}`)
          .send(body)
      )
    );

    expect(results.every((r) => r.status === 200)).toBe(true);
    const appDoc = await GramSahakariApplication.findOne({ userId }).lean();
    expect(appDoc?.paymentStatus).toBe("PAID");
    const completed = (appDoc?.paymentEvents ?? []).filter(
      (e) => e.type === "PAYMENT_COMPLETED"
    );
    expect(completed.length).toBe(1);
  });

  it("20 concurrent webhooks → single PAYMENT_COMPLETED", async () => {
    const { userId } = await createFarmer();
    await createCompleteApplication(userId);
    await GramSahakariApplication.updateOne(
      { userId },
      { paymentStatus: "PENDING", razorpayOrderId: "order_audit_001", paymentAmount: REGISTRATION_FEE_PAISE }
    );

    const body = webhookBody("payment.captured", { id: "pay_wh_conc" });
    const raw = JSON.stringify(body);

    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        request(app)
          .post(`${BASE}/application/payment/webhook`)
          .set("X-Razorpay-Signature", signWebhook(raw))
          .set("X-Razorpay-Event-Id", "evt_conc_wh_same")
          .send(body)
      )
    );

    expect(results.every((r) => r.status === 200)).toBe(true);
    const appDoc = await GramSahakariApplication.findOne({ userId }).lean();
    expect(appDoc?.paymentStatus).toBe("PAID");
    expect(await RazorpayEvent.countDocuments({ razorpayEventId: "evt_conc_wh_same" })).toBe(1);
  });
});
