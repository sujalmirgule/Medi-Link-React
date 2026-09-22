import { Router } from "express";
import healthRouter from "./health";
import authRouter from "../../modules/auth/auth.routes";
import { adminRouter } from "../../modules/admin/admin.routes";
import {
  pharmacyTestRouter,
  deliveryTestRouter,
} from "../../modules/verification/verification.routes";

const router = Router();

// Mount sub-routes for /api/v1
router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/pharmacy", pharmacyTestRouter);
router.use("/delivery", deliveryTestRouter);

export default router;
