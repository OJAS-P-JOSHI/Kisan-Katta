import { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Wraps an async controller so thrown/rejected errors are forwarded to
// Express's error handler instead of crashing the process.
export const asyncHandler = (handler: AsyncRouteHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
};
