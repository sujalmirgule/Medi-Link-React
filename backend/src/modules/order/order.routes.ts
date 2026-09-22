import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { requireVerifiedPharmacy } from "../../middleware/verification.middleware";
import { OrderController } from "./order.controller";

/**
 * Customer Order Routes (/api/v1/orders)
 */
export const orderRouter = Router();

orderRouter.use(authenticate, authorize(UserRole.CUSTOMER));

orderRouter.post("/", OrderController.createOrder);
orderRouter.get("/", OrderController.getCustomerOrders);
orderRouter.get("/:id", OrderController.getCustomerOrderById);

/**
 * Pharmacy Order Management Routes (/api/v1/pharmacy/orders)
 */
export const pharmacyOrderRouter = Router();

pharmacyOrderRouter.use(
  authenticate,
  authorize(UserRole.PHARMACY),
  requireVerifiedPharmacy
);

pharmacyOrderRouter.get("/", OrderController.getPharmacyOrders);
pharmacyOrderRouter.get("/:id", OrderController.getPharmacyOrderById);
pharmacyOrderRouter.post("/:id/accept", OrderController.acceptOrder);
pharmacyOrderRouter.post("/:id/reject", OrderController.rejectOrder);
pharmacyOrderRouter.post("/:id/preparing", OrderController.markPreparing);
pharmacyOrderRouter.post("/:id/ready", OrderController.markReady);

export default orderRouter;
