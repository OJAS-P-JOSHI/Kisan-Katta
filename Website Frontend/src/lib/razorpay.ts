import { paymentDebug } from '@/lib/payment-debug'
import type { CreateOrderResponse } from '@/types/application.types'

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

type RazorpaySuccessResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type RazorpayOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpaySuccessResponse) => void
  modal?: {
    ondismiss?: () => void
  }
  prefill?: {
    name?: string
    contact?: string
    email?: string
  }
  theme?: {
    color?: string
  }
}

type RazorpayInstance = {
  open: () => void
  on: (event: string, handler: (response: unknown) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

let scriptPromise: Promise<void> | null = null

/** Loads Razorpay Checkout.js once. */
export const loadRazorpayScript = (): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay is only available in the browser.'))
  }
  if (window.Razorpay) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`,
    )
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => {
        scriptPromise = null
        reject(new Error('Failed to load Razorpay Checkout.'))
      })
      return
    }

    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Failed to load Razorpay Checkout.'))
    }
    document.body.appendChild(script)
  })

  return scriptPromise
}

export type OpenCheckoutParams = {
  order: CreateOrderResponse
  prefill?: {
    name?: string
    contact?: string
    email?: string
  }
  onSuccess: (response: RazorpaySuccessResponse) => void
  onDismiss: () => void
}

/**
 * Opens Razorpay Checkout using the backend-issued order.
 * Amount/currency/key always come from the server — never calculated locally.
 */
export const openRazorpayCheckout = async ({
  order,
  prefill,
  onSuccess,
  onDismiss,
}: OpenCheckoutParams): Promise<void> => {
  await loadRazorpayScript()

  if (!window.Razorpay) {
    throw new Error('Razorpay Checkout failed to initialize.')
  }

  const options: RazorpayOptions = {
    key: order.key,
    amount: order.amount,
    currency: order.currency,
    name: 'Kisan Katta',
    description: `Gram Sahakari Registration — ${order.applicationNumber}`,
    order_id: order.orderId,
    handler: (response) => {
      paymentDebug('Razorpay handler(response) fired', {
        fullResponse: response,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      })
      onSuccess(response)
    },
    modal: {
      ondismiss: () => {
        paymentDebug('Checkout dismissed')
        onDismiss()
      },
    },
    prefill,
    theme: {
      color: '#1B5E3B',
    },
  }

  paymentDebug('Before constructing Razorpay options', {
    key: options.key,
    order_id: options.order_id,
    amount: options.amount,
    currency: options.currency,
    prefill: options.prefill,
    handlerExists: typeof options.handler === 'function',
    modalExists: Boolean(options.modal),
  })

  paymentDebug('Immediately before new Razorpay(options)')

  const rzp = new window.Razorpay(options)

  paymentDebug('Immediately before razorpay.open()')

  rzp.open()
}
