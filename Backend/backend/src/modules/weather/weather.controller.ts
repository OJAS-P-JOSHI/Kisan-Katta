import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { ApiSuccessResponse } from "../../types/api-response";
import {
  getCurrentWeather,
  getForecast,
  getAlerts,
} from "./weather.service";
import {
  AlertsQuery,
  AlertsResponseDTO,
  CurrentWeatherDTO,
  CurrentWeatherQuery,
  ForecastDayDTO,
  ForecastQuery,
} from "./weather.types";

// ---------------------------------------------------------------------------
// Shared validation helpers
// ---------------------------------------------------------------------------

const MIN_DAYS = 1;
const MAX_DAYS = 14; // WeatherAPI.com upper limit
const DEFAULT_DAYS = 3;

// Returns a trimmed, non-empty string or throws 400.
const requireString = (value: unknown, name: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(
      `Query parameter "${name}" is required and must be a non-empty string.`,
      400
    );
  }
  return value.trim();
};

const parseDays = (value: unknown): number => {
  if (value === undefined) return DEFAULT_DAYS;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < MIN_DAYS || parsed > MAX_DAYS) {
    throw new AppError(
      `"days" must be an integer between ${MIN_DAYS} and ${MAX_DAYS}.`,
      400
    );
  }
  return parsed;
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const getCurrentWeatherHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<CurrentWeatherDTO>>
): Promise<void> => {
  const query: CurrentWeatherQuery = {
    district: requireString(req.query.district, "district"),
  };
  const data = await getCurrentWeather(query);
  res.status(200).json({ success: true, data });
};

export const getForecastHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ForecastDayDTO[]>>
): Promise<void> => {
  const query: ForecastQuery = {
    district: requireString(req.query.district, "district"),
    days: parseDays(req.query.days),
  };
  const data = await getForecast(query);
  res.status(200).json({ success: true, data });
};

export const getAlertsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<AlertsResponseDTO>>
): Promise<void> => {
  const query: AlertsQuery = {
    district: requireString(req.query.district, "district"),
  };
  const data = await getAlerts(query);
  res.status(200).json({ success: true, data });
};

