import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import routes from "./routes";
import { notFoundHandler } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

export const createApp = (): Application => {
  const app = express();

  // Security headers
  app.use(helmet());

  // Cross-origin access control
  app.use(cors({ origin: env.corsOrigin }));

  // HTTP request logging (disabled in tests to keep output clean)
  if (env.nodeEnv !== "test") {
    app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  }

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes (includes /health and /api/v1/market)
  app.use(routes);

  // 404 + global error handling, must be registered last
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
