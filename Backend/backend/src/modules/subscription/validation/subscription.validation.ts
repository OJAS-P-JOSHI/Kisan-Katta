import { z } from "zod";
import { AppError } from "../../../utils/AppError";

const formatZodError = (error: z.ZodError): string =>
  error.issues.map((issue) => issue.message).join("; ");

export const parseWithZod = <T>(schema: z.ZodType<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(formatZodError(result.error), 400);
  }
  return result.data;
};

export const verifySubscriptionSchema = z
  .object({
    razorpay_payment_id: z
      .string()
      .trim()
      .min(1, "razorpay_payment_id is required."),
    razorpay_subscription_id: z
      .string()
      .trim()
      .min(1, "razorpay_subscription_id is required."),
    razorpay_signature: z
      .string()
      .trim()
      .min(1, "razorpay_signature is required."),
  })
  .strict();

export const cancelSubscriptionSchema = z
  .object({
    cancelAtCycleEnd: z.boolean().optional(),
  })
  .strict();

export const validateVerifySubscription = (body: unknown) =>
  parseWithZod(verifySubscriptionSchema, body);

export const validateCancelSubscription = (body: unknown) =>
  parseWithZod(cancelSubscriptionSchema, body ?? {});
