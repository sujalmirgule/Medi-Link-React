import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { ReviewController } from "./review.controller";

export const reviewRouter = Router();

// Public routes for reading reviews/ratings
reviewRouter.get("/medicines/:id", ReviewController.listMedicineReviews);
reviewRouter.get("/pharmacies/:id/rating", ReviewController.getPharmacyRating);
reviewRouter.get("/delivery-partners/:id/rating", ReviewController.getDeliveryPartnerRating);

// Customer protected routes
reviewRouter.post("/", authenticate, authorize(UserRole.CUSTOMER), ReviewController.createReview);
reviewRouter.get("/me", authenticate, authorize(UserRole.CUSTOMER), ReviewController.listMyReviews);
reviewRouter.patch("/:id", authenticate, authorize(UserRole.CUSTOMER), ReviewController.updateReview);
reviewRouter.get(
  "/order-status/:orderId",
  authenticate,
  authorize(UserRole.CUSTOMER),
  ReviewController.getOrderReviewStatus
);
reviewRouter.get(
  "/orders/:orderId/review-status",
  authenticate,
  authorize(UserRole.CUSTOMER),
  ReviewController.getOrderReviewStatus
);

// Admin review router
export const adminReviewRouter = Router();
adminReviewRouter.use(authenticate, authorize(UserRole.ADMIN));
adminReviewRouter.get("/", ReviewController.adminListReviews);
adminReviewRouter.patch("/:id/hide", ReviewController.adminHideReview);
adminReviewRouter.delete("/:id", ReviewController.adminDeleteReview);
