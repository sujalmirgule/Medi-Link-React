import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { MarketplaceController } from "./marketplace.controller";

/**
 * Public Medicine Discovery Routes (/api/v1/medicines)
 */
export const medicineRouter = Router();

medicineRouter.get("/", MarketplaceController.searchMedicines);
medicineRouter.get("/:id", MarketplaceController.getMedicineById);
medicineRouter.get("/:id/pharmacies", MarketplaceController.getMedicinePharmacies);

/**
 * Public Pharmacy Directory Routes (/api/v1/pharmacies)
 */
export const pharmacyDiscoveryRouter = Router();

pharmacyDiscoveryRouter.get("/", MarketplaceController.searchPharmacies);

/**
 * Customer Address Management Routes (/api/v1/customer/addresses)
 */
export const customerAddressRouter = Router();

customerAddressRouter.use(authenticate, authorize(UserRole.CUSTOMER));

customerAddressRouter.get("/", MarketplaceController.getCustomerAddresses);
customerAddressRouter.post("/", MarketplaceController.createCustomerAddress);
