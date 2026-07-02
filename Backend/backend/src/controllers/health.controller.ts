import { Request, Response } from "express";

interface HealthData {
  status: "ok";
  uptime: number;
  timestamp: string;
}

export const getHealth = (_req: Request, res: Response<{ success: true; data: HealthData }>): void => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
};
