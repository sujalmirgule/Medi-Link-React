import { Router, Response } from "express";
import { authenticate, AuthenticatedRequest } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import {
  requireVerifiedPharmacy,
  requireVerifiedDeliveryPartner,
} from "../../middleware/verification.middleware";
import { AdminVerificationController } from "./admin.verification.controller";
import { UserRole } from "@prisma/client";

// Admin Verification Router: /api/v1/admin/verifications
export const adminVerificationRouter = Router();

adminVerificationRouter.use(authenticate, authorize(UserRole.ADMIN));
adminVerificationRouter.get("/", AdminVerificationController.list);
adminVerificationRouter.get("/:id", AdminVerificationController.getById);
adminVerificationRouter.post("/:id/approve", AdminVerificationController.approve);
adminVerificationRouter.post("/:id/reject", AdminVerificationController.reject);

// Pharmacy Verification Access Test Router: /api/v1/pharmacy
export const pharmacyTestRouter = Router();

pharmacyTestRouter.get(
  "/verification-access-test",
  authenticate,
  authorize(UserRole.PHARMACY),
  requireVerifiedPharmacy,
  (req: AuthenticatedRequest, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Pharmacy verified access test passed",
      data: {
        pharmacyId: req.user?.pharmacy?.id,
        isVerified: true,
      },
    });
  }
);

// Delivery Partner Verification Access Test Router: /api/v1/delivery
export const deliveryTestRouter = Router();

deliveryTestRouter.get(
  "/verification-access-test",
  authenticate,
  authorize(UserRole.DELIVERY_PARTNER),
  requireVerifiedDeliveryPartner,
  (req: AuthenticatedRequest, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Delivery partner verified access test passed",
      data: {
        deliveryPartnerId: req.user?.deliveryPartner?.id,
        isVerified: true,
      },
    });
  }
);
