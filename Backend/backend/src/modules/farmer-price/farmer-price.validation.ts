import { AppError } from "../../utils/AppError";
import {
  MAX_PRICE_WITHOUT_GOV,
  MAX_REASON_LENGTH,
  MIN_PRICE_WITHOUT_GOV,
  MIN_REASON_LENGTH,
  PRICE_VARIATION_PERCENT,
  REASON_TYPES,
} from "./farmer-price.constants";
import type {
  CreatePollBody,
  ReasonType,
  SubmitVoteBody,
  VoteValidationContext,
} from "./farmer-price.types";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

const requireString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${field} is required and must be a non-empty string.`, 400);
  }
  return value.trim();
};

const requireInteger = (value: unknown, _field: string): number => {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new AppError("Invalid Vote", 400);
  }
  return value;
};

const validateReasonType = (value: unknown): ReasonType => {
  if (
    typeof value !== "string" ||
    !(REASON_TYPES as readonly string[]).includes(value)
  ) {
    throw new AppError(`reasonType must be one of: ${REASON_TYPES.join(", ")}.`, 400);
  }
  return value as ReasonType;
};

const validateReasonText = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new AppError("reasonText is required and must be a string.", 400);
  }

  const trimmed = value.trim();

  if (trimmed.length < MIN_REASON_LENGTH) {
    throw new AppError("Reason too short.", 400);
  }
  if (trimmed.length > MAX_REASON_LENGTH) {
    throw new AppError("Reason too long.", 400);
  }

  return trimmed;
};

const getAllowedPriceRange = (
  context: VoteValidationContext
): { min: number; max: number } => {
  if (
    context.governmentPriceAvailable &&
    context.governmentPriceSnapshot !== null &&
    context.governmentPriceSnapshot > 0
  ) {
    const snapshot = context.governmentPriceSnapshot;
    const variation = PRICE_VARIATION_PERCENT / 100;
    return {
      min: Math.ceil(snapshot * (1 - variation)),
      max: Math.floor(snapshot * (1 + variation)),
    };
  }

  return {
    min: MIN_PRICE_WITHOUT_GOV,
    max: MAX_PRICE_WITHOUT_GOV,
  };
};

const assertExpectedPriceInRange = (
  expectedPrice: number,
  context: VoteValidationContext
): void => {
  const { min, max } = getAllowedPriceRange(context);
  if (expectedPrice < min || expectedPrice > max) {
    throw new AppError("Invalid Vote", 400);
  }
};

const assertReasonRules = (
  expectedPrice: number,
  body: SubmitVoteBody,
  context: VoteValidationContext
): void => {
  const matchesGovernmentPrice =
    context.governmentPriceAvailable &&
    context.governmentPriceSnapshot !== null &&
    expectedPrice === context.governmentPriceSnapshot;

  const hasReasonType = body.reasonType !== undefined;
  const hasReasonText = body.reasonText !== undefined;

  if (matchesGovernmentPrice) {
    return;
  }

  if (!hasReasonType || !hasReasonText) {
    throw new AppError("Reason Required", 400);
  }
};

// ---------------------------------------------------------------------------
// Exported validators
// ---------------------------------------------------------------------------

export const validateCreatePoll = (body: Record<string, unknown>): CreatePollBody => ({
  crop: requireString(body["crop"], "crop"),
  district: requireString(body["district"], "district"),
});

export const validateSubmitVote = (
  body: Record<string, unknown>,
  context: VoteValidationContext
): SubmitVoteBody => {
  const expectedPrice = requireInteger(body["expectedPrice"], "expectedPrice");
  assertExpectedPriceInRange(expectedPrice, context);

  const result: SubmitVoteBody = { expectedPrice };

  if (body["reasonType"] !== undefined) {
    result.reasonType = validateReasonType(body["reasonType"]);
  }
  if (body["reasonText"] !== undefined) {
    result.reasonText = validateReasonText(body["reasonText"]);
  }

  assertReasonRules(expectedPrice, result, context);

  return result;
};
