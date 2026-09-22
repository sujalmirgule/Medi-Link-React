import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate";
import { VerificationService } from "./verification.service";
import { rejectVerificationSchema } from "../auth/auth.validation";

export class AdminVerificationController {
  /**
   * GET /api/v1/admin/verifications
   */
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, role } = req.query;
      const applications = await VerificationService.listVerifications({
        status: status as string,
        role: role as string,
      });

      res.status(200).json({
        success: true,
        message: "Verification applications retrieved successfully",
        data: {
          applications,
          total: applications.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/verifications/:id
   */
  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const application = await VerificationService.getVerificationById(id);

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
  static async approve(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
  static async reject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
}
