import { Request, Response, NextFunction } from "express";
import { ReviewService } from "./review.service";
import {
  createReviewSchema,
  updateReviewSchema,
  reviewFilterSchema,
} from "./review.validation";
import { formatResponse } from "../../utils";

export class ReviewController {
  /**
   * POST /api/v1/reviews
   * Customer submits a review.
   */
  static async createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = (req as any).user.id;
      const validated = createReviewSchema.parse(req.body);
      const review = await ReviewService.createReview(customerId, validated);

      res.status(201).json(formatResponse(true, review, "Review submitted successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/reviews/:id
   * Customer updates their own review.
   */
  static async updateReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = (req as any).user.id;
      const reviewId = req.params.id;
      const validated = updateReviewSchema.parse(req.body);
      const updated = await ReviewService.updateReview(customerId, reviewId, validated);

      res.status(200).json(formatResponse(true, updated, "Review updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/reviews/me
   * List customer's own reviews.
   */
  static async listMyReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = (req as any).user.id;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await ReviewService.listMyReviews(customerId, { page, limit });
      res.status(200).json(formatResponse(true, result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/orders/:orderId/review-status
   * Get review status for an order.
   */
  static async getOrderReviewStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = (req as any).user.id;
      const { orderId } = req.params;
      const status = await ReviewService.getOrderReviewStatus(customerId, orderId);

      res.status(200).json(formatResponse(true, status));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/medicines/:id/reviews
   * Public: List reviews for a medicine.
   */
  static async listMedicineReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const medicineId = req.params.id;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await ReviewService.listMedicineReviews(medicineId, { page, limit });
      res.status(200).json(formatResponse(true, result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacies/:id/rating
   * Public: Get aggregate rating for a pharmacy.
   */
  static async getPharmacyRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pharmacyId = req.params.id;
      const result = await ReviewService.getPharmacyAverageRating(pharmacyId);
      res.status(200).json(formatResponse(true, result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/delivery/partners/:id/rating
   * Public / Authenticated: Get aggregate rating for a delivery partner.
   */
  static async getDeliveryPartnerRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deliveryPartnerId = req.params.id;
      const result = await ReviewService.getDeliveryPartnerAverageRating(deliveryPartnerId);
      res.status(200).json(formatResponse(true, result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/reviews
   * Admin: List all reviews.
   */
  static async adminListReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = reviewFilterSchema.parse(req.query);
      const result = await ReviewService.adminListReviews(filters);
      res.status(200).json(formatResponse(true, result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/reviews/:id/hide
   * Admin: Hide / unhide review.
   */
  static async adminHideReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user.id;
      const reviewId = req.params.id;
      const isHidden = req.body.isHidden !== undefined ? Boolean(req.body.isHidden) : true;

      const result = await ReviewService.adminHideReview(adminId, reviewId, isHidden);
      res.status(200).json(
        formatResponse(
          true,
          result,
          isHidden ? "Review hidden from public view" : "Review unhidden successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/reviews/:id
   * Admin: Hard delete review.
   */
  static async adminDeleteReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user.id;
      const reviewId = req.params.id;

      const result = await ReviewService.adminDeleteReview(adminId, reviewId);
      res.status(200).json(formatResponse(true, result, "Review deleted permanently"));
    } catch (error) {
      next(error);
    }
  }
}
