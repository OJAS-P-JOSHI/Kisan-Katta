import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

// Catches any request that didn't match a route and forwards it to the
// global error handler as a 404.
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};
