import type { SubscriptionStatus } from './subscription.types';

export const formatBillingDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatRupees = (rupees: number): string =>
  `₹${Number.isFinite(rupees) ? rupees : 0}`;

export const formatPaymentMethod = (method: string | null | undefined): string => {
  if (!method) return 'Not available';
  const key = method.toLowerCase();
  if (key === 'upi') return 'UPI';
  if (key === 'card') return 'Card';
  if (key === 'netbanking') return 'Net Banking';
  if (key === 'wallet') return 'Wallet';
  if (key === 'emi') return 'EMI';
  return method.charAt(0).toUpperCase() + method.slice(1);
};

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

export const statusTone = (
  status: SubscriptionStatus | string | null | undefined,
  isActive: boolean,
): StatusTone => {
  if (isActive && (status === 'ACTIVE' || status === 'AUTHENTICATED')) return 'success';
  if (status === 'PENDING' || status === 'PAUSED' || status === 'CREATED') return 'warning';
  if (
    status === 'CANCELLED' ||
    status === 'EXPIRED' ||
    status === 'HALTED' ||
    status === 'COMPLETED'
  ) {
    return isActive ? 'warning' : 'danger';
  }
  return isActive ? 'success' : 'danger';
};

export const statusLabel = (
  status: SubscriptionStatus | string | null | undefined,
  isActive: boolean,
): string => {
  if (isActive && (status === 'ACTIVE' || status === 'AUTHENTICATED')) return 'Active';
  if (status === 'CANCELLED' && isActive) return 'Cancelled (active until period end)';
  if (status === 'CANCELLED') return 'Cancelled';
  if (status === 'EXPIRED') return 'Expired';
  if (status === 'PENDING') return 'Pending';
  if (status === 'HALTED') return 'Payment issue';
  if (status === 'PAUSED') return 'Paused';
  if (status === 'CREATED') return 'Awaiting payment';
  if (status === 'COMPLETED') return 'Completed';
  return isActive ? 'Active' : 'Inactive';
};
