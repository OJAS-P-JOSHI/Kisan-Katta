import { nextSequence } from "../../counter/counter.service";
import { APPLICATION_NUMBER_PREFIX, GRAM_SAHAKARI_COUNTER_ID, APPLICATION_NUMBER_SEQUENCE_PAD } from "../gram-sahakari.constants";

/**
 * Formats a permanent, human-readable application number.
 *
 * Format: `GS-<YEAR>-<6-digit zero-padded sequence>`
 * Example: formatApplicationNumber(2026, 103) -> "GS-2026-000103"
 *
 * Sequences beyond 6 digits are not truncated; the number simply grows wider.
 */
export const formatApplicationNumber = (year: number, sequence: number): string =>
  `${APPLICATION_NUMBER_PREFIX}-${year}-${String(sequence).padStart(
    APPLICATION_NUMBER_SEQUENCE_PAD,
    "0"
  )}`;

/**
 * Generates the next application number using the shared atomic counter.
 *
 * The sequence is a single global monotonic counter (never reset per year), so
 * numbers are guaranteed unique across all years. The year segment reflects the
 * creation date passed in (defaults to now).
 */
export const generateApplicationNumber = async (
  createdAt: Date = new Date()
): Promise<{ applicationNumber: string; sequence: number }> => {
  const sequence = await nextSequence(GRAM_SAHAKARI_COUNTER_ID);
  return {
    applicationNumber: formatApplicationNumber(createdAt.getFullYear(), sequence),
    sequence,
  };
};
