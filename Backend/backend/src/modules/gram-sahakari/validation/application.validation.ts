import { z } from "zod";
import { AppError } from "../../../utils/AppError";
import {
  AADHAAR_REGEX,
  APPLICATION_STATUSES,
  DOCUMENT_TYPES,
  GENDERS,
  IFSC_REGEX,
  INDIAN_PHONE_REGEX,
  PAYMENT_STATUSES,
  PINCODE_REGEX,
} from "../gram-sahakari.constants";

const formatZodError = (error: z.ZodError): string =>
  error.issues.map((issue) => issue.message).join("; ");

export const parseWithZod = <T>(schema: z.ZodType<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(formatZodError(result.error), 400);
  }
  return result.data;
};

const optionalTrimmedString = z.string().trim().min(1).optional();

const phoneSchema = z
  .string()
  .trim()
  .regex(INDIAN_PHONE_REGEX, "Phone must be a valid Indian mobile number.");

const aadhaarSchema = z
  .string()
  .trim()
  .regex(AADHAAR_REGEX, "Aadhaar number must be exactly 12 digits.");

const ifscSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(IFSC_REGEX, "IFSC must match format ABCD0123456.");

const pincodeSchema = z
  .string()
  .trim()
  .regex(PINCODE_REGEX, "Pincode must be a valid 6-digit Indian pincode.");

const dobSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Date of birth must be a valid date.");

export const updateApplicationSchema = z
  .object({
    fullName: optionalTrimmedString,
    phone: phoneSchema.optional(),
    email: z.string().trim().email("Email must be valid.").optional(),
    gender: z.enum(GENDERS).optional(),
    dob: dobSchema.optional(),
    district: optionalTrimmedString,
    taluka: optionalTrimmedString,
    village: optionalTrimmedString,
    address: optionalTrimmedString,
    pincode: pincodeSchema.optional(),
    aadhaarNumber: aadhaarSchema.optional(),
    bankAccountHolder: optionalTrimmedString,
    bankAccountNumber: z
      .string()
      .trim()
      .regex(/^[0-9]{9,18}$/, "Bank account number must be 9 to 18 digits.")
      .optional(),
    bankIFSC: ifscSchema.optional(),
    bankName: optionalTrimmedString,
  })
  .strict();

export const documentTypeSchema = z.enum(DOCUMENT_TYPES);

export const adminApplicationsQuerySchema = z.object({
  district: z.string().trim().min(1).optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  search: z.string().trim().min(1).optional(),
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
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const validateUpdateApplication = (body: unknown) =>
  parseWithZod(updateApplicationSchema, body);

export const validateDocumentType = (value: unknown) =>
  parseWithZod(documentTypeSchema, value);

export const validateAdminApplicationsQuery = (query: unknown) =>
  parseWithZod(adminApplicationsQuerySchema, query);

/**
 * Completeness check for "Pay ₹500 & Submit" readiness.
 * Required: personal (name/dob/gender), address, aadhaar + images, bank + cheque.
 */
export const assertSubmitReady = (application: {
  fullName: string | null;
  gender: string | null;
  dob: Date | null;
  district: string | null;
  taluka: string | null;
  village: string | null;
  address: string | null;
  pincode: string | null;
  aadhaarNumber: string | null;
  aadhaarFront: unknown;
  aadhaarBack: unknown;
  cancelledChequeImage: unknown;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
  bankIFSC: string | null;
  bankName: string | null;
}): void => {
  const missing: string[] = [];

  if (!application.fullName) missing.push("fullName");
  if (!application.gender) missing.push("gender");
  if (!application.dob) missing.push("dob");
  if (!application.district) missing.push("district");
  if (!application.taluka) missing.push("taluka");
  if (!application.village) missing.push("village");
  if (!application.address) missing.push("address");
  if (!application.pincode) missing.push("pincode");
  if (!application.aadhaarNumber) missing.push("aadhaarNumber");
  if (!application.aadhaarFront) missing.push("aadhaarFront");
  if (!application.aadhaarBack) missing.push("aadhaarBack");
  if (!application.cancelledChequeImage) missing.push("cancelledChequeImage");
  if (!application.bankAccountHolder) missing.push("bankAccountHolder");
  if (!application.bankAccountNumber) missing.push("bankAccountNumber");
  if (!application.bankIFSC) missing.push("bankIFSC");
  if (!application.bankName) missing.push("bankName");

  if (missing.length > 0) {
    throw new AppError(
      `Application is incomplete. Missing required fields: ${missing.join(", ")}.`,
      400
    );
  }
};
