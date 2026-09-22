import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { requireVerifiedPharmacy } from "../../middleware/verification.middleware";
import {
  getPharmacySettlements,
  getPharmacySettlementById,
  getAdminSettlements,
  getAdminSettlementById,
  settleAdmin,
  failSettlementAdmin,
} from "./settlement.controller";

export const pharmacySettlementRouter = Router();
pharmacySettlementRouter.use(authenticate, authorize("PHARMACY"), requireVerifiedPharmacy);
pharmacySettlementRouter.get("/", getPharmacySettlements);
pharmacySettlementRouter.get("/:id", getPharmacySettlementById);

export const adminSettlementRouter = Router();
adminSettlementRouter.use(authenticate, authorize("ADMIN"));
adminSettlementRouter.get("/", getAdminSettlements);
adminSettlementRouter.get("/:id", getAdminSettlementById);
adminSettlementRouter.post("/:id/settle", settleAdmin);
adminSettlementRouter.post("/:id/fail", failSettlementAdmin);
