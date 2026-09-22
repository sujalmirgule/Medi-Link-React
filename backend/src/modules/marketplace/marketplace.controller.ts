import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate";
import { MarketplaceService } from "./marketplace.service";
import {
  addressCreateSchema,
  medicineSearchSchema,
  pharmacySearchSchema,
} from "./marketplace.validation";

export class MarketplaceController {
  static async searchMedicines(req: Request, res: Response, next: NextFunction) {
    try {
      const query = medicineSearchSchema.parse(req.query);
      const { items, pagination } = await MarketplaceService.searchMedicines(query);

      res.status(200).json({
        success: true,
        data: items,
        pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMedicineById(req: Request, res: Response, next: NextFunction) {
    try {
      const medicine = await MarketplaceService.getMedicineById(req.params.id);

      res.status(200).json({
        success: true,
        data: { medicine },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMedicinePharmacies(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacies = await MarketplaceService.getMedicinePharmacies(req.params.id);

      res.status(200).json({
        success: true,
        data: pharmacies,
      });
    } catch (err) {
      next(err);
    }
  }

  static async searchPharmacies(req: Request, res: Response, next: NextFunction) {
    try {
      const query = pharmacySearchSchema.parse(req.query);
      const { items, pagination } = await MarketplaceService.searchPharmacies(query);

      res.status(200).json({
        success: true,
        data: items,
        pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCustomerAddresses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const addresses = await MarketplaceService.getCustomerAddresses(userId);

      res.status(200).json({
        success: true,
        data: addresses,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createCustomerAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const validatedInput = addressCreateSchema.parse(req.body);
      const address = await MarketplaceService.createCustomerAddress(userId, validatedInput);

      res.status(201).json({
        success: true,
        message: "Address added successfully.",
        data: { address },
      });
    } catch (err) {
      next(err);
    }
  }
}
