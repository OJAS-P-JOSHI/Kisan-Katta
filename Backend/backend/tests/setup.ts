// Runs before any test module is imported. Sets deterministic Razorpay keys so
// `src/config/env.ts` (which reads process.env at import time) picks them up and
// signature verification uses a known secret. dotenv does not override values
// already present in process.env, so these win over any .env file.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_for_audit";
process.env.CLOUDINARY_CLOUD_NAME = "test_cloud";
process.env.CLOUDINARY_API_KEY = "test_key";
process.env.CLOUDINARY_API_SECRET = "test_secret";
process.env.RAZORPAY_KEY_ID = "rzp_test_dummy";
process.env.RAZORPAY_KEY_SECRET = "test_secret_key";
process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";
