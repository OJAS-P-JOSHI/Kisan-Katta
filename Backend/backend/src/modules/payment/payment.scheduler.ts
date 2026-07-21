import { env } from "../../config/env";
import {
  PAYMENT_RECONCILIATION_BATCH_LIMIT,
  PAYMENT_RECONCILIATION_INTERVAL_MINUTES,
} from "./payment.constants";
import { reconcilePendingPayments } from "./service/reconciliation.service";
import { paymentDebug, paymentDebugError } from "./payment-debug";

const LOG_PREFIX = "[PaymentReconciliationScheduler]";

let sweepInFlight = false;
let intervalHandle: NodeJS.Timeout | null = null;

const log = (message: string): void => {
  // eslint-disable-next-line no-console
  console.log(`${LOG_PREFIX} ${message}`);
};

const runSafeSweep = async (
  trigger: "startup" | "interval"
): Promise<void> => {
  if (sweepInFlight) {
    log(`Skipping ${trigger} sweep — previous reconciliation still running`);
    paymentDebug("Reconciliation scheduler: sweep skipped (overlap guard)", { trigger });
    return;
  }

  sweepInFlight = true;
  paymentDebug("Reconciliation scheduler: sweep started", { trigger });
  try {
    const summary = await reconcilePendingPayments(
      PAYMENT_RECONCILIATION_BATCH_LIMIT
    );
    if (summary.scanned > 0) {
      log(
        `Sweep (${trigger}): scanned=${summary.scanned} repaired=${summary.repaired} failed=${summary.failed}`
      );
    }
    paymentDebug("Reconciliation scheduler: sweep finished", {
      trigger,
      scanned: summary.scanned,
      repaired: summary.repaired,
      failed: summary.failed,
    });
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    paymentDebugError("Reconciliation scheduler: sweep error", error, { trigger });
    // eslint-disable-next-line no-console
    console.error(`${LOG_PREFIX} Reconciliation sweep failed (${trigger}): ${reason}`);
  } finally {
    sweepInFlight = false;
  }
};

/**
 * Periodically reconciles PENDING/AUTHORIZED payments against Razorpay so that a
 * payment eventually reaches its correct final state even if the webhook never
 * arrives and the browser never calls verify. It only *reuses* the existing
 * reconciliation service — no new completion logic is introduced here.
 *
 * Disabled in tests and when Razorpay is not configured (no key secret), since a
 * sweep would only produce repeated gateway errors with nothing to reconcile.
 */
export const startPaymentReconciliationScheduler = (): void => {
  if (intervalHandle) {
    log("Scheduler already started — ignoring duplicate start");
    return;
  }

  if (env.nodeEnv === "test") {
    return;
  }

  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    log("Razorpay not configured — reconciliation scheduler disabled");
    return;
  }

  log("Scheduler Started");
  log(`Interval: ${PAYMENT_RECONCILIATION_INTERVAL_MINUTES} minute(s)`);

  // Sweep once on boot so a payment that completed while the server was down
  // (crash/restart between capture and finalization) is recovered promptly.
  void runSafeSweep("startup");

  const intervalMs = PAYMENT_RECONCILIATION_INTERVAL_MINUTES * 60 * 1000;
  intervalHandle = setInterval(() => {
    void runSafeSweep("interval");
  }, intervalMs);

  // Do not keep the Node process alive solely for this timer.
  if (typeof intervalHandle.unref === "function") {
    intervalHandle.unref();
  }
};
