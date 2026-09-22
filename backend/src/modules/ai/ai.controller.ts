import { Request, Response } from "express";
import { chatRequestSchema } from "./ai.validation";
import { AIService } from "./ai.service";

export class AIController {
  /**
   * POST /api/v1/ai/chat
   * Ask basic medicine information questions
   */
  static async chat(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = chatRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: "Invalid chat request parameters",
          errors: parseResult.error.format(),
        });
        return;
      }

      const userId = (req as any).user?.id || (req as any).user?.userId || "anonymous";
      const result = await AIService.processChat(userId, parseResult.data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.statusCode === 404 || error.status === 404) {
        res.status(404).json({
          success: false,
          message: error.message || "Medicine not found",
        });
        return;
      }

      // Never expose provider stack traces or internal secrets
      res.status(500).json({
        success: false,
        message: "AI assistant is temporarily unavailable. Please try again later.",
      });
    }
  }
}
