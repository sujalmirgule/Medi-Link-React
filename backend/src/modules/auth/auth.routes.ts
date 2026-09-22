import { Router } from "express";
import { UserRole } from "@prisma/client";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { authRateLimiter } from "../../middleware/rateLimiter";

const router = Router();

// Public Routes with Rate Limiting
router.post("/register", authRateLimiter, AuthController.register);
router.post("/register/pharmacy", authRateLimiter, AuthController.registerPharmacy);
router.post("/register/delivery-partner", authRateLimiter, AuthController.registerDeliveryPartner);
router.post("/login", authRateLimiter, AuthController.login);

// Authenticated Routes
router.get("/me", authenticate, AuthController.getMe);

// Role-Protected Verification Endpoint (Admin Only)
router.get(
  "/test-admin",
  authenticate,
  authorize(UserRole.ADMIN),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted",
      data: {
        adminId: req.user?.id,
        role: req.user?.role,
      },
    });
  }
);

export default router;
