import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import {
  createPaymentIntent,
  getPaymentForOrder,
  verifyPayment,
  failPayment,
  refundPayment,
  listPaymentsAdmin,
  getPaymentDetailAdmin,
} from "./payment.controller";

// Routes for customer payment actions on a specific order
export const paymentRouter = Router();

// Customer & Pharmacy: create or get payment intent for an order
paymentRouter.post(
  "/orders/:orderId/payment",
  authenticate,
  authorize("CUSTOMER", "PHARMACY"),
  createPaymentIntent
);

paymentRouter.get(
  "/orders/:orderId/payment",
  authenticate,
  authorize("CUSTOMER", "PHARMACY", "DELIVERY_PARTNER", "ADMIN"),
  getPaymentForOrder
);

// Customer / Admin: verify a payment (confirm it was paid)
paymentRouter.post(
  "/payments/:paymentId/verify",
  authenticate,
  authorize("CUSTOMER", "ADMIN"),
  verifyPayment
);

// Customer / Admin: report a payment failure
paymentRouter.post(
  "/payments/:paymentId/fail",
  authenticate,
  authorize("CUSTOMER", "ADMIN"),
  failPayment
);

// Admin-only payment management routes
export const adminPaymentRouter = Router();
adminPaymentRouter.use(authenticate, authorize("ADMIN"));

adminPaymentRouter.get("/", listPaymentsAdmin);
adminPaymentRouter.get("/:id", getPaymentDetailAdmin);
adminPaymentRouter.post("/:id/refund", refundPayment);
