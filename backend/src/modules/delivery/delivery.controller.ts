import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate";
import { DeliveryService } from "./delivery.service";
import {
  availabilitySchema,
  assignmentQuerySchema,
  completeDeliverySchema,
  failDeliverySchema,
  updateLocationSchema,
  updateDeliveryProfileSchema,
} from "./delivery.validation";

export class DeliveryController {
  static async updateAvailability(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = availabilitySchema.parse(req.body);
      const result = await DeliveryService.updateAvailability(req.user!.id, input.isAvailable);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getDashboard(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await DeliveryService.getDashboardStats(req.user!.id);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAssignments(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = assignmentQuerySchema.parse(req.query);
      const result = await DeliveryService.getAssignments(req.user!.id, query);
      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAssignmentById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const assignment = await DeliveryService.getAssignmentById(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        data: assignment,
      });
    } catch (err) {
      next(err);
    }
  }

  static async acceptAssignment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await DeliveryService.acceptAssignment(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        data: result,
        message: "Assignment accepted successfully.",
      });
    } catch (err) {
      next(err);
    }
  }

  static async pickupAssignment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await DeliveryService.pickupAssignment(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        data: result,
        message: "Package picked up from pharmacy.",
      });
    } catch (err) {
      next(err);
    }
  }

  static async outForDelivery(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await DeliveryService.outForDelivery(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        data: result,
        message: "Delivery started. Customer notified with delivery verification OTP.",
      });
    } catch (err) {
      next(err);
    }
  }

  static async completeDelivery(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = completeDeliverySchema.parse(req.body);
      const result = await DeliveryService.completeDelivery(req.user!.id, req.params.id, input.otp);
      res.status(200).json({
        success: true,
        data: result,
        message: "Delivery verified and completed successfully!",
      });
    } catch (err) {
      next(err);
    }
  }

  static async failDelivery(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = failDeliverySchema.parse(req.body);
      const result = await DeliveryService.failDelivery(req.user!.id, req.params.id, input.reason);
      res.status(200).json({
        success: true,
        data: result,
        message: "Delivery attempt marked as failed.",
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateLocation(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = updateLocationSchema.parse(req.body);
      const result = await DeliveryService.updateLocation(
        req.user!.id,
        req.params.id,
        input.latitude,
        input.longitude
      );
      res.status(200).json({
        success: true,
        data: result,
        message: "Location updated successfully.",
      });
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = assignmentQuerySchema.parse(req.query);
      const result = await DeliveryService.getAssignments(req.user!.id, {
        ...query,
        status: "completed",
      });
      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const profile = await DeliveryService.getProfile(req.user!.id);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = updateDeliveryProfileSchema.parse(req.body);
      const updated = await DeliveryService.updateProfile(req.user!.id, input);
      res.status(200).json({
        success: true,
        data: updated,
        message: "Profile updated successfully.",
      });
    } catch (err) {
      next(err);
    }
  }
}
