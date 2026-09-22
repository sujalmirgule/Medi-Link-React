import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { aiRateLimiter } from "../../middleware/rateLimiter";
import { AIController } from "./ai.controller";

export const aiRouter = Router();

/**
 * AI Medicine Information Assistant Endpoints (/api/v1/ai)
 */
aiRouter.post("/chat", authenticate, aiRateLimiter, AIController.chat);
