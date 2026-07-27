import { z } from "zod";
import { AppError } from "../../utils/AppError";
import {
  REWARD_PAYMENT_METHODS,
  REWARD_REASONS,
  REWARD_STATUSES,
} from "./reward.constants";

const parseWithZod = <T>(schema: z.ZodType<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid request.";
    throw new AppError(message, 400);
  }
  return result.data;
};

const dateQuery = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Must be a valid date.")
  .optional();

export const rewardListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(120).optional(),
  villageRepresentativeName: z.string().trim().max(120).optional(),
  volunteerId: z.string().trim().max(40).optional(),
  district: z.string().trim().max(80).optional(),
  status: z.enum(REWARD_STATUSES).optional(),
  paymentMethod: z.enum(REWARD_PAYMENT_METHODS).optional(),
  reason: z.string().trim().max(80).optional(),
  applicationId: z.string().trim().min(1).optional(),
  fromDate: dateQuery,
  toDate: dateQuery,
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
});

export const createRewardSchema = z.object({
  applicationId: z.string().trim().min(1, "Select a Village Representative."),
  amount: z.coerce
    .number()
    .positive("Reward amount must be greater than zero.")
    .max(1_000_000, "Reward amount is too large."),
  reason: z.enum(REWARD_REASONS),
  description: z.string().trim().max(2000).optional().nullable(),
  paymentMethod: z.enum(REWARD_PAYMENT_METHODS),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const updateRewardSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Reward amount must be greater than zero.")
    .max(1_000_000)
    .optional(),
  reason: z.enum(REWARD_REASONS).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  paymentMethod: z.enum(REWARD_PAYMENT_METHODS).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const markPaidSchema = z.object({
  transactionReference: z.string().trim().max(120).optional().nullable(),
  paidDate: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "paidDate must be a valid date.")
    .optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const cancelRewardSchema = z.object({
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const validateRewardListQuery = (query: unknown) =>
  parseWithZod(rewardListQuerySchema, query);

export const validateCreateReward = (body: unknown) =>
  parseWithZod(createRewardSchema, body);

export const validateUpdateReward = (body: unknown) =>
  parseWithZod(updateRewardSchema, body);

export const validateMarkPaid = (body: unknown) =>
  parseWithZod(markPaidSchema, body);

export const validateCancelReward = (body: unknown) =>
  parseWithZod(cancelRewardSchema, body);
