import { useCallback, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/context/AuthContext';
import { getErrorMessage } from '@/utils';

import { isCheckoutCancelled, openSubscriptionCheckout } from '../lib/razorpayCheckout';
import {
  createSubscription,
  getSubscriptionStatus,
  refreshSubscription,
  verifySubscription,
} from '../subscription.service';
import type { PaymentPhase } from '../subscription.types';

type Prefill = {
  name?: string;
  contact?: string;
  email?: string;
};

/**
 * Orchestrates: create subscription → native Checkout → verify → refreshUser.
 * DIAGNOSTIC LOGS added — no flow change.
 */
export function useSubscriptionPayment(prefill?: Prefill) {
  const { refreshUser } = useAuth();
  const [phase, setPhase] = useState<PaymentPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const prefillRef = useRef(prefill);
  prefillRef.current = prefill;

  const confirmActive = useCallback(async (): Promise<boolean> => {
    try {
      const status = await getSubscriptionStatus();
      return status.isActive;
    } catch {
      return false;
    }
  }, []);

  const finishSuccess = useCallback(async (): Promise<boolean> => {
    setPhase('refreshing');
    try {
      await refreshSubscription();
    } catch {
      // Webhook may already have activated — status poll is enough.
    }
    await refreshUser();
    const active = await confirmActive();
    if (active) {
      setPhase('success');
      setError(null);
      return true;
    }
    setPhase('failed');
    setError('Payment received but subscription is not active yet. Please try again or wait a moment.');
    return false;
  }, [confirmActive, refreshUser]);

  const payNow = useCallback(async (): Promise<boolean> => {
    // eslint-disable-next-line no-console
    console.log('PAYMENT STEP 1 Button clicked / payNow entered', {
      inFlight: inFlightRef.current,
    });

    if (inFlightRef.current) {
      // eslint-disable-next-line no-console
      console.log('PAYMENT STEP 1 skipped — already in flight');
      return false;
    }
    inFlightRef.current = true;
    setError(null);

    try {
      setPhase('creating');
      // eslint-disable-next-line no-console
      console.log('PAYMENT STEP 2 Calling create subscription API');
      const created = await createSubscription();
      // eslint-disable-next-line no-console
      console.log('PAYMENT STEP 3 Subscription response received', created);

      setPhase('checkout');
      let verifyBody;
      try {
        verifyBody = await openSubscriptionCheckout({
          order: created,
          prefill: prefillRef.current,
        });
      } catch (checkoutError) {
        // eslint-disable-next-line no-console
        console.log('PAYMENT STEP 4 FAILED at Razorpay open', checkoutError);
        if (isCheckoutCancelled(checkoutError)) {
          setPhase('failed');
          setError(null);
          return false;
        }
        throw checkoutError;
      }

      setPhase('verifying');
      // eslint-disable-next-line no-console
      console.log('PAYMENT STEP 6 Calling verify', verifyBody);
      try {
        await verifySubscription(verifyBody);
        // eslint-disable-next-line no-console
        console.log('PAYMENT STEP 7 Verify success');
      } catch (verifyError) {
        // eslint-disable-next-line no-console
        console.log('PAYMENT STEP 6 verify failed — polling status', verifyError);
        const active = await confirmActive();
        if (!active) {
          throw verifyError;
        }
      }

      return await finishSuccess();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('PAYMENT FLOW ERROR', err);
      setError(getErrorMessage(err, 'Unable to complete subscription payment.'));
      setPhase('failed');
      return false;
    } finally {
      inFlightRef.current = false;
    }
  }, [confirmActive, finishSuccess]);

  const clearError = useCallback(() => setError(null), []);

  const busy =
    phase === 'creating' ||
    phase === 'checkout' ||
    phase === 'verifying' ||
    phase === 'refreshing';

  const loadingLabel =
    phase === 'creating'
      ? 'Creating subscription…'
      : phase === 'checkout'
        ? 'Opening payment…'
        : phase === 'verifying'
          ? 'Verifying payment…'
          : phase === 'refreshing'
            ? 'Refreshing status…'
            : null;

  return {
    phase,
    error,
    busy,
    loadingLabel,
    payNow,
    clearError,
    confirmActive,
  };
}
