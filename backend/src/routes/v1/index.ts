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
import { paymentRouter, adminPaymentRouter } from "../../modules/payments/payment.routes";
import { pharmacySettlementRouter, adminSettlementRouter } from "../../modules/settlements/settlement.routes";
import { notificationRouter } from "../../modules/notifications/notification.routes";

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

// Phase 9: Payment & Settlement routes
router.use("/", paymentRouter);
router.use("/admin/payments", adminPaymentRouter);
router.use("/pharmacy/settlements", pharmacySettlementRouter);
router.use("/admin/settlements", adminSettlementRouter);

// Phase 10: Notifications
router.use("/notifications", notificationRouter);

// Phase 11: Reviews, Ratings & Discounts
import { reviewRouter, adminReviewRouter } from "../../modules/reviews/review.routes";
import { discountRouter, adminDiscountRouter } from "../../modules/discounts/discount.routes";

// Phase 12: AI Assistant
import { aiRouter } from "../../modules/ai/ai.routes";

router.use("/reviews", reviewRouter);
router.use("/discounts", discountRouter);
router.use("/admin/reviews", adminReviewRouter);
router.use("/admin/discounts", adminDiscountRouter);
router.use("/ai", aiRouter);

export default router;
