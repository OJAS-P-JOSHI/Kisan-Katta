// Augments Express.Request with the authenticated user identity set by
// auth.middleware after JWT verification.
import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        mobile: string;
      };
    }
  }
}

export {};
