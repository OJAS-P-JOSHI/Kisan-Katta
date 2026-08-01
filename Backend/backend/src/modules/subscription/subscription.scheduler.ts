import { env } from "../../config/env";
import {
  SUBSCRIPTION_RECONCILIATION_BATCH_LIMIT,
  SUBSCRIPTION_RECONCILIATION_INTERVAL_MINUTES,
} from "./subscription.constants";
import { reconcilePendingSubscriptions } from "./service/reconciliation.service";

const LOG_PREFIX = "[SubscriptionReconciliationScheduler]";

let sweepInFlight = false;
let intervalHandle: NodeJS.Timeout | null = null;

const log = (message: string): void => {
  // eslint-disable-next-line no-console
  console.log(`${LOG_PREFIX} ${message}`);
};

const runSafeSweep = async (trigger: "startup" | "interval"): Promise<void> => {
  if (sweepInFlight) {
    log(`Skipping ${trigger} sweep — previous still running`);
    return;
  }
  sweepInFlight = true;
  try {
    const summary = await reconcilePendingSubscriptions(
      SUBSCRIPTION_RECONCILIATION_BATCH_LIMIT
    );
    if (summary.scanned > 0) {
      log(
        `Sweep (${trigger}): scanned=${summary.scanned} repaired=${summary.repaired} failed=${summary.failed}`
      );
    }
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.error(`${LOG_PREFIX} Sweep failed (${trigger}): ${reason}`);
  } finally {
    sweepInFlight = false;
  }
};

export const startSubscriptionReconciliationScheduler = (): void => {
  if (intervalHandle) return;
  if (env.nodeEnv === "test") return;
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    log("Razorpay not configured — subscription reconciliation disabled");
    return;
  }
  if (!env.razorpaySubscriptionPlanId) {
    log("Subscription plan id missing — reconciliation disabled");
    return;
  }

  log("Scheduler Started");
  log(`Interval: ${SUBSCRIPTION_RECONCILIATION_INTERVAL_MINUTES} minute(s)`);
  void runSafeSweep("startup");

  const intervalMs = SUBSCRIPTION_RECONCILIATION_INTERVAL_MINUTES * 60 * 1000;
  intervalHandle = setInterval(() => {
    void runSafeSweep("interval");
  }, intervalMs);

  if (typeof intervalHandle.unref === "function") {
    intervalHandle.unref();
  }
};
