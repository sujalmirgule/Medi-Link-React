import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { requireVerifiedDeliveryPartner } from "../../middleware/verification.middleware";
import { DeliveryController } from "./delivery.controller";

const router = Router();

// Base protection: all delivery routes require an authenticated DELIVERY_PARTNER
router.use(authenticate, authorize(UserRole.DELIVERY_PARTNER));

// Dashboard & profile are visible to pending/rejected partners to inspect status
router.get("/dashboard", DeliveryController.getDashboard);
router.get("/profile", DeliveryController.getProfile);
router.patch("/profile", DeliveryController.updateProfile);

// Operational routes strictly require VERIFIED delivery partner status
router.patch(
  "/availability",
  requireVerifiedDeliveryPartner,
  DeliveryController.updateAvailability
);

router.get(
  "/assignments",
  requireVerifiedDeliveryPartner,
  DeliveryController.getAssignments
);

router.get(
  "/assignments/:id",
  requireVerifiedDeliveryPartner,
  DeliveryController.getAssignmentById
);

router.post(
  "/assignments/:id/accept",
  requireVerifiedDeliveryPartner,
  DeliveryController.acceptAssignment
);

router.post(
  "/assignments/:id/pickup",
  requireVerifiedDeliveryPartner,
  DeliveryController.pickupAssignment
);

router.post(
  "/assignments/:id/out-for-delivery",
  requireVerifiedDeliveryPartner,
  DeliveryController.outForDelivery
);

router.post(
  "/assignments/:id/complete",
  requireVerifiedDeliveryPartner,
  DeliveryController.completeDelivery
);

router.post(
  "/assignments/:id/fail",
  requireVerifiedDeliveryPartner,
  DeliveryController.failDelivery
);

router.patch(
  "/assignments/:id/location",
  requireVerifiedDeliveryPartner,
  DeliveryController.updateLocation
);

router.get(
  "/history",
  requireVerifiedDeliveryPartner,
  DeliveryController.getHistory
);

export const deliveryRoutes = router;
