import {
  DEFAULT_POLL_DURATION_HOURS,
  isMilkCrop,
  MAX_PRICE_DIGITS,
  MAX_PRICE_WITHOUT_GOV,
  MILK_PRICE_RANGE,
  MIN_PRICE_WITHOUT_GOV,
  PRICE_SLIDER_STEP,
  PRICE_VARIATION_PERCENT,
} from './farmer-price.constants';
import { farmerPriceStrings } from './farmer-price.strings';
import type {
  AllowedPriceRangeDTO,
  MyVoteDTO,
  PollResponseDTO,
  SubmittedVoteLocal,
} from './farmer-price.types';

/** Formats an INR amount without decimals. */
export function formatRupee(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/** Maps backend myVote into the thank-you card shape. */
export function myVoteToLocal(pollId: string, myVote: MyVoteDTO): SubmittedVoteLocal {
  return {
    pollId,
    expectedPrice: myVote.expectedPrice,
    reasonType: myVote.reasonType,
    reasonText: myVote.reasonText,
    submittedAt: myVote.createdAt,
  };
}

/**
 * Prefer optimistic SecureStore snapshot only when it has a real price;
 * otherwise use backend myVote. Backend hasVoted is the vote-state authority.
 */
export function resolveDisplayVote(
  pollId: string,
  myVote: MyVoteDTO | null | undefined,
  optimistic: SubmittedVoteLocal | null | undefined,
): SubmittedVoteLocal | null {
  if (optimistic && optimistic.expectedPrice > 0) {
    return optimistic;
  }
  if (myVote) {
    return myVoteToLocal(pollId, myVote);
  }
  if (optimistic) {
    return optimistic;
  }
  return null;
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
  if (days <= 0) return `${hours}h`;
  return `${days}d ${hours}h`;
}

/** Progress 0–1 for voting window remaining. */
export function remainingProgress(
  remainingHours: number,
  totalHours: number = DEFAULT_POLL_DURATION_HOURS,
): number {
  if (totalHours <= 0) return 0;
  return Math.min(1, Math.max(0, remainingHours / totalHours));
}

/** Relative short time for insight timestamps. */
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

/**
 * The band the backend will accept. Prefers the server-sent range and falls
 * back to Milk's fixed litre band or the mirrored ±40% formula for older polls.
 */
export function resolveAllowedRange(poll: {
  crop?: string;
  allowedPriceRange?: AllowedPriceRangeDTO | null;
  governmentPriceAvailable: boolean;
  governmentPriceSnapshot: number | null;
}): AllowedPriceRangeDTO {
  const fromServer = poll.allowedPriceRange;
  if (fromServer && fromServer.max > fromServer.min) {
    return fromServer;
  }

  if (poll.crop && isMilkCrop(poll.crop)) {
    return {
      min: MILK_PRICE_RANGE.min,
      max: MILK_PRICE_RANGE.max,
      unit: MILK_PRICE_RANGE.unit,
    };
  }

  const snapshot = poll.governmentPriceSnapshot;
  if (poll.governmentPriceAvailable && snapshot !== null && snapshot > 0) {
    const variation = PRICE_VARIATION_PERCENT / 100;
    return {
      min: Math.ceil(snapshot * (1 - variation)),
      max: Math.floor(snapshot * (1 + variation)),
    };
  }

  return { min: MIN_PRICE_WITHOUT_GOV, max: MAX_PRICE_WITHOUT_GOV };
}

/** Display unit for prices on a poll (Litre for Milk, Quintal otherwise). */
export function resolvePriceUnit(poll: {
  crop: string;
  allowedPriceRange?: AllowedPriceRangeDTO | null;
  governmentUnit?: string | null;
}): string {
  if (poll.allowedPriceRange?.unit) return poll.allowedPriceRange.unit;
  if (isMilkCrop(poll.crop)) return MILK_PRICE_RANGE.unit;
  if (poll.governmentUnit?.trim()) return poll.governmentUnit.trim();
  return 'Quintal';
}

/** Clamps a price into the allowed band. */
export function clampPrice(value: number, range: AllowedPriceRangeDTO): number {
  return Math.min(range.max, Math.max(range.min, Math.round(value)));
}

/**
 * Maps a slider ratio (0–1) to a price.
 * Snaps to the step, to both ends, and magnetically onto the government price
 * so choosing "exactly the official rate" is always reachable by dragging.
 */
export function priceFromRatio(
  ratio: number,
  range: AllowedPriceRangeDTO,
  governmentPrice: number | null,
): number {
  const span = range.max - range.min;
  const raw = range.min + Math.min(1, Math.max(0, ratio)) * span;
  const stepped = Math.round(raw / PRICE_SLIDER_STEP) * PRICE_SLIDER_STEP;
  const clamped = clampPrice(stepped, range);

  if (
    governmentPrice !== null &&
    governmentPrice >= range.min &&
    governmentPrice <= range.max &&
    Math.abs(raw - governmentPrice) <= PRICE_SLIDER_STEP
  ) {
    return governmentPrice;
  }

  return clamped;
}

/** Maps a price back to a slider ratio (0–1). */
export function ratioFromPrice(price: number, range: AllowedPriceRangeDTO): number {
  const span = range.max - range.min;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (price - range.min) / span));
}

/**
 * Where the slider starts:
 * - Government rate when published
 * - Else community price when revealed
 * - Else Milk default ₹60 / Litre
 * - Else the bottom of the band (wide no-gov crop range)
 */
export function defaultVotePrice(poll: PollResponseDTO): number {
  const range = resolveAllowedRange(poll);
  if (
    poll.governmentPriceAvailable &&
    poll.governmentPriceSnapshot !== null &&
    poll.governmentPriceSnapshot > 0
  ) {
    return clampPrice(poll.governmentPriceSnapshot, range);
  }
  if (poll.communityExpectedPrice) {
    return clampPrice(poll.communityExpectedPrice, range);
  }
  if (isMilkCrop(poll.crop)) {
    return clampPrice(MILK_PRICE_RANGE.default, range);
  }
  return range.min;
}

/**
 * True when the entered price equals the government snapshot — the only case
 * where the backend treats a reason as optional.
 */
export function matchesGovernmentPrice(
  price: number | null,
  poll: { governmentPriceAvailable: boolean; governmentPriceSnapshot: number | null },
): boolean {
  if (price === null) return false;
  if (!poll.governmentPriceAvailable || poll.governmentPriceSnapshot === null) return false;
  return price === poll.governmentPriceSnapshot;
}
