import { billingStrings, toDevanagariNumber } from './billing.strings';
import type { SubscriptionStatus } from './subscription.types';
import { palette } from '@/theme/colors';

export const formatBillingDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  // mr-IN gives Marathi month names; map digits to Devanagari for farmers.
  const formatted = d.toLocaleDateString('mr-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return toDevanagariNumber(formatted);
};

export const formatRupees = (rupees: number): string =>
  `₹${toDevanagariNumber(Number.isFinite(rupees) ? rupees : 0)}`;

export const formatPaymentMethod = (method: string | null | undefined): string => {
  if (!method) return billingStrings.methodUnknown;
  const key = method.toLowerCase();
  if (key === 'upi') return 'UPI';
  if (key === 'card') return 'कार्ड';
  if (key === 'netbanking') return 'नेट बँकिंग';
  if (key === 'wallet') return 'वॉलेट';
  if (key === 'emi') return 'EMI';
  return method;
};

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

export const statusTone = (
  status: SubscriptionStatus | string | null | undefined,
  isActive: boolean,
): StatusTone => {
  if (isActive && (status === 'ACTIVE' || status === 'AUTHENTICATED')) return 'success';
  if (status === 'PENDING' || status === 'PAUSED' || status === 'CREATED') return 'warning';
  if (status === 'EXPIRED' || status === 'COMPLETED') return 'neutral';
  if (status === 'CANCELLED' || status === 'HALTED') {
    return isActive ? 'warning' : 'danger';
  }
  return isActive ? 'success' : 'neutral';
};

export const statusLabel = (
  status: SubscriptionStatus | string | null | undefined,
  isActive: boolean,
): string => {
  if (isActive && (status === 'ACTIVE' || status === 'AUTHENTICATED')) {
    return billingStrings.statusActive;
  }
  if (status === 'CANCELLED' && isActive) return billingStrings.statusUntilPeriodEnd;
  if (status === 'CANCELLED') return billingStrings.statusCancelled;
  if (status === 'EXPIRED') return billingStrings.statusExpired;
  if (status === 'PENDING') return billingStrings.statusPending;
  if (status === 'HALTED') return billingStrings.statusHalted;
  if (status === 'PAUSED') return billingStrings.statusPaused;
  if (status === 'CREATED') return billingStrings.statusPending;
  if (status === 'COMPLETED') return billingStrings.statusExpired;
  return isActive ? billingStrings.statusActive : billingStrings.statusInactive;
};

/** Theme-safe chip colors (palette tokens, not random hex in screens). */
export const chipColors = (tone: StatusTone): { bg: string; fg: string } => {
  if (tone === 'success') return { bg: palette.green100, fg: palette.green900 };
  if (tone === 'warning') return { bg: palette.amber100, fg: palette.orange800 };
  if (tone === 'danger') return { bg: palette.red100, fg: palette.red700 };
  return { bg: palette.mist, fg: palette.slate };
};
