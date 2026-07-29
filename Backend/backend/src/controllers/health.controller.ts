import { Request, Response } from "express";
import { isMongoReady } from "../config/database";

interface HealthData {
  status: "ok" | "unavailable";
  uptime: number;
  timestamp: string;
  mongo: "connected" | "disconnected";
  node: string;
}

export const getHealth = (
  _req: Request,
  res: Response<{ success: boolean; data: HealthData }>
): void => {
  const mongoReady = isMongoReady();
  const data: HealthData = {
    status: mongoReady ? "ok" : "unavailable",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongo: mongoReady ? "connected" : "disconnected",
    node: process.version,
  };

  // 503 lets Railway / load balancers mark the instance unhealthy when Mongo is down.
  res.status(mongoReady ? 200 : 503).json({
    success: mongoReady,
    data,
  });
};
