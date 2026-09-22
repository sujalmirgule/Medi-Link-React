import { Router } from "express";
import healthRouter from "./health";
import authRouter from "../../modules/auth/auth.routes";
import { adminRouter } from "../../modules/admin/admin.routes";
import { pharmacyRouter } from "../../modules/pharmacy/pharmacy.routes";
import { deliveryTestRouter } from "../../modules/verification/verification.routes";
import { deliveryRoutes } from "../../modules/delivery/delivery.routes";
import { orderRouter, pharmacyOrderRouter } from "../../modules/order/order.routes";
import {
  medicineRouter,
  pharmacyDiscoveryRouter,
  customerAddressRouter,
} from "../../modules/marketplace/marketplace.routes";

const router = Router();

// Mount sub-routes for /api/v1
router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/pharmacy/orders", pharmacyOrderRouter);
router.use("/pharmacy", pharmacyRouter);
router.use("/delivery", deliveryTestRouter);
router.use("/delivery", deliveryRoutes);
router.use("/orders", orderRouter);
router.use("/medicines", medicineRouter);
router.use("/pharmacies", pharmacyDiscoveryRouter);
router.use("/customer/addresses", customerAddressRouter);

export default router;
