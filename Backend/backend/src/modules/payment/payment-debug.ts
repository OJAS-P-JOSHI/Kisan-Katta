/**
 * Temporary payment-flow debug logger. Remove after QA.
 * All output is prefixed with [PAYMENT_DEBUG].
 */

const PREFIX = "[PAYMENT_DEBUG]";

export const paymentDebug = (
  message: string,
  data?: Record<string, unknown>
): void => {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      prefix: PREFIX,
      message,
      ...data,
      ts: new Date().toISOString(),
    })
  );
};

export const paymentDebugError = (
  message: string,
  error: unknown,
  extra?: Record<string, unknown>
): void => {
  const payload: Record<string, unknown> = { ...extra };

  if (error instanceof Error) {
    payload.errorMessage = error.message;
    payload.stack = error.stack;
  } else {
    payload.errorMessage = String(error);
  }

  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      prefix: PREFIX,
      message,
      ...payload,
      ts: new Date().toISOString(),
    })
  );
};
