import { Request } from "express";
import { AppError } from "../../utils/AppError";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  HELP_REQUEST_SORT_OPTIONS,
  HELP_REQUEST_STATUSES,
  MAX_LIMIT,
  PUBLIC_HELP_REQUEST_STATUSES,
} from "./assistance.constants";
import type { HelpRequestSortOption, HelpRequestStatus } from "./assistance.types";

/** Shared query-string parsers for the farmer and admin assistance controllers. */

export const parseStringParam = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError("Query parameter must be a non-empty string.", 400);
  }
  return value.trim();
};

export const parsePage = (value: unknown): number => {
  if (value === undefined) return DEFAULT_PAGE;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError("page must be an integer >= 1.", 400);
  }
  return parsed;
};

export const parseLimit = (value: unknown): number => {
  if (value === undefined) return DEFAULT_LIMIT;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > MAX_LIMIT) {
    throw new AppError(`limit must be an integer between 1 and ${MAX_LIMIT}.`, 400);
  }
  return parsed;
};

export const parseSort = (value: unknown): HelpRequestSortOption => {
  if (value === undefined) return "newest";
  if (
    typeof value !== "string" ||
    !(HELP_REQUEST_SORT_OPTIONS as readonly string[]).includes(value)
  ) {
    throw new AppError(
      `sort must be one of: ${HELP_REQUEST_SORT_OPTIONS.join(", ")}.`,
      400
    );
  }
  return value as HelpRequestSortOption;
};

/** The public feed exposes approved requests only. */
export const parseFeedStatus = (value: unknown): HelpRequestStatus | undefined => {
  const status = parseStringParam(value);
  if (status === undefined) return undefined;
  if (!(PUBLIC_HELP_REQUEST_STATUSES as readonly string[]).includes(status)) {
    throw new AppError(
      `status must be one of: ${PUBLIC_HELP_REQUEST_STATUSES.join(", ")}.`,
      400
    );
  }
  return status as HelpRequestStatus;
};

export const parseAnyStatus = (value: unknown): HelpRequestStatus | undefined => {
  const status = parseStringParam(value);
  if (status === undefined) return undefined;
  if (!(HELP_REQUEST_STATUSES as readonly string[]).includes(status)) {
    throw new AppError(
      `status must be one of: ${HELP_REQUEST_STATUSES.join(", ")}.`,
      400
    );
  }
  return status as HelpRequestStatus;
};

export const requireRequestId = (req: Request): string => {
  const requestId = req.params["id"];
  if (!requestId) {
    throw new AppError("Help request id is required.", 400);
  }
  return requestId;
};
