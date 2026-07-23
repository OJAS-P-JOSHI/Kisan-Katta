/** Temporary payment-flow debug logger — silent in production builds. */
export const paymentDebug = (message: string, data?: unknown): void => {
  if (!import.meta.env.DEV) return
  if (data !== undefined) {
    console.log(`[PAYMENT_DEBUG] ${message}`, data)
  } else {
    console.log(`[PAYMENT_DEBUG] ${message}`)
  }
}

/** Temporary payment-flow error logger — silent in production builds. */
export const paymentDebugError = (message: string, error: unknown): void => {
  if (!import.meta.env.DEV) return
  console.error(`[PAYMENT_DEBUG] ${message}`, error)
}
