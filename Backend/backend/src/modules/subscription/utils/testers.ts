/** Last 10 digits of mobiles that always have mobile-app subscription access. */
export const SUBSCRIPTION_TESTER_MOBILE_DIGITS = ["9325773460"] as const;

export const lastTenMobileDigits = (mobile: string): string =>
  mobile.replace(/\D/g, "").slice(-10);

const TESTER_DIGIT_SET = new Set<string>(SUBSCRIPTION_TESTER_MOBILE_DIGITS);

export const isSubscriptionTesterMobile = (mobile: string): boolean => {
  const last10 = lastTenMobileDigits(mobile);
  return last10.length === 10 && TESTER_DIGIT_SET.has(last10);
};
