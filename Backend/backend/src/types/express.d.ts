// Augments Express.Request with the authenticated user identity set by
// auth.middleware after JWT verification.
import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        mobile: string;
        role: import("../modules/auth/auth.constants").UserRole;
      };
      // Raw request body buffer, captured by express.json's verify hook. Needed
      // for Razorpay webhook signature verification (HMAC over the exact bytes).
      rawBody?: Buffer;
    }
  }
}

export {};
