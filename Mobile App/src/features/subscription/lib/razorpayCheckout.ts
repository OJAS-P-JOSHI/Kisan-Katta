import { Platform } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';

import { SUBSCRIPTION_BRAND_COLOR } from '../subscription.constants';
import type { CreateSubscriptionResponse, VerifySubscriptionBody } from '../subscription.types';

type Prefill = {
  name?: string;
  contact?: string;
  email?: string;
};

/**
 * Opens Razorpay native Checkout for Subscriptions authorisation.
 * Passes `subscription_id` (not order_id) per Razorpay Subscriptions guide.
 *
 * Import matches react-native-razorpay@2.3.1 + official README:
 *   import RazorpayCheckout from 'react-native-razorpay';
 */
export const openSubscriptionCheckout = async (params: {
  order: CreateSubscriptionResponse;
  prefill?: Prefill;
}): Promise<VerifySubscriptionBody> => {
  // eslint-disable-next-line no-console
  console.log('PAYMENT STEP 4 Opening Razorpay SDK');
  // eslint-disable-next-line no-console
  console.log('RazorpayCheckout =', RazorpayCheckout);
  // eslint-disable-next-line no-console
  console.log('open =', RazorpayCheckout?.open);

  if (Platform.OS === 'web') {
    throw new Error('Razorpay Checkout is only available on Android and iOS.');
  }

  const options = {
    key: params.order.key,
    subscription_id: params.order.subscriptionId,
    name: 'Kisan Katta',
    description: 'Monthly App Subscription — ₹100',
    currency: params.order.currency,
    prefill: params.prefill ?? {},
    theme: { color: SUBSCRIPTION_BRAND_COLOR },
  };

  const response = (await RazorpayCheckout.open(options)) as Record<string, string>;

  // eslint-disable-next-line no-console
  console.log('PAYMENT STEP 5 SDK returned success', response);

  const paymentId = response.razorpay_payment_id;
  const subscriptionId = response.razorpay_subscription_id;
  const signature = response.razorpay_signature;

  if (!paymentId || !subscriptionId || !signature) {
    throw new Error('Incomplete payment response from Razorpay.');
  }

  return {
    razorpay_payment_id: paymentId,
    razorpay_subscription_id: subscriptionId,
    razorpay_signature: signature,
  };
};

export const isCheckoutCancelled = (error: unknown): boolean => {
  const code = (error as { code?: number | string })?.code;
  return code === 0 || code === 2 || code === '0' || code === '2';
};
