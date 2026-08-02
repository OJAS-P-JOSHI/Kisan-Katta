import { AppError } from "../../utils/AppError";
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  MODERATION_NOTE_MAX_LENGTH,
  REPORT_DETAILS_MAX_LENGTH,
  REPORT_REASONS,
  TITLE_MAX_LENGTH,
} from "./assistance.constants";
import { validateHelpRequestImages } from "./assistance.image.validation";
import type {
  CreateHelpRequestBody,
  ModerationBody,
  ReportHelpRequestBody,
  ReportReason,
  UpdateHelpRequestBody,
} from "./assistance.types";

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAGS = /<[^>]*>/g;

/**
 * Farmer-authored copy is stored as plain text: markup is stripped, control
 * characters removed, and runs of whitespace collapsed. Marathi text and
 * intentional paragraph breaks are preserved.
 */
const sanitizeText = (value: string): string =>
  value
    .replace(HTML_TAGS, " ")
    .replace(CONTROL_CHARACTERS, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// ---------------------------------------------------------------------------
// Field validators
// ---------------------------------------------------------------------------

const validateTitle = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new AppError("title is required and must be a string.", 400);
  }

  const title = sanitizeText(value);

  if (title.length === 0) {
    throw new AppError("title is required.", 400);
  }
  if (title.length > TITLE_MAX_LENGTH) {
    throw new AppError(
      `title cannot exceed ${TITLE_MAX_LENGTH} characters.`,
      400
    );
  }

  return title;
};

const validateDescription = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new AppError("description is required and must be a string.", 400);
  }

  const description = sanitizeText(value);

  if (description.length < DESCRIPTION_MIN_LENGTH) {
    throw new AppError(
      `description must be at least ${DESCRIPTION_MIN_LENGTH} characters.`,
      400
    );
  }
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    throw new AppError(
      `description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters.`,
      400
    );
  }

  return description;
};

const validateReason = (value: unknown): ReportReason => {
  if (typeof value !== "string" || !(REPORT_REASONS as readonly string[]).includes(value)) {
    throw new AppError(`reason must be one of: ${REPORT_REASONS.join(", ")}.`, 400);
  }
  return value as ReportReason;
};

const validateOptionalNote = (
  value: unknown,
  field: string,
  maxLength: number
): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new AppError(`${field} must be a string when provided.`, 400);
  }

  const note = sanitizeText(value);
  if (note.length === 0) return undefined;
  if (note.length > maxLength) {
    throw new AppError(`${field} cannot exceed ${maxLength} characters.`, 400);
  }

  return note;
};

/**
 * Author identity, location, and timestamps always come from the session and
 * the stored profile — a client can never supply them.
 */
const rejectAuthorFields = (body: Record<string, unknown>): void => {
  const forbidden = [
    "author",
    "name",
    "profilePhoto",
    "phone",
    "village",
    "taluka",
    "district",
    "state",
    "verified",
    "status",
    "supportCount",
    "reportCount",
    "isDeleted",
    "deletedAt",
    "reviewedAt",
    "reviewedBy",
    "moderationNote",
    "resolvedAt",
    "userId",
    "createdAt",
    "updatedAt",
  ];

  const supplied = forbidden.find((field) => body[field] !== undefined);
  if (supplied) {
    throw new AppError(
      `${supplied} cannot be supplied by the client. It is derived from your profile automatically.`,
      400
    );
  }
};

// ---------------------------------------------------------------------------
// Exported validators
// ---------------------------------------------------------------------------

export const validateCreateHelpRequest = (
  body: Record<string, unknown>,
  userId: string
): CreateHelpRequestBody => {
  rejectAuthorFields(body);

  return {
    title: validateTitle(body["title"]),
    description: validateDescription(body["description"]),
    images: validateHelpRequestImages(body["images"], userId),
  };
};

export const validateUpdateHelpRequest = (
  body: Record<string, unknown>,
  userId: string
): UpdateHelpRequestBody => {
  rejectAuthorFields(body);

  const result: UpdateHelpRequestBody = {};

  if (body["title"] !== undefined) {
    result.title = validateTitle(body["title"]);
  }
  if (body["description"] !== undefined) {
    result.description = validateDescription(body["description"]);
  }
  if (body["images"] !== undefined) {
    result.images = validateHelpRequestImages(body["images"], userId);
  }

  if (Object.keys(result).length === 0) {
    throw new AppError("At least one field must be provided to update.", 400);
  }

  return result;
};

export const validateReportHelpRequest = (
  body: Record<string, unknown>
): ReportHelpRequestBody => {
  const reason = validateReason(body["reason"]);
  const result: ReportHelpRequestBody = { reason };

  const details = validateOptionalNote(
    body["details"],
    "details",
    REPORT_DETAILS_MAX_LENGTH
  );
  if (details !== undefined) {
    result.details = details;
  }

  if (reason === "OTHER" && result.details === undefined) {
    throw new AppError("details is required when reason is OTHER.", 400);
  }

  return result;
};

export const validateModerationBody = (
  body: Record<string, unknown>
): ModerationBody => {
  const result: ModerationBody = {};

  const note = validateOptionalNote(
    body["note"],
    "note",
    MODERATION_NOTE_MAX_LENGTH
  );
  if (note !== undefined) {
    result.note = note;
  }

  return result;
};
