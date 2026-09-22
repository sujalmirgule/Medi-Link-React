import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate";
import { AdminService } from "./admin.service";
import { VerificationService } from "../verification/verification.service";
import {
  auditLogFilterSchema,
  deliveryPartnerFilterSchema,
  pharmacyFilterSchema,
  userFilterSchema,
  userStatusUpdateSchema,
  verificationFilterSchema,
} from "./admin.validation";
import { rejectVerificationSchema } from "../auth/auth.validation";

export class AdminController {
  /**
   * GET /api/v1/admin/dashboard
   */
  static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getDashboardStats();
      res.status(200).json({
        success: true,
        message: "Dashboard metrics retrieved successfully",
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/verifications
   */
  static async listVerifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = verificationFilterSchema.parse(req.query);
      const result = await AdminService.listVerifications(filters);
      res.status(200).json({
        success: true,
        message: "Verifications retrieved successfully",
        data: {
          applications: result.items,
          items: result.items,
          pagination: result.pagination,
        },
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/verifications/:id
   */
  static async getVerificationById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const application = await AdminService.getVerificationById(id);
      res.status(200).json({
        success: true,
        message: "Verification application retrieved successfully",
        data: { application },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/verifications/:id/approve
   */
  static async approveVerification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminUserId = req.user!.id;
      const application = await VerificationService.approveVerification(id, adminUserId);
      res.status(200).json({
        success: true,
        message: "Verification application approved successfully",
        data: { application },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/verifications/:id/reject
   */
  static async rejectVerification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminUserId = req.user!.id;
      const validated = rejectVerificationSchema.parse(req.body);
      const application = await VerificationService.rejectVerification(
        id,
        adminUserId,
        validated.reason
      );
      res.status(200).json({
        success: true,
        message: "Verification application rejected successfully",
        data: { application },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/users
   */
  static async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = userFilterSchema.parse(req.query);
      const result = await AdminService.listUsers(filters);
      res.status(200).json({
        success: true,
        message: "Users retrieved successfully",
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/users/:id
   */
  static async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await AdminService.getUserById(id);
      res.status(200).json({
        success: true,
        message: "User details retrieved successfully",
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/users/:id/status
   */
  static async updateUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isActive } = userStatusUpdateSchema.parse(req.body);
      const adminUserId = req.user!.id;
      const updatedUser = await AdminService.updateUserStatus(id, isActive, adminUserId);
      res.status(200).json({
        success: true,
        message: `User account successfully ${isActive ? "activated" : "deactivated"}`,
        data: { user: updatedUser },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/pharmacies
   */
  static async listPharmacies(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = pharmacyFilterSchema.parse(req.query);
      const result = await AdminService.listPharmacies(filters);
      res.status(200).json({
        success: true,
        message: "Pharmacies retrieved successfully",
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/pharmacies/:id
   */
  static async getPharmacyById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const pharmacy = await AdminService.getPharmacyById(id);
      res.status(200).json({
        success: true,
        message: "Pharmacy details retrieved successfully",
        data: { pharmacy },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/delivery-partners
   */
  static async listDeliveryPartners(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = deliveryPartnerFilterSchema.parse(req.query);
      const result = await AdminService.listDeliveryPartners(filters);
      res.status(200).json({
        success: true,
        message: "Delivery partners retrieved successfully",
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/delivery-partners/:id
   */
  static async getDeliveryPartnerById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const partner = await AdminService.getDeliveryPartnerById(id);
      res.status(200).json({
        success: true,
        message: "Delivery partner details retrieved successfully",
        data: { partner },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/audit-logs
   */
  static async listAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = auditLogFilterSchema.parse(req.query);
      const result = await AdminService.listAuditLogs(filters);
      res.status(200).json({
        success: true,
        message: "Audit logs retrieved successfully",
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/profile
   */
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adminUserId = req.user!.id;
      const profile = await AdminService.getAdminProfile(adminUserId);
      res.status(200).json({
        success: true,
        message: "Admin profile retrieved successfully",
        data: { profile },
      });
    } catch (err) {
      next(err);
    }
  }
}
