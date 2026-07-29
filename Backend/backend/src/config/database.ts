import mongoose from "mongoose";
import { env } from "./env";

const MAX_CONNECT_ATTEMPTS = 5;
const RETRY_DELAY_MS = 2_000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

let connectionListenersAttached = false;

const attachConnectionListeners = (): void => {
  if (connectionListenersAttached) return;
  connectionListenersAttached = true;

  mongoose.connection.on("error", (error) => {
    // eslint-disable-next-line no-console
    console.error("[mongo] Connection error:", error);
  });

  mongoose.connection.on("disconnected", () => {
    // eslint-disable-next-line no-console
    console.warn("[mongo] Disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    // eslint-disable-next-line no-console
    console.log("[mongo] Reconnected");
  });
};

/**
 * Initializes a single Mongoose connection with retry + reconnect options.
 * Called once at server startup; HTTP traffic must wait until this resolves.
 *
 * Startup order (enforced by server.ts):
 *   1. ensure-webcrypto (globalThis.crypto for mongodb driver ≥7.2)
 *   2. connectDatabase (this module)
 *   3. seed / schedulers
 *   4. app.listen(PORT, HOST)
 */
export const connectDatabase = async (): Promise<void> => {
  mongoose.set("strictQuery", true);

  const options: mongoose.ConnectOptions = {
    serverSelectionTimeoutMS: 10_000,
    heartbeatFrequencyMS: 10_000,
    maxPoolSize: 10,
    minPoolSize: 1,
    // Atlas / Railway: fail fast on bad auth rather than hanging forever.
    connectTimeoutMS: 15_000,
  };

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt += 1) {
    try {
      await mongoose.connect(env.mongodbUri, options);
      attachConnectionListeners();
      // eslint-disable-next-line no-console
      console.log(
        `[mongo] Connected (host=${mongoose.connection.host}, attempt=${attempt})`
      );
      return;
    } catch (error) {
      lastError = error;
      // eslint-disable-next-line no-console
      console.error(
        `[mongo] Connection failed (attempt ${attempt}/${MAX_CONNECT_ATTEMPTS}):`,
        error instanceof Error ? error.message : error
      );

      if (attempt < MAX_CONNECT_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  // eslint-disable-next-line no-console
  console.error("[mongo] Exhausted connection retries");
  throw lastError;
};

/** Close the Mongoose connection cleanly (graceful shutdown). */
export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.connection.close();
  // eslint-disable-next-line no-console
  console.log("[mongo] Connection closed");
};

export const isMongoReady = (): boolean => mongoose.connection.readyState === 1;
