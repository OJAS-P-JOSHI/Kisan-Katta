import { z } from "zod";
import { AppError } from "../../utils/AppError";

/** Display format: GS-MH-2026-000012 — also accepts bare GS-2026-000012. */
export const VOLUNTEER_ID_REGEX = /^GS(?:-MH)?-\d{4}-\d{1,12}$/i;

const volunteerIdParamSchema = z.object({
  volunteerId: z
    .string()
    .trim()
    .min(8)
    .max(40)
    .regex(VOLUNTEER_ID_REGEX, "Invalid Volunteer ID format."),
});

export const validateVolunteerIdParam = (params: unknown): string => {
  const result = volunteerIdParamSchema.safeParse(params);
  if (!result.success) {
    throw new AppError(
      result.error.issues[0]?.message ?? "Invalid Volunteer ID.",
      400
    );
  }
  return result.data.volunteerId.trim().toUpperCase();
};

/**
 * Map public Volunteer ID → stored applicationNumber.
 * GS-MH-2026-000012 → GS-2026-000012
 * GS-2026-000012    → GS-2026-000012
 */
export const volunteerIdToApplicationNumber = (volunteerId: string): string => {
  const raw = volunteerId.trim().toUpperCase();
  const mh = raw.match(/^GS-MH-(\d{4})-(\d+)$/);
  if (mh) return `GS-${mh[1]}-${mh[2]}`;
  const plain = raw.match(/^GS-(\d{4})-(\d+)$/);
  if (plain) return raw;
  throw new AppError("Invalid Volunteer ID format.", 400);
};

/** Canonical public Volunteer ID for responses. */
export const toPublicVolunteerId = (applicationNumber: string): string => {
  const raw = applicationNumber.trim().toUpperCase();
  const match = raw.match(/^GS-(\d{4})-(\d+)$/);
  if (match) return `GS-MH-${match[1]}-${match[2]}`;
  if (/^GS-MH-\d{4}-\d+$/.test(raw)) return raw;
  return raw;
};
