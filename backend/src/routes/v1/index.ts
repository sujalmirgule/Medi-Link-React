import { Router } from "express";
import healthRouter from "./health";

const router = Router();

// Mount sub-routes for /api/v1
router.use("/health", healthRouter);

export default router;
