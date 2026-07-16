import {
  FARMER_PRICE_SYNC_INTERVAL_MINUTES,
} from "./farmer-price.constants";
import { runFarmerPriceSync } from "./farmer-price.sync.service";

const LOG_PREFIX = "[FarmerPriceScheduler]";

let syncInFlight = false;
let intervalHandle: NodeJS.Timeout | null = null;

const log = (message: string): void => {
  // eslint-disable-next-line no-console
  console.log(`${LOG_PREFIX} ${message}`);
};

const runSafeSync = async (trigger: "startup" | "interval"): Promise<void> => {
  if (syncInFlight) {
    log(`Skipping ${trigger} sync — previous synchronization still running`);
    return;
  }

  syncInFlight = true;
  try {
    await runFarmerPriceSync();
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.error(`${LOG_PREFIX} Synchronization failed (${trigger}): ${reason}`);
  } finally {
    syncInFlight = false;
  }
};

/**
 * Initializes the Farmer Price poll synchronizer.
 * Runs one sync immediately, then every FARMER_PRICE_SYNC_INTERVAL_MINUTES.
 * Failures are logged and never crash the HTTP server.
 */
export const startFarmerPriceScheduler = (): void => {
  if (intervalHandle) {
    log("Scheduler already started — ignoring duplicate start");
    return;
  }

  log("Scheduler Started");
  log(`Interval: ${FARMER_PRICE_SYNC_INTERVAL_MINUTES} minute(s)`);

  void runSafeSync("startup");

  const intervalMs = FARMER_PRICE_SYNC_INTERVAL_MINUTES * 60 * 1000;
  intervalHandle = setInterval(() => {
    void runSafeSync("interval");
  }, intervalMs);

  // Allow the Node process to exit even if the timer is still scheduled
  // (useful for tests / graceful shutdown tooling).
  if (typeof intervalHandle.unref === "function") {
    intervalHandle.unref();
  }
};
