import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "medilink-super-secret-jwt-key",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_ISSUER: process.env.JWT_ISSUER || "medilink-api",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  DEV_ADMIN_EMAIL: process.env.DEV_ADMIN_EMAIL || "admin@medilink.com",
  DEV_ADMIN_PASSWORD: process.env.DEV_ADMIN_PASSWORD || "Admin@MediLink2026",
  AI_PROVIDER: process.env.AI_PROVIDER || "internal",
  AI_API_KEY: process.env.AI_API_KEY || "",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV !== "production",
};
