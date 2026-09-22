import { Router } from "express";
import healthRouter from "./health";
import authRouter from "../../modules/auth/auth.routes";

const router = Router();

// Mount sub-routes for /api/v1
router.use("/health", healthRouter);
router.use("/auth", authRouter);

export default router;
