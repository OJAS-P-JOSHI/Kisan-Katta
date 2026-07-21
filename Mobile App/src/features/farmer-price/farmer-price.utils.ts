import { DEFAULT_POLL_DURATION_HOURS, MAX_PRICE_DIGITS } from './farmer-price.constants';
import { farmerPriceStrings } from './farmer-price.strings';

/** Formats an INR amount without decimals. */
export function formatRupee(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/** Compact diff chip label, e.g. `▲ +4%`. */
export function formatDiffChip(pct: number): string {
  if (pct > 0) return `▲ +${pct}%`;
  if (pct < 0) return `▼ ${pct}%`;
  return `${pct}%`;
}

/** Compact remaining time, e.g. `2d 18h`. */
export function formatCompactRemaining(remainingHours: number): string {
  const safe = Math.max(0, Math.floor(remainingHours));
  const days = Math.floor(safe / 24);
  const hours = safe % 24;
  if (days <= 0) {
    return farmerPriceStrings.poll.compactHoursOnly(hours);
  }
  return farmerPriceStrings.poll.compactRemaining(days, hours);
}

/** Progress 0–1 for voting window remaining. */
export function remainingProgress(
  remainingHours: number,
  totalHours: number = DEFAULT_POLL_DURATION_HOURS,
): number {
  if (totalHours <= 0) return 0;
  return Math.min(1, Math.max(0, remainingHours / totalHours));
}

/** Relative short time for comment timestamps. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Math.max(0, now - then);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return farmerPriceStrings.relative.justNow;
  if (minutes < 60) return farmerPriceStrings.relative.minutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return farmerPriceStrings.relative.hoursAgo(hours);
  const days = Math.floor(hours / 24);
  return farmerPriceStrings.relative.daysAgo(days);
}

/**
 * Frontend-only price sanitizer: digits only, max 6 digits, no decimals.
 * Returns the cleaned string for the text field.
 */
export function sanitizePriceInput(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, '');
  return digitsOnly.slice(0, MAX_PRICE_DIGITS);
}

/** Parses sanitized price text into a positive integer, or null if invalid. */
export function parsePriceInput(value: string): number | null {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  if (String(n).length > MAX_PRICE_DIGITS) return null;
  return n;
}
