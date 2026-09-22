import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
  errors?: any;
}

/**
 * Centralized error-handling middleware for Express.
 * Returns consistent JSON response and suppresses internal stack traces in production.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || "Something went wrong";

  if (err instanceof ZodError || err.name === "ZodError") {
    statusCode = 400;
    message = err.errors?.[0]?.message || "Validation failed";
  }

  if (env.isDevelopment) {
    console.error(`[Error] ${req.method} ${req.path} -> ${statusCode}: ${message}`);
    if (err.stack) {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors && { errors: err.errors }),
    ...(env.isDevelopment && { stack: err.stack }),
  });
}
