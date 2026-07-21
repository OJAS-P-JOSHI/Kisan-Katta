import axios from 'axios'

const PREFIX = '[PAYMENT_DEBUG]'

/** Temporary payment-flow debug logger. Remove after QA. */
export const paymentDebug = (message: string, data?: unknown): void => {
  if (data !== undefined) {
    console.log(`${PREFIX} ${message}`, data)
  } else {
    console.log(`${PREFIX} ${message}`)
  }
}

/** Temporary payment-flow error logger. Remove after QA. */
export const paymentDebugError = (message: string, error: unknown): void => {
  const payload: Record<string, unknown> = {}

  if (error instanceof Error) {
    payload.message = error.message
    payload.stack = error.stack
  } else {
    payload.message = String(error)
  }

  if (axios.isAxiosError(error)) {
    payload.axiosStatus = error.response?.status
    payload.axiosData = error.response?.data
  }

  console.error(`${PREFIX} ${message}`, payload, error)
}
