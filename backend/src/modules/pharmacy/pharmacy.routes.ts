import { Router, Response } from "express";
import { UserRole } from "@prisma/client";
import { authenticate, AuthenticatedRequest } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { requireVerifiedPharmacy } from "../../middleware/verification.middleware";
import { PharmacyController } from "./pharmacy.controller";

export const pharmacyRouter = Router();

// Base authorization for all pharmacy portal routes
pharmacyRouter.use(authenticate, authorize(UserRole.PHARMACY));

// -----------------------------------------------------------------------------
// 1. Unrestricted to All Authenticated Pharmacies (PENDING, REJECTED, VERIFIED)
// -----------------------------------------------------------------------------
// Dashboard & Profile viewing must be accessible so pending/rejected partners
// can see their status banner and rejection reason.
pharmacyRouter.get("/dashboard", PharmacyController.getDashboard);
pharmacyRouter.get("/profile", PharmacyController.getProfile);

// Legacy Phase 3 Verification Access Test Endpoint (for regression test suite)
pharmacyRouter.get(
  "/verification-access-test",
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

// -----------------------------------------------------------------------------
// 2. Business Operations (STRICTLY requireVerifiedPharmacy)
// -----------------------------------------------------------------------------
// Any pending or rejected account attempting to mutate profile or access
// medicine / inventory modules will immediately receive HTTP 403 Forbidden.

// Profile Modification
pharmacyRouter.patch("/profile", requireVerifiedPharmacy, PharmacyController.updateProfile);

// Master Medicine Catalog Search
pharmacyRouter.get("/medicines/catalog", requireVerifiedPharmacy, PharmacyController.getCatalog);

// Categories
pharmacyRouter.get("/categories", requireVerifiedPharmacy, PharmacyController.getCategories);

// Pharmacy Medicine Listings
pharmacyRouter.get("/medicines", requireVerifiedPharmacy, PharmacyController.listMedicines);
pharmacyRouter.post("/medicines", requireVerifiedPharmacy, PharmacyController.createMedicine);
pharmacyRouter.get("/medicines/:id", requireVerifiedPharmacy, PharmacyController.getMedicineById);
pharmacyRouter.patch("/medicines/:id", requireVerifiedPharmacy, PharmacyController.updateMedicine);
pharmacyRouter.delete("/medicines/:id", requireVerifiedPharmacy, PharmacyController.deleteMedicine);

// Batch-level Inventory Management
pharmacyRouter.get("/inventory", requireVerifiedPharmacy, PharmacyController.listInventoryBatches);
pharmacyRouter.post("/inventory", requireVerifiedPharmacy, PharmacyController.createInventoryBatch);
pharmacyRouter.get("/inventory/:id", requireVerifiedPharmacy, PharmacyController.getInventoryBatchById);
pharmacyRouter.patch("/inventory/:id", requireVerifiedPharmacy, PharmacyController.updateInventoryBatch);

export default pharmacyRouter;
