import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  port: number;
  host: string;
  nodeEnv: "development" | "production" | "test";
  corsOrigin: string;
  weatherApiKey: string;
}

// Centralized, typed access to environment variables with sane defaults.
export const env: EnvConfig = {
  port: Number(process.env.PORT) || 4000,
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
};

export const isProduction = (): boolean => env.nodeEnv === "production";
