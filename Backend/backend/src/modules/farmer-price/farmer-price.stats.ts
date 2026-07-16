import type { ConfidenceLevel } from "./farmer-price.types";

// ---------------------------------------------------------------------------
// Pure calculation helpers (backend is the single source of truth)
// ---------------------------------------------------------------------------

/**
 * Median of expected prices.
 * Odd count → middle value.
 * Even count → average of two middle values, rounded to nearest integer.
 */
export const calculateMedianPrice = (prices: number[]): number | null => {
  if (prices.length === 0) {
    return null;
  }

  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[mid] ?? null;
  }

  const left = sorted[mid - 1];
  const right = sorted[mid];
  if (left === undefined || right === undefined) {
    return null;
  }

  return Math.round((left + right) / 2);
};

export const calculateConfidence = (voteCount: number): ConfidenceLevel => {
  if (voteCount < 10) return "NOT_AVAILABLE";
  if (voteCount < 50) return "LOW";
  if (voteCount < 150) return "MEDIUM";
  return "HIGH";
};

export const calculateDifferenceFromGovernment = (
  communityExpectedPrice: number | null,
  governmentPriceAvailable: boolean,
  governmentPriceSnapshot: number | null
): { differenceFromGovernmentPrice: number | null; differencePercentage: number | null } => {
  if (
    communityExpectedPrice === null ||
    !governmentPriceAvailable ||
    governmentPriceSnapshot === null ||
    governmentPriceSnapshot === 0
  ) {
    return {
      differenceFromGovernmentPrice: null,
      differencePercentage: null,
    };
  }

  const differenceFromGovernmentPrice = communityExpectedPrice - governmentPriceSnapshot;
  const differencePercentage =
    Math.round((differenceFromGovernmentPrice / governmentPriceSnapshot) * 10000) / 100;

  return { differenceFromGovernmentPrice, differencePercentage };
};

export const calculateRemainingHours = (endsAt: Date, now = new Date()): number => {
  const msRemaining = endsAt.getTime() - now.getTime();
  if (msRemaining <= 0) return 0;
  return Math.ceil(msRemaining / (1000 * 60 * 60));
};

export const resolveCommunityExpectedPrice = (
  voteCount: number,
  minimumVotesRequired: number,
  median: number | null
): number | null => {
  if (voteCount < minimumVotesRequired) {
    return null;
  }
  return median;
};
