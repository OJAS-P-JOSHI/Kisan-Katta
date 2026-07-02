import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { ApiErrorResponse } from "../types/api-response";
import { env } from "../config/env";

// Express recognizes this as an error-handling middleware purely by its
// four-argument signature, so it must always be declared with all four params.
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction
): void => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message =
    isAppError || err instanceof Error
      ? err.message
      : "Something went wrong";

  if (!isAppError && env.nodeEnv !== "test") {
    // eslint-disable-next-line no-console
    console.error("Unexpected error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
