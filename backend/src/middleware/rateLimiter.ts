import rateLimit from "express-rate-limit";

/**
 * Rate Limiter for Authentication Endpoints
 * Limits requests from a single IP to protect against brute-force attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

/**
 * Rate Limiter for AI Assistant Endpoints
 * Limits excessive requests to medicine information AI assistant.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 requests per 15 minutes
  standardHeaders: true,
  message: {
    success: false,
    message: "Too many AI assistant requests. Please try again later.",
  },
});

/**
 * General API Rate Limiter
 * Protects against Denial-of-Service and excessive traffic across general API endpoints.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests to the API. Please slow down and try again later.",
  },
});
