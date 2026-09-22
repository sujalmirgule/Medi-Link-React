import { Request, Response, NextFunction } from "express";
import { DiscountService } from "./discount.service";
import {
  createDiscountSchema,
  updateDiscountSchema,
  discountFilterSchema,
  previewDiscountSchema,
} from "./discount.validation";
import { formatResponse } from "../../utils";

export class DiscountController {
  /**
   * POST /api/v1/orders/preview-discount
   * Customer/Client previews a discount calculation before placing order.
   */
  static async previewDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = previewDiscountSchema.parse(req.body);
      const result = await DiscountService.validateAndCalculateDiscount(
        validated.code,
        validated.subtotal
      );

      res.status(200).json(formatResponse(true, result, "Coupon code applied successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/discounts
   * Admin creates a discount coupon.
   */
  static async adminCreateDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user.id;
      const validated = createDiscountSchema.parse(req.body);
      const result = await DiscountService.adminCreateDiscount(adminId, validated);

      res.status(201).json(formatResponse(true, result, "Discount coupon created successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/discounts
   * Admin lists discounts.
   */
  static async adminListDiscounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = discountFilterSchema.parse(req.query);
      const result = await DiscountService.adminListDiscounts(filters);

      res.status(200).json(formatResponse(true, result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/discounts/:id
   * Admin gets single discount.
   */
  static async adminGetDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await DiscountService.adminGetDiscount(id);

      res.status(200).json(formatResponse(true, result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/discounts/:id
   * Admin updates discount.
   */
  static async adminUpdateDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user.id;
      const { id } = req.params;
      const validated = updateDiscountSchema.parse(req.body);
      const result = await DiscountService.adminUpdateDiscount(adminId, id, validated);

      res.status(200).json(formatResponse(true, result, "Discount coupon updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/discounts/:id/status
   * Admin toggles discount active status.
   */
  static async adminToggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user.id;
      const { id } = req.params;
      const isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : true;

      const result = await DiscountService.adminToggleStatus(adminId, id, isActive);
      res.status(200).json(
        formatResponse(
          true,
          result,
          isActive ? "Discount coupon activated" : "Discount coupon deactivated"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/discounts/:id
   * Admin deletes discount coupon.
   */
  static async adminDeleteDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user.id;
      const { id } = req.params;

      const result = await DiscountService.adminDeleteDiscount(adminId, id);
      res.status(200).json(formatResponse(true, result, "Discount coupon deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}
