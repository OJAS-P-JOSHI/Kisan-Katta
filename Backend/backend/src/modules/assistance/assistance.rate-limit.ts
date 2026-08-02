/**
 * Lightweight in-memory rate limiter for assistance write / upload endpoints.
 * Mirrors verification.rate-limit — keyed by authenticated userId when present,
 * otherwise by client IP.
 */
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/AppError";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;

const clientKey = (req: Request): string => {
  if (req.user?.userId) return `user:${req.user.userId}`;

  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return `ip:${forwarded.split(",")[0]!.trim()}`;
  }
  return `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;
};

const maybePrune = (): void => {
  if (buckets.size < 2_000) return;
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

const createRateLimit =
  (scope: string, maxRequests: number) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    maybePrune();
    const key = `${scope}:${clientKey(req)}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > maxRequests) {
      next(
        new AppError(
          "Too many assistance requests. Please try again shortly.",
          429
        )
      );
      return;
    }

    next();
  };

/** Create / update / resolve / delete / support / report. */
export const assistanceWriteRateLimit = createRateLimit("assistance-write", 30);

/** Cloudinary-backed uploads — tighter to limit storage abuse. */
export const assistanceUploadRateLimit = createRateLimit("assistance-upload", 20);
