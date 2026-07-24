/**
 * Lightweight in-memory rate limiter for the public verify endpoint.
 * Avoids adding a global dependency; keyed by IP + route.
 */
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/AppError";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60; // 60 / minute / IP

const clientKey = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
};

/** Prune occasionally so the map does not grow without bound. */
const maybePrune = (): void => {
  if (buckets.size < 2_000) return;
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

export const verificationRateLimit = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  maybePrune();
  const key = `verify:${clientKey(req)}`;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  existing.count += 1;
  if (existing.count > MAX_REQUESTS) {
    next(
      new AppError(
        "Too many verification requests. Please try again shortly.",
        429
      )
    );
    return;
  }

  next();
};
