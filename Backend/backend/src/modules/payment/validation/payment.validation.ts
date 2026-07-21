import { z } from "zod";
import { Types } from "mongoose";
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

export const verifyPaymentSchema = z
  .object({
    razorpay_order_id: z
      .string()
      .trim()
      .min(1, "razorpay_order_id is required."),
    razorpay_payment_id: z
      .string()
      .trim()
      .min(1, "razorpay_payment_id is required."),
    razorpay_signature: z
      .string()
      .trim()
      .min(1, "razorpay_signature is required."),
  })
  .strict();

export const paymentFailureSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(1, "A failure reason is required.")
      .max(500, "Failure reason is too long."),
  })
  .strict();

export const validateVerifyPayment = (body: unknown) =>
  parseWithZod(verifyPaymentSchema, body);

export const validatePaymentFailure = (body: unknown) =>
  parseWithZod(paymentFailureSchema, body);

export const validateApplicationIdParam = (value: unknown): string => {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
    throw new AppError("A valid application id is required.", 400);
  }
  return value;
};
