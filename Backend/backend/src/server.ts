/**
 * MUST be the first import in the process entrypoint.
 * Ensures `globalThis.crypto` exists before Mongoose / mongodb load.
 */
import "./config/ensure-webcrypto";

import os from "os";
import type { Server } from "http";
import { createApp } from "./app";
import { env, isProduction } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { seedSuperAdmin } from "./modules/admin/admin.service";
import { startFarmerPriceScheduler } from "./modules/farmer-price/farmer-price.scheduler";
import { startPaymentReconciliationScheduler } from "./modules/payment/payment.scheduler";
import { startSubscriptionReconciliationScheduler } from "./modules/subscription/subscription.scheduler";

const app = createApp();

const SHUTDOWN_TIMEOUT_MS = 10_000;

// Reads this machine's LAN-reachable IPv4 addresses at runtime so the
// startup log can point developers to a real, working URL instead of
// "localhost" (which only resolves to the device running the server).
const getLanAddresses = (): string[] => {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        addresses.push(entry.address);
      }
    }
  }

  return addresses;
};

const warnInsecureProductionConfig = (): void => {
  if (!isProduction()) return;

  if (!env.jwtSecret || env.jwtSecret === "changeme") {
    // eslint-disable-next-line no-console
    console.warn(
      "[env] JWT_SECRET is missing or still the default — set a strong secret in production"
    );
  }

  if (!env.mongodbUri || env.mongodbUri.includes("localhost")) {
    // eslint-disable-next-line no-console
    console.warn(
      "[env] MONGODB_URI looks like a local URI — confirm Atlas URI is set on Railway"
    );
  }
};

const startServer = async (): Promise<void> => {
  warnInsecureProductionConfig();

  // Connect to MongoDB before accepting HTTP traffic.
  // process.exit(1) is called if the DB is unreachable so the orchestrator
  // (Railway, Docker, PM2, k8s) can restart rather than serving 500s.
  await connectDatabase();

  // Idempotent SUPER_ADMIN bootstrap for the Admin Portal.
  try {
    await seedSuperAdmin();
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("[Admin] Failed to seed SUPER_ADMIN:", error);
  }

  // Maintain Farmer Price polls in the background. Failures must not
  // block HTTP startup.
  try {
    startFarmerPriceScheduler();
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("[FarmerPriceScheduler] Failed to initialize scheduler:", error);
  }

  // Safety net: eventually completes payments that never received a webhook or
  // browser verify. Failures must not block HTTP startup.
  try {
    startPaymentReconciliationScheduler();
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error(
      "[PaymentReconciliationScheduler] Failed to initialize scheduler:",
      error
    );
  }

  // Sync mobile-app Razorpay Subscriptions with local user_subscriptions.
  try {
    startSubscriptionReconciliationScheduler();
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error(
      "[SubscriptionReconciliationScheduler] Failed to initialize scheduler:",
      error
    );
  }

  // Railway injects PORT; HOST defaults to 0.0.0.0 for container networking.
  const server: Server = app.listen(env.port, env.host, () => {
    // eslint-disable-next-line no-console
    console.log(
      `[server] Kissan Agrisathi API listening on http://${env.host}:${env.port} (env=${env.nodeEnv}, node=${process.version})`
    );

    if (env.host === "0.0.0.0" && !isProduction()) {
      const lanAddresses = getLanAddresses();
      lanAddresses.forEach((address) => {
        // eslint-disable-next-line no-console
        console.log(`[server] LAN: http://${address}:${env.port}`);
      });
      // eslint-disable-next-line no-console
      console.log(`[server] Android emulator: http://10.0.2.2:${env.port}`);
    }
  });

  let isShuttingDown = false;

  const shutdown = (signal: string, exitCode = 0): void => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    // eslint-disable-next-line no-console
    console.log(`[server] ${signal} received — graceful shutdown`);

    const forceTimer = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error("[server] Shutdown timed out — forcing exit");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceTimer.unref();

    server.close((closeError) => {
      void (async () => {
        try {
          if (closeError) {
            // eslint-disable-next-line no-console
            console.error("[server] Error closing HTTP server:", closeError);
          }
          await disconnectDatabase();
          // eslint-disable-next-line no-console
          console.log("[server] Shutdown complete");
          process.exit(closeError ? 1 : exitCode);
        } catch (error: unknown) {
          // eslint-disable-next-line no-console
          console.error("[server] Error during shutdown:", error);
          process.exit(1);
        }
      })();
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM", 0));
  process.on("SIGINT", () => shutdown("SIGINT", 0));

  process.on("unhandledRejection", (reason) => {
    // eslint-disable-next-line no-console
    console.error("[server] Unhandled Rejection:", reason);
    shutdown("unhandledRejection", 1);
  });

  process.on("uncaughtException", (error) => {
    // eslint-disable-next-line no-console
    console.error("[server] Uncaught Exception:", error);
    shutdown("uncaughtException", 1);
  });
};

startServer().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error("[server] Failed to start:", error);
  process.exit(1);
});
