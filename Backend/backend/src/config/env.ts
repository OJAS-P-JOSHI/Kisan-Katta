import dotenv from "dotenv";

// Load .env for local/dev. On Railway, vars are injected into process.env;
// dotenv is a no-op when the file is absent.
dotenv.config();

interface EnvConfig {
  port: number;
  host: string;
  nodeEnv: "development" | "production" | "test";
  corsOrigin: string;
  weatherApiKey: string;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  otpExpiryMinutes: number;
  marketApiBaseUrl: string;
  marketDatasetId: string;
  marketApiKey: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string;
}

const parsePort = (value: string | undefined): number => {
  // Railway always sets PORT. Prefer it over any hardcoded default.
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 4000;
};

// Centralized, typed access to environment variables with sane defaults.
export const env: EnvConfig = {
  port: parsePort(process.env.PORT),
  // "0.0.0.0" binds to every network interface (not just loopback), which is
  // what allows LAN devices (Android emulator/physical devices, other
  // machines) to reach the server. This is also the standard bind address
  // for production deployments behind a reverse proxy/load balancer, so it
  // is safe to keep as the default in every environment. Override via HOST
  // if a deployment ever needs to restrict binding to a single interface.
  host: process.env.HOST || "0.0.0.0",
  nodeEnv: (process.env.NODE_ENV as EnvConfig["nodeEnv"]) || "development",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  weatherApiKey: process.env.WEATHER_API_KEY || "",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/kisan-katta",
  jwtSecret: process.env.JWT_SECRET || "changeme",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d",
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES) || 5,
  marketApiBaseUrl: process.env.MARKET_API_BASE_URL || "https://api.data.gov.in",
  marketDatasetId:
    process.env.MARKET_DATASET_ID || "35985678-0d79-46b4-9ed6-6f13308a1d24",
  marketApiKey: process.env.MARKET_API_KEY || "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
};

export const isProduction = (): boolean => env.nodeEnv === "production";
