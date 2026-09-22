import { Router } from "express";
import healthRouter from "./health";
import authRouter from "../../modules/auth/auth.routes";
import { adminRouter } from "../../modules/admin/admin.routes";
import { pharmacyRouter } from "../../modules/pharmacy/pharmacy.routes";
import { deliveryTestRouter } from "../../modules/verification/verification.routes";

const router = Router();

// Mount sub-routes for /api/v1
router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/pharmacy", pharmacyRouter);
router.use("/delivery", deliveryTestRouter);

export default router;
