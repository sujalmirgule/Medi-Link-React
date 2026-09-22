import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Centralized error-handling middleware for Express.
 * Returns consistent JSON response and suppresses internal stack traces in production.
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Something went wrong";

  if (env.isDevelopment) {
    console.error(`[Error] ${req.method} ${req.path} -> ${statusCode}: ${message}`);
    if (err.stack) {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.isDevelopment && { stack: err.stack }),
  });
}
