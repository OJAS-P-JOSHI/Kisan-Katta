import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  createPaymentOrder,
  getMyApplication,
  submitApplication,
  verifyPayment,
} from '@/api/application.api'
import { getErrorMessage } from '@/lib/api-error'
import { paymentDebug, paymentDebugError } from '@/lib/payment-debug'
import { openRazorpayCheckout } from '@/lib/razorpay'
import type {
  ApplicationDTO,
  VerifyPaymentResponse,
} from '@/types/application.types'

export type PaymentPhase =
  | 'idle'
  | 'submitting'
  | 'creating_order'
  | 'checkout'
  | 'verifying'
  | 'failed'

type Prefill = {
  name?: string
  contact?: string
  email?: string
}

/**
 * Asks the backend (the source of truth) whether the payment is already
 * finalized. Used when a verify call fails on the wire but the webhook may have
 * completed the payment first. Returns the application only when it is fully
 * settled (SUBMITTED + PAID); otherwise null.
 */
const confirmPaymentSettled = async (): Promise<ApplicationDTO | null> => {
  try {
    paymentDebug('confirmPaymentSettled: checking backend state')
    const app = await getMyApplication()
    if (app.status === 'SUBMITTED' && app.paymentStatus === 'PAID') {
      paymentDebug('confirmPaymentSettled: payment already finalized on backend', {
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        status: app.status,
        paymentStatus: app.paymentStatus,
      })
      return app
    }
    paymentDebug('confirmPaymentSettled: not yet finalized', {
      status: app.status,
      paymentStatus: app.paymentStatus,
    })
    return null
  } catch (error) {
    paymentDebugError('confirmPaymentSettled failed', error)
    return null
  }
}

/**
 * Orchestrates the finalized payment sequence:
 * submit → create-order → Razorpay checkout → verify.
 * Retry skips submit and only re-runs create-order → checkout.
 */
export function useApplicationPayment(prefill?: Prefill) {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<PaymentPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  /** True once /submit has succeeded — draft is no longer editable. */
  const [awaitingPayment, setAwaitingPayment] = useState(false)
  const inFlightRef = useRef(false)
  const prefillRef = useRef(prefill)
  prefillRef.current = prefill

  const goToSuccess = useCallback(
    (state: {
      applicationNumber: string
      paymentStatus: string
      razorpayPaymentId: string | null
      paidAt: string | null
    }) => {
      navigate('/application/success', { replace: true, state })
    },
    [navigate],
  )

  const runCheckout = useCallback(async (): Promise<void> => {
    setPhase('creating_order')
    paymentDebug('runCheckout: starting create-order phase')
    try {
      const order = await createPaymentOrder()

      setPhase('checkout')
      paymentDebug('runCheckout: opening Razorpay checkout', { order })
      await openRazorpayCheckout({
        order,
        prefill: prefillRef.current,
        onSuccess: (response) => {
          void (async () => {
            setPhase('verifying')
            setError(null)
            paymentDebug('runCheckout: Razorpay success callback received', response)
            try {
              const result: VerifyPaymentResponse = await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
              paymentDebug('runCheckout: verify succeeded, navigating to success', result)
              goToSuccess({
                applicationNumber: result.applicationNumber,
                paymentStatus: result.paymentStatus,
                razorpayPaymentId: result.razorpayPaymentId,
                paidAt: result.paidAt,
              })
            } catch (err) {
              paymentDebugError('runCheckout: verify failed', err)
              // Verify failed on the wire, but the webhook may have already
              // finalized the payment. Backend is the source of truth: confirm
              // the real state before ever showing "Payment not completed".
              const settled = await confirmPaymentSettled()
              if (settled) {
                paymentDebug('runCheckout: verify failed but backend confirms PAID — treating as success')
                goToSuccess({
                  applicationNumber: settled.applicationNumber,
                  paymentStatus: settled.paymentStatus,
                  razorpayPaymentId: settled.paymentReference,
                  paidAt: settled.submittedAt,
                })
                return
              }
              setError(getErrorMessage(err, 'Payment verification failed.'))
              setPhase('failed')
              inFlightRef.current = false
            }
          })()
        },
        onDismiss: () => {
          paymentDebug('runCheckout: checkout dismissed by user')
          setError(null)
          setPhase('failed')
          inFlightRef.current = false
        },
      })
    } catch (err) {
      paymentDebugError('runCheckout failed', err)
      throw err
    }
  }, [goToSuccess])

  /** Full path from Review: submit then create-order then checkout. */
  const payAndSubmit = useCallback(async (): Promise<void> => {
    if (inFlightRef.current) {
      paymentDebug('payAndSubmit: skipped — payment already in flight')
      return
    }
    inFlightRef.current = true
    setError(null)

    try {
      setPhase('submitting')
      paymentDebug('payAndSubmit: submitting application')
      await submitApplication()
      setAwaitingPayment(true)
      paymentDebug('payAndSubmit: submit succeeded, starting checkout')
      await runCheckout()
    } catch (err) {
      paymentDebugError('payAndSubmit failed', err)
      setError(getErrorMessage(err, 'Unable to start payment.'))
      setPhase('failed')
      inFlightRef.current = false
    }
  }, [runCheckout])

  /** Retry for PAYMENT_PENDING — create-order + checkout only. */
  const retryPayment = useCallback(async (): Promise<void> => {
    if (inFlightRef.current) {
      paymentDebug('retryPayment: skipped — payment already in flight')
      return
    }
    inFlightRef.current = true
    setError(null)

    try {
      paymentDebug('retryPayment: starting checkout (no submit)')
      await runCheckout()
    } catch (err) {
      paymentDebugError('retryPayment failed', err)
      setError(getErrorMessage(err, 'Unable to retry payment.'))
      setPhase('failed')
      inFlightRef.current = false
    }
  }, [runCheckout])

  const clearError = useCallback(() => setError(null), [])

  const busy =
    phase === 'submitting' ||
    phase === 'creating_order' ||
    phase === 'checkout' ||
    phase === 'verifying'

  const loadingLabel =
    phase === 'submitting'
      ? 'Submitting application…'
      : phase === 'creating_order'
        ? 'Creating payment order…'
        : phase === 'checkout'
          ? 'Opening payment…'
          : phase === 'verifying'
            ? 'Verifying payment…'
            : null

  return {
    phase,
    error,
    busy,
    loadingLabel,
    awaitingPayment,
    payAndSubmit,
    retryPayment,
    clearError,
  }
}
