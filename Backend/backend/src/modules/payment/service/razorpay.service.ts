import Razorpay from "razorpay";
import util from "util";
import {
  validatePaymentVerification,
  validateWebhookSignature,
} from "razorpay/dist/utils/razorpay-utils";
import { getRazorpayClient, isRazorpayConfigured } from "../../../config/razorpay";
import { env } from "../../../config/env";
import { AppError } from "../../../utils/AppError";

/** SDK version, recorded in payment metadata for support/debugging. */
export const RAZORPAY_SDK_VERSION: string =
  (Razorpay as { VERSION?: string }).VERSION ?? "unknown";

export interface CreatedRazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// TEMPORARY DEBUG — remove after create-order 502 root cause is identified.
// Does not change payment logic, API responses, or thrown error types/messages.
// ---------------------------------------------------------------------------

const RAZORPAY_DEBUG_TAG = "[RAZORPAY-DEBUG createRazorpayOrder]";

const debugLog = (label: string, payload: unknown): void => {
  // eslint-disable-next-line no-console
  console.error(`${RAZORPAY_DEBUG_TAG} ${label}`, payload);
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

/** Redact Authorization / secret-bearing headers before logging. */
const redactHeaders = (
  headers: unknown
): Record<string, unknown> | null => {
  const record = asRecord(headers);
  if (!record) return null;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    const lower = key.toLowerCase();
    if (
      lower === "authorization" ||
      lower.includes("secret") ||
      lower.includes("api-key")
    ) {
      out[key] = "[REDACTED]";
    } else {
      out[key] = value;
    }
  }
  return out;
};

const logRazorpayException = (error: unknown, phase: string): void => {
  debugLog(`${phase} — exception typeof`, typeof error);
  debugLog(`${phase} — exception constructor`, {
    name: error instanceof Error ? error.constructor?.name : null,
  });

  if (error instanceof Error) {
    debugLog(`${phase} — Error.message`, error.message);
    debugLog(`${phase} — Error.stack`, error.stack);
    debugLog(`${phase} — Error.name`, error.name);
  }

  const record = asRecord(error);
  if (record) {
    debugLog(`${phase} — error.code`, record.code);
    debugLog(`${phase} — error.statusCode`, record.statusCode);
    debugLog(`${phase} — error.status`, record.status);
    debugLog(`${phase} — error.type`, record.type);
    debugLog(`${phase} — error.cause`, record.cause);

    const response = asRecord(record.response);
    if (response) {
      debugLog(`${phase} — error.response.status`, response.status);
      debugLog(`${phase} — error.response.statusText`, response.statusText);
      debugLog(`${phase} — error.response.data`, response.data);
      debugLog(`${phase} — error.response.headers`, redactHeaders(response.headers));
    }

    const config = asRecord(record.config);
    if (config) {
      debugLog(`${phase} — error.config.url`, config.url);
      debugLog(`${phase} — error.config.method`, config.method);
      debugLog(`${phase} — error.config.baseURL`, config.baseURL);
      debugLog(`${phase} — error.config.headers`, redactHeaders(config.headers));
      debugLog(`${phase} — error.config.data`, config.data);
    }

    debugLog(`${phase} — error own enumerable keys`, Object.keys(record));
  }

  // Deep inspection for Razorpay SDK / nested / non-Axios errors.
  debugLog(`${phase} — util.inspect (depth 8)`, util.inspect(error, {
    depth: 8,
    colors: false,
    showHidden: true,
    getters: true,
  }));

  if (record?.cause !== undefined) {
    debugLog(`${phase} — nested error.cause inspect`, util.inspect(record.cause, {
      depth: 8,
      colors: false,
      showHidden: true,
      getters: true,
    }));
  }
};

const diagnoseRazorpayFailure = (error: unknown): string => {
  if (error instanceof AppError) {
    return `credential/config validation (AppError ${error.statusCode}): ${error.message}`;
  }

  const record = asRecord(error);
  const response = record ? asRecord(record.response) : null;
  const status =
    (response?.status as number | undefined) ??
    (record?.statusCode as number | undefined) ??
    (record?.status as number | undefined);

  if (status === 401 || status === 403) {
    return "authentication — Razorpay rejected API credentials (check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)";
  }
  if (status === 400) {
    return "request validation — Razorpay rejected the order payload (amount, currency, receipt, notes)";
  }
  if (status === 404) {
    return "request routing — Razorpay endpoint not found (unexpected SDK URL or API version)";
  }
  if (status != null && status >= 500) {
    return "Razorpay server error — upstream gateway failure";
  }

  const code = record?.code as string | undefined;
  if (code === "ENOTFOUND") return "DNS — hostname could not be resolved";
  if (code === "ECONNREFUSED") return "network — connection refused";
  if (code === "ETIMEDOUT" || code === "ECONNABORTED") {
    return "network — request timed out";
  }
  if (code === "CERT_HAS_EXPIRED" || code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
    return "TLS — certificate verification failed";
  }

  if (response) {
    return "Axios HTTP error — Razorpay SDK HTTP layer (see error.response.* logs above)";
  }
  if (record?.config) {
    return "Axios request error — failed before/during HTTP round-trip (see error.config.* logs above)";
  }
  if (error instanceof Error) {
    return `Razorpay SDK / runtime Error — ${error.name}: ${error.message}`;
  }
  return "unknown — inspect util.inspect output above";
};

/**
 * Creates a Razorpay order. Any transport-level failure (network error, gateway
 * timeout, SDK throwing) is normalised into a 502 so the caller never leaks raw
 * gateway internals and the client gets a retriable, well-typed error.
 */
export const createRazorpayOrder = async (params: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<CreatedRazorpayOrder> => {
  // STEP 1 — credential presence (never log secret value).
  debugLog("STEP 1 credentials", {
    keyPresent: Boolean(env.razorpayKeyId),
    keyIdLength: env.razorpayKeyId?.length ?? 0,
    keyIdPrefix: env.razorpayKeyId
      ? `${env.razorpayKeyId.slice(0, 8)}...`
      : null,
    secretLength: env.razorpayKeySecret?.length ?? 0,
    isRazorpayConfigured: isRazorpayConfigured(),
    envSource: {
      RAZORPAY_KEY_ID_set: Boolean(process.env.RAZORPAY_KEY_ID),
      RAZORPAY_KEY_SECRET_set: Boolean(process.env.RAZORPAY_KEY_SECRET),
    },
  });

  const orderPayload = {
    amount: params.amount,
    currency: params.currency,
    receipt: params.receipt,
    notes: params.notes,
  };

  // STEP 3 — full request payload immediately before orders.create().
  debugLog("STEP 3 orders.create payload", orderPayload);

  try {
    // STEP 2 — client init (logs inside getRazorpayClient on first use).
    const client = getRazorpayClient();
    debugLog("STEP 2 client ready", {
      clientType: client?.constructor?.name ?? typeof client,
      sdkVersion: RAZORPAY_SDK_VERSION,
    });

    // STEP 4 — wrap ONLY the Razorpay API call.
    debugLog("STEP 4 calling client.orders.create", { at: new Date().toISOString() });
    let order: { id?: string; amount?: number | string; currency?: string };
    try {
      order = (await client.orders.create(orderPayload)) as {
        id?: string;
        amount?: number | string;
        currency?: string;
      };
      debugLog("STEP 4 orders.create success", {
        orderId: order?.id ?? null,
        amount: order?.amount,
        currency: order?.currency,
      });
    } catch (apiError) {
      logRazorpayException(apiError, "STEP 4 orders.create API failure");
      debugLog("STEP 7 diagnosis", {
        origin: diagnoseRazorpayFailure(apiError),
        isAxiosLike: Boolean(asRecord(apiError)?.response ?? asRecord(apiError)?.config),
        isAppError: apiError instanceof AppError,
      });
      throw apiError;
    }

    if (!order?.id) {
      throw new AppError("Payment gateway returned an invalid order.", 502);
    }

    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency!,
    };
  } catch (error) {
    if (error instanceof AppError) {
      debugLog("outer catch — rethrowing AppError unchanged", {
        statusCode: error.statusCode,
        message: error.message,
      });
      throw error;
    }

    // STEP 4/5/6 — log original exception before existing generic 502 (unchanged).
    logRazorpayException(error, "outer catch before generic 502");
    debugLog("STEP 7 diagnosis", {
      origin: diagnoseRazorpayFailure(error),
      isAxiosLike: Boolean(asRecord(error)?.response ?? asRecord(error)?.config),
      isAppError: false,
      genericMessagePreserved:
        "Unable to reach the payment gateway. Please try again.",
    });

    throw new AppError(
      "Unable to reach the payment gateway. Please try again.",
      502
    );
  }
};

/**
 * Verifies a Razorpay Checkout callback signature using the SDK's own
 * HMAC-SHA256 verification against `RAZORPAY_KEY_SECRET`. Returns a boolean;
 * a malformed/invalid signature yields `false` rather than throwing so the
 * caller can respond with a clean 400.
 */
export const verifyPaymentSignature = (params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean => {
  if (!env.razorpayKeySecret) {
    throw new AppError("Payment gateway is not configured on the server.", 503);
  }

  try {
    return validatePaymentVerification(
      {
        order_id: params.razorpay_order_id,
        payment_id: params.razorpay_payment_id,
      },
      params.razorpay_signature,
      env.razorpayKeySecret
    );
  } catch {
    return false;
  }
};

/**
 * Best-effort lookup of the payment method (upi/card/netbanking/...). This is
 * purely informational, so any gateway failure is swallowed and `null` is
 * returned — it must never block a successfully-verified payment.
 */
export const fetchPaymentMethod = async (
  paymentId: string
): Promise<string | null> => {
  try {
    const payment = await getRazorpayClient().payments.fetch(paymentId);
    const method = (payment as { method?: unknown }).method;
    return typeof method === "string" ? method : null;
  } catch {
    return null;
  }
};

/**
 * Verifies a Razorpay webhook signature (HMAC-SHA256 over the raw request body
 * using `RAZORPAY_WEBHOOK_SECRET`) via the SDK. The webhook payload is never
 * trusted until this returns true.
 */
export const verifyWebhookSignature = (
  rawBody: string,
  signature: string
): boolean => {
  if (!env.razorpayWebhookSecret) {
    throw new AppError("Payment webhook is not configured on the server.", 503);
  }

  try {
    return validateWebhookSignature(
      rawBody,
      signature,
      env.razorpayWebhookSecret
    );
  } catch {
    return false;
  }
};

export interface RazorpayPaymentSnapshot {
  id: string;
  orderId: string | null;
  status: string | null;
  method: string | null;
  amount: number | null;
  currency: string | null;
  raw: Record<string, unknown>;
}

const toPaymentSnapshot = (
  payment: Record<string, unknown>
): RazorpayPaymentSnapshot => ({
  id: String(payment.id ?? ""),
  orderId: (payment.order_id as string | undefined) ?? null,
  status: (payment.status as string | undefined) ?? null,
  method: (payment.method as string | undefined) ?? null,
  amount:
    typeof payment.amount === "number" ? (payment.amount as number) : null,
  currency: (payment.currency as string | undefined) ?? null,
  raw: payment,
});

/**
 * Fetches a single payment (used by reconciliation). Normalises transport
 * failures into a 502.
 */
export const fetchPayment = async (
  paymentId: string
): Promise<RazorpayPaymentSnapshot> => {
  try {
    const payment = await getRazorpayClient().payments.fetch(paymentId);
    return toPaymentSnapshot(payment as unknown as Record<string, unknown>);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Unable to reach the payment gateway.", 502);
  }
};

/**
 * Fetches all payments captured against an order (used by reconciliation to
 * discover a payment the DB missed because a webhook/verify never arrived).
 */
export const fetchOrderPayments = async (
  orderId: string
): Promise<RazorpayPaymentSnapshot[]> => {
  try {
    const result = await getRazorpayClient().orders.fetchPayments(orderId);
    const items = (result?.items ?? []) as unknown as Record<string, unknown>[];
    return items.map(toPaymentSnapshot);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Unable to reach the payment gateway.", 502);
  }
};
