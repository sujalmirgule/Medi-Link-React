import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { AdminController } from "./admin.controller";

export const adminRouter = Router();

// Enforce authentication and ADMIN role for all routes in this router
adminRouter.use(authenticate, authorize(UserRole.ADMIN));

// 1. Dashboard Metrics
adminRouter.get("/dashboard", AdminController.getDashboard);

// 2. Verification Applications Management
adminRouter.get("/verifications", AdminController.listVerifications);
adminRouter.get("/verifications/:id", AdminController.getVerificationById);
adminRouter.post("/verifications/:id/approve", AdminController.approveVerification);
adminRouter.post("/verifications/:id/reject", AdminController.rejectVerification);

// 3. User Management
adminRouter.get("/users", AdminController.listUsers);
adminRouter.get("/users/:id", AdminController.getUserById);
adminRouter.patch("/users/:id/status", AdminController.updateUserStatus);

// 4. Pharmacy Directory
adminRouter.get("/pharmacies", AdminController.listPharmacies);
adminRouter.get("/pharmacies/:id", AdminController.getPharmacyById);

// 5. Delivery Partner Directory
adminRouter.get("/delivery-partners/eligible", AdminController.getEligiblePartners);
adminRouter.get("/delivery-partners", AdminController.listDeliveryPartners);
adminRouter.get("/delivery-partners/:id", AdminController.getDeliveryPartnerById);

// 6. Audit Logs Viewer
adminRouter.get("/audit-logs", AdminController.listAuditLogs);

// 7. Admin Profile
adminRouter.get("/profile", AdminController.getProfile);

// 8. Delivery Management & Assignment
adminRouter.get("/orders/eligible-for-delivery", AdminController.getEligibleOrders);
adminRouter.post("/orders/:orderId/assign-delivery", AdminController.assignDelivery);
adminRouter.get("/deliveries", AdminController.listDeliveries);
adminRouter.get("/deliveries/:id", AdminController.getDeliveryById);

export default adminRouter;

