import { z } from "zod";
import { AppError } from "../../utils/AppError";
import {
  APPLICATION_STATUSES,
  PAYMENT_STATUSES,
} from "../gram-sahakari/gram-sahakari.constants";

const parseWithZod = <T>(schema: z.ZodType<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid request.";
    throw new AppError(message, 400);
  }
  return result.data;
};

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(120).optional(),
});

/** Query-string friendly boolean (`true`/`false`/`1`/`0`). */
const booleanQueryParam = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return value;
}, z.boolean().optional());

export const adminListQuerySchema = paginationSchema.extend({
  district: z.string().trim().max(80).optional(),
  taluka: z.string().trim().max(80).optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  showDrafts: booleanQueryParam,
  fromDate: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "fromDate must be a valid date.")
    .optional(),
  toDate: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "toDate must be a valid date.")
    .optional(),
});

export const adminPaymentsQuerySchema = paginationSchema.extend({
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
});

export const adminVolunteersQuerySchema = paginationSchema.extend({
  district: z.string().trim().max(80).optional(),
});

export const adminFarmersQuerySchema = paginationSchema.extend({
  district: z.string().trim().max(80).optional(),
  taluka: z.string().trim().max(80).optional(),
  fromDate: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "fromDate must be a valid date.")
    .optional(),
  toDate: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "toDate must be a valid date.")
    .optional(),
  accountStatus: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  sortBy: z.enum(["createdAt", "name", "lastLoginAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const validateAdminListQuery = (query: unknown) =>
  parseWithZod(adminListQuerySchema, query);

export const validateAdminPaymentsQuery = (query: unknown) =>
  parseWithZod(adminPaymentsQuerySchema, query);

export const validateAdminVolunteersQuery = (query: unknown) =>
  parseWithZod(adminVolunteersQuerySchema, query);

export const validateAdminFarmersQuery = (query: unknown) =>
  parseWithZod(adminFarmersQuerySchema, query);
