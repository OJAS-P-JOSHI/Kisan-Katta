import Razorpay from "razorpay";
import { env } from "./env";
import { AppError } from "../utils/AppError";

/**
 * Lazily-instantiated Razorpay client. Unlike Cloudinary (which asserts config
 * at import time), payments are an optional runtime dependency: the server must
 * still boot in environments where Razorpay keys are not provisioned. The
 * client is created on first use and reused thereafter.
 */
let client: Razorpay | null = null;

const RAZORPAY_CLIENT_DEBUG_TAG = "[RAZORPAY-DEBUG getRazorpayClient]";

export const isRazorpayConfigured = (): boolean =>
  Boolean(env.razorpayKeyId && env.razorpayKeySecret);

export const getRazorpayClient = (): Razorpay => {
  if (!isRazorpayConfigured()) {
    // eslint-disable-next-line no-console
    console.error(`${RAZORPAY_CLIENT_DEBUG_TAG} not configured`, {
      keyPresent: Boolean(env.razorpayKeyId),
      secretLength: env.razorpayKeySecret?.length ?? 0,
    });
    // 503: the dependency is unavailable/unconfigured, not a client error.
    throw new AppError("Payment gateway is not configured on the server.", 503);
  }

  if (!client) {
    // STEP 2 — log resolved credentials used for client init (never the secret).
    // eslint-disable-next-line no-console
    console.error(`${RAZORPAY_CLIENT_DEBUG_TAG} initializing client`, {
      keyPresent: Boolean(env.razorpayKeyId),
      keyIdLength: env.razorpayKeyId.length,
      keyIdPrefix: `${env.razorpayKeyId.slice(0, 8)}...`,
      secretLength: env.razorpayKeySecret.length,
      resolvedFrom: "env (config/env.ts ← process.env.RAZORPAY_KEY_*)",
      clientAlreadyExists: false,
    });

    try {
      client = new Razorpay({
        key_id: env.razorpayKeyId,
        key_secret: env.razorpayKeySecret,
      });
      // eslint-disable-next-line no-console
      console.error(`${RAZORPAY_CLIENT_DEBUG_TAG} client constructed`, {
        clientType: client.constructor?.name ?? "Razorpay",
      });
    } catch (initError) {
      // eslint-disable-next-line no-console
      console.error(`${RAZORPAY_CLIENT_DEBUG_TAG} client construction failed`, initError);
      throw initError;
    }
  } else {
    // eslint-disable-next-line no-console
    console.error(`${RAZORPAY_CLIENT_DEBUG_TAG} reusing existing client singleton`, {
      keyPresent: Boolean(env.razorpayKeyId),
      secretLength: env.razorpayKeySecret.length,
    });
  }

  return client;
};

/** Public key id, safe to hand to the frontend for Checkout. */
export const getRazorpayKeyId = (): string => {
  if (!env.razorpayKeyId) {
    throw new AppError("Payment gateway is not configured on the server.", 503);
  }
  return env.razorpayKeyId;
};
