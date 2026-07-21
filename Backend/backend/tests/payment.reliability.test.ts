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

// Real signature verification (verify + webhook); stub only network calls.
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
    fetchOrderPayments: vi.fn(async () => []),
    fetchPayment: vi.fn(async () => ({
      id: "pay_test_1",
      orderId: "order_test_123",
      status: "captured",
      method: "upi",
      amount: 50000,
      currency: "INR",
      raw: {},
    })),
  };
});

import { GramSahakariApplication } from "../src/modules/gram-sahakari/gram-sahakari.model";
import { RazorpayEvent } from "../src/modules/payment/payment-event.model";
import {
  createPaymentOrder,
  verifyPayment,
} from "../src/modules/payment/service/payment.service";
import { handleWebhook } from "../src/modules/payment/service/webhook.service";
import {
  reconcileApplication,
  reconcilePendingPayments,
} from "../src/modules/payment/service/reconciliation.service";
import { fetchOrderPayments, createRazorpayOrder } from "../src/modules/payment/service/razorpay.service";

const PAYMENT_SECRET = "test_secret_key";
const WEBHOOK_SECRET = "test_webhook_secret";
const ORDER_ID = "order_test_123";
const doc = () => ({ url: "https://x/y.png", publicId: "kisan/y" });

const signPayment = (orderId: string, paymentId: string): string =>
  crypto.createHmac("sha256", PAYMENT_SECRET).update(`${orderId}|${paymentId}`).digest("hex");

let mongo: MongoMemoryServer;
let seq = 0;

const createCompleteDraft = async () => {
  seq += 1;
  return GramSahakariApplication.create({
    applicationNumber: `GS-2026-${String(seq).padStart(6, "0")}`,
    userId: new mongoose.Types.ObjectId(),
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

/** Builds a signed webhook body and delivers it through the handler. */
const deliver = (
  body: Record<string, unknown>,
  eventId: string,
  overrideSignature?: string
) => {
  const raw = JSON.stringify(body);
  const signature =
    overrideSignature ??
    crypto.createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
  return handleWebhook(raw, signature, eventId, body);
};

const paymentEntity = (over: Record<string, unknown> = {}) => ({
  entity: {
    id: "pay_wh_1",
    order_id: ORDER_ID,
    method: "upi",
    amount: 50000,
    currency: "INR",
    status: "captured",
    ...over,
  },
});

const capturedBody = (over: Record<string, unknown> = {}) => ({
  event: "payment.captured",
  payload: { payment: paymentEntity(over) },
});

const countEvents = async (appId: unknown, type: string): Promise<number> => {
  const fresh = await GramSahakariApplication.findById(appId).lean();
  return (fresh?.paymentEvents ?? []).filter((e) => e.type === type).length;
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "kisan-katta-reliability" });
  await Promise.all([GramSahakariApplication.init(), RazorpayEvent.init()]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await GramSahakariApplication.deleteMany({});
  await RazorpayEvent.deleteMany({});
  vi.mocked(fetchOrderPayments).mockResolvedValue([]);
  vi.clearAllMocks();
});

describe("Webhook: event handling", () => {
  it("✓ payment.captured → PAID + SUBMITTED", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    const res = await deliver(capturedBody(), "evt_cap_1");
    expect(res.status).toBe("ok");

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentStatus).toBe("PAID");
    expect(fresh?.status).toBe("SUBMITTED");
    expect(fresh?.paymentMeta?.processingSource).toBe("WEBHOOK");
  });

  it("✓ payment.authorized → AUTHORIZED (application stays PAYMENT_PENDING)", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    const res = await deliver(
      { event: "payment.authorized", payload: { payment: paymentEntity({ status: "authorized" }) } },
      "evt_auth_1"
    );
    expect(res.status).toBe("ok");

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentStatus).toBe("AUTHORIZED");
    expect(fresh?.status).toBe("PAYMENT_PENDING");
  });

  it("✓ payment.failed → FAILED", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    const res = await deliver(
      {
        event: "payment.failed",
        payload: {
          payment: paymentEntity({ status: "failed", error_description: "card declined" }),
        },
      },
      "evt_fail_1"
    );
    expect(res.status).toBe("ok");

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentStatus).toBe("FAILED");
    expect(fresh?.paymentFailureReason).toBe("card declined");
  });

  it("✓ order.paid → PAID", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    const res = await deliver(
      {
        event: "order.paid",
        payload: {
          order: { entity: { id: ORDER_ID, amount: 50000 } },
          payment: paymentEntity(),
        },
      },
      "evt_orderpaid_1"
    );
    expect(res.status).toBe("ok");

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentStatus).toBe("PAID");
  });

  it("✓ refund.created keeps PAID and records timeline", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");
    await deliver(capturedBody(), "evt_cap_r1");

    const res = await deliver(
      {
        event: "refund.created",
        payload: { refund: { entity: { id: "rfnd_1", payment_id: "pay_wh_1", order_id: ORDER_ID } } },
      },
      "evt_refund_created_1"
    );
    expect(res.status).toBe("ok");

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentStatus).toBe("PAID");
    expect(await countEvents(app._id, "REFUND_CREATED")).toBe(1);
    expect(fresh?.refundId).toBe("rfnd_1");
  });

  it("✓ refund.processed → REFUNDED", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");
    await deliver(capturedBody(), "evt_cap_r2");

    const res = await deliver(
      {
        event: "refund.processed",
        payload: { refund: { entity: { id: "rfnd_2", payment_id: "pay_wh_1", order_id: ORDER_ID } } },
      },
      "evt_refund_processed_1"
    );
    expect(res.status).toBe("ok");

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentStatus).toBe("REFUNDED");
    expect(fresh?.refundedAt).not.toBeNull();
  });

  it("✓ unsupported event → ignored (200)", async () => {
    const res = await deliver({ event: "payment.dispute.created", payload: {} }, "evt_unsupported_1");
    expect(res.status).toBe("ignored");
    expect(res.httpStatus).toBe(200);
  });

  it("✓ malformed payload → ignored, never throws", async () => {
    const res = await deliver({ nonsense: true }, "evt_malformed_1");
    expect(res.httpStatus).toBe(200);
    expect(["ignored", "duplicate"]).toContain(res.status);
  });
});

describe("Webhook: security", () => {
  it("✓ invalid webhook signature → rejected 400, no DB change", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    const res = await deliver(capturedBody(), "evt_badsig_1", "totally_wrong_signature");
    expect(res.status).toBe("rejected");
    expect(res.httpStatus).toBe(400);

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentStatus).toBe("PENDING");
  });

  it("✓ replay attack → same event id is deduped, processed once", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    const first = await deliver(capturedBody(), "evt_replay_1");
    const replay = await deliver(capturedBody(), "evt_replay_1");

    expect(first.status).toBe("ok");
    expect(replay.status).toBe("duplicate");
    expect(await countEvents(app._id, "PAYMENT_COMPLETED")).toBe(1);
  });

  it("✓ duplicate event IDs (different payloads) → second deduped", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    const first = await deliver(capturedBody(), "evt_dupid_1");
    const second = await deliver(
      capturedBody({ id: "pay_wh_other" }),
      "evt_dupid_1"
    );
    expect(first.status).toBe("ok");
    expect(second.status).toBe("duplicate");
  });
});

describe("Idempotency & ordering", () => {
  it("✓ AUTHORIZED stores pay_A; verify with pay_B on same order still succeeds", async () => {
    // Regression: payment.authorized persists the first attempt's payment id.
    // A later successful Checkout attempt gets a new payment id on the same
    // order. completePayment must not 400 on that mismatch unless already PAID.
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    await deliver(
      {
        event: "payment.authorized",
        payload: {
          payment: paymentEntity({ id: "pay_attempt_1", status: "authorized" }),
        },
      },
      "evt_stale_auth_1"
    );

    const mid = await GramSahakariApplication.findById(app._id).lean();
    expect(mid?.paymentStatus).toBe("AUTHORIZED");
    expect(mid?.razorpayPaymentId).toBe("pay_attempt_1");

    const res = await verifyPayment(
      uidOf(app),
      {
        razorpay_order_id: ORDER_ID,
        razorpay_payment_id: "pay_attempt_2",
        razorpay_signature: signPayment(ORDER_ID, "pay_attempt_2"),
      },
      "FARMER"
    );

    expect(res.paymentStatus).toBe("PAID");
    expect(res.razorpayPaymentId).toBe("pay_attempt_2");
  });

  it("✓ new order after FAILED unsets stale payment id; verify uses the new order", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");
    await deliver(
      {
        event: "payment.failed",
        payload: {
          payment: paymentEntity({ id: "pay_stale_old", status: "failed" }),
        },
      },
      "evt_stale_fail_1"
    );

    const afterFail = await GramSahakariApplication.findById(app._id).lean();
    expect(afterFail?.paymentStatus).toBe("FAILED");
    // FAILED events must not write payment identity from the webhook payload.
    expect(afterFail?.razorpayPaymentId ?? null).toBeNull();

    vi.mocked(createRazorpayOrder).mockResolvedValueOnce({
      id: "order_fresh_456",
      amount: 50000,
      currency: "INR",
    });

    const order = await createPaymentOrder(uidOf(app), "FARMER");
    expect(order.orderId).toBe("order_fresh_456");

    const mid = await GramSahakariApplication.findById(app._id).lean();
    expect(mid?.razorpayOrderId).toBe("order_fresh_456");
    expect(mid?.razorpayPaymentId ?? null).toBeNull();

    const res = await verifyPayment(
      uidOf(app),
      {
        razorpay_order_id: "order_fresh_456",
        razorpay_payment_id: "pay_fresh_new",
        razorpay_signature: signPayment("order_fresh_456", "pay_fresh_new"),
      },
      "FARMER"
    );

    expect(res.paymentStatus).toBe("PAID");
    expect(res.razorpayPaymentId).toBe("pay_fresh_new");
  });

  it("✓ duplicate webhook delivery → no double processing", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    await deliver(capturedBody(), "evt_dup_1");
    await deliver(capturedBody(), "evt_dup_1");

    expect(await countEvents(app._id, "PAYMENT_COMPLETED")).toBe(1);
    expect(await RazorpayEvent.countDocuments({ razorpayEventId: "evt_dup_1" })).toBe(1);
  });

  it("✓ webhook before verify → verify is idempotent", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    await deliver(capturedBody({ id: "pay_wh_1" }), "evt_wbv_1");

    const res = await verifyPayment(
      uidOf(app),
      {
        razorpay_order_id: ORDER_ID,
        razorpay_payment_id: "pay_wh_1",
        razorpay_signature: signPayment(ORDER_ID, "pay_wh_1"),
      },
      "FARMER"
    );
    expect(res.paymentStatus).toBe("PAID");
    expect(await countEvents(app._id, "PAYMENT_COMPLETED")).toBe(1);
  });

  it("✓ webhook wins → verify returns completed state without re-running completion", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    // Webhook finalizes the payment first (the race the bug fix targets).
    await deliver(capturedBody({ id: "pay_wh_1" }), "evt_race_1");

    // Verify arrives afterwards. It must report success (SUBMITTED + PAID)...
    const res = await verifyPayment(
      uidOf(app),
      {
        razorpay_order_id: ORDER_ID,
        razorpay_payment_id: "pay_wh_1",
        razorpay_signature: signPayment(ORDER_ID, "pay_wh_1"),
      },
      "FARMER"
    );
    expect(res.status).toBe("SUBMITTED");
    expect(res.paymentStatus).toBe("PAID");
    expect(res.paymentVerified).toBe(true);

    // ...and it must short-circuit BEFORE completePayment(): no verify ledger
    // entry, no duplicated timeline events, still exactly one completion.
    expect(
      await RazorpayEvent.countDocuments({
        razorpayEventId: `verify_${ORDER_ID}_pay_wh_1`,
      })
    ).toBe(0);
    expect(await countEvents(app._id, "PAYMENT_COMPLETED")).toBe(1);
    expect(await countEvents(app._id, "VERIFY_SUCCESS")).toBe(0);
  });

  it("✓ verify before webhook → webhook is a no-op", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    await verifyPayment(
      uidOf(app),
      {
        razorpay_order_id: ORDER_ID,
        razorpay_payment_id: "pay_wh_1",
        razorpay_signature: signPayment(ORDER_ID, "pay_wh_1"),
      },
      "FARMER"
    );

    const res = await deliver(capturedBody({ id: "pay_wh_1" }), "evt_vbw_1");
    expect(res.status).toBe("ok");
    expect(await countEvents(app._id, "PAYMENT_COMPLETED")).toBe(1);
  });

  it("✓ simultaneous webhook and verify → exactly one completion", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    const results = await Promise.allSettled([
      verifyPayment(
        uidOf(app),
        {
          razorpay_order_id: ORDER_ID,
          razorpay_payment_id: "pay_wh_1",
          razorpay_signature: signPayment(ORDER_ID, "pay_wh_1"),
        },
        "FARMER"
      ),
      deliver(capturedBody({ id: "pay_wh_1" }), "evt_sim_1"),
    ]);

    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentStatus).toBe("PAID");
    expect(await countEvents(app._id, "PAYMENT_COMPLETED")).toBe(1);
  });

  it("✓ concurrent duplicate webhooks → single completion", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    const results = await Promise.allSettled([
      deliver(capturedBody(), "evt_conc_1"),
      deliver(capturedBody(), "evt_conc_1"),
    ]);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(await countEvents(app._id, "PAYMENT_COMPLETED")).toBe(1);
  });

  it("✓ webhook crash recovery → stuck PROCESSING claim is retried and completed", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    // Simulate a previous delivery that claimed the event and then crashed
    // before finalizing: a ledger row stuck in PROCESSING, payment still PENDING.
    await RazorpayEvent.create({
      razorpayEventId: "evt_crash_1",
      eventType: "payment.captured",
      deliverySource: "WEBHOOK",
      processingResult: "PROCESSING",
      receivedAt: new Date(),
    });

    // Razorpay re-delivers the same event id after the crash.
    const res = await deliver(capturedBody(), "evt_crash_1");
    expect(res.status).toBe("ok");

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentStatus).toBe("PAID");
    expect(fresh?.status).toBe("SUBMITTED");
    expect(await countEvents(app._id, "PAYMENT_COMPLETED")).toBe(1);

    const ledger = await RazorpayEvent.findOne({
      razorpayEventId: "evt_crash_1",
    }).lean();
    expect(ledger?.processingResult).toBe("PROCESSED");
  });

  it("✓ backend restart simulation → persisted dedup survives", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");
    await deliver(capturedBody(), "evt_restart_1");

    // "Restart": there is no in-memory state — re-deliver the same event.
    const afterRestart = await deliver(capturedBody(), "evt_restart_1");
    expect(afterRestart.status).toBe("duplicate");
    expect(await countEvents(app._id, "PAYMENT_COMPLETED")).toBe(1);
  });
});

describe("State machine", () => {
  it("✓ invalid transition (FAILED → AUTHORIZED) is rejected, DB unchanged", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");
    await deliver(
      { event: "payment.failed", payload: { payment: paymentEntity({ status: "failed" }) } },
      "evt_sm_fail_1"
    );

    const res = await deliver(
      { event: "payment.authorized", payload: { payment: paymentEntity({ status: "authorized" }) } },
      "evt_sm_auth_1"
    );
    // Webhook acknowledges (200) but the illegal transition is not applied.
    expect(res.httpStatus).toBe(200);

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentStatus).toBe("FAILED");
  });
});

describe("Reconciliation", () => {
  it("✓ repairs DB when Razorpay shows captured but DB is PENDING", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");

    vi.mocked(fetchOrderPayments).mockResolvedValueOnce([
      {
        id: "pay_recon_1",
        orderId: ORDER_ID,
        status: "captured",
        method: "card",
        amount: 50000,
        currency: "INR",
        raw: {},
      },
    ]);

    const result = await reconcileApplication(String(app._id), {
      userId: "admin1",
      role: "ADMIN",
    });

    expect(result.repaired).toBe(true);
    expect(result.currentStatus).toBe("PAID");

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentStatus).toBe("PAID");
    expect(fresh?.status).toBe("SUBMITTED");
  });

  it("✓ no repair when Razorpay has no captured payment", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");
    vi.mocked(fetchOrderPayments).mockResolvedValueOnce([]);

    const result = await reconcileApplication(String(app._id), {
      userId: "admin1",
      role: "ADMIN",
    });
    expect(result.repaired).toBe(false);
    expect(result.currentStatus).toBe("PENDING");
  });

  it("✓ no repair when already paid", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");
    await deliver(capturedBody(), "evt_recon_paid_1");

    const result = await reconcileApplication(String(app._id), {
      userId: "admin1",
      role: "ADMIN",
    });
    expect(result.repaired).toBe(false);
    expect(result.currentStatus).toBe("PAID");
  });

  it("✓ batch reconcilePendingPayments repairs pending orders", async () => {
    const app = await createCompleteDraft();
    await createPaymentOrder(uidOf(app), "FARMER");
    vi.mocked(fetchOrderPayments).mockResolvedValue([
      {
        id: "pay_batch_1",
        orderId: ORDER_ID,
        status: "captured",
        method: "upi",
        amount: 50000,
        currency: "INR",
        raw: {},
      },
    ]);

    const summary = await reconcilePendingPayments(10);
    expect(summary.scanned).toBeGreaterThanOrEqual(1);
    expect(summary.repaired).toBeGreaterThanOrEqual(1);

    const fresh = await GramSahakariApplication.findById(app._id).lean();
    expect(fresh?.paymentStatus).toBe("PAID");
  });
});
