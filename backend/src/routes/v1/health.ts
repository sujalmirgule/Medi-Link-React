import { Router, Request, Response } from "express";

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Liveness health check endpoint
 * @access  Public
 */
router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "MediLink API is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
