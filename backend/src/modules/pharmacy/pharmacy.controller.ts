import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate";
import { PharmacyService } from "./pharmacy.service";
import {
  catalogFilterSchema,
  inventoryBatchCreateSchema,
  inventoryBatchUpdateSchema,
  inventoryFilterSchema,
  pharmacyMedicineCreateSchema,
  pharmacyMedicineFilterSchema,
  pharmacyMedicineUpdateSchema,
  pharmacyProfileUpdateSchema,
} from "./pharmacy.validation";

function getPharmacyId(req: AuthenticatedRequest): string {
  const pharmacyId = req.user?.pharmacy?.id;
  if (!pharmacyId) {
    const error: any = new Error("No pharmacy profile associated with this account");
    error.statusCode = 400;
    throw error;
  }
  return pharmacyId;
}

export class PharmacyController {
  /**
   * GET /api/v1/pharmacy/dashboard
   */
  static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = getPharmacyId(req);
      const data = await PharmacyService.getDashboardData(pharmacyId);
      res.status(200).json({
        success: true,
        message: "Pharmacy dashboard retrieved successfully",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/pharmacy/profile
   */
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = getPharmacyId(req);
      const pharmacy = await PharmacyService.getProfile(pharmacyId);
      res.status(200).json({
        success: true,
        message: "Pharmacy profile retrieved successfully",
        data: { pharmacy },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/pharmacy/profile
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = getPharmacyId(req);
      const validated = pharmacyProfileUpdateSchema.parse(req.body);
      const updated = await PharmacyService.updateProfile(pharmacyId, validated, req.user!.id);
      res.status(200).json({
        success: true,
        message: "Pharmacy profile updated successfully",
        data: { pharmacy: updated },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/pharmacy/medicines/catalog
   */
  static async getCatalog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = catalogFilterSchema.parse(req.query);
      const result = await PharmacyService.getCatalogMedicines(filters);
      res.status(200).json({
        success: true,
        message: "Medicine catalog retrieved successfully",
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/pharmacy/medicines
   */
  static async listMedicines(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = getPharmacyId(req);
      const filters = pharmacyMedicineFilterSchema.parse(req.query);
      const result = await PharmacyService.listMedicines(pharmacyId, filters);
      res.status(200).json({
        success: true,
        message: "Pharmacy medicines retrieved successfully",
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/pharmacy/medicines/:id
   */
  static async getMedicineById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = getPharmacyId(req);
      const { id } = req.params;
      const medicine = await PharmacyService.getMedicineById(pharmacyId, id);
      res.status(200).json({
        success: true,
        message: "Pharmacy medicine details retrieved successfully",
        data: { medicine },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/pharmacy/medicines
   */
  static async createMedicine(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = getPharmacyId(req);
      const validated = pharmacyMedicineCreateSchema.parse(req.body);
      const created = await PharmacyService.createMedicine(pharmacyId, validated, req.user!.id);
      res.status(201).json({
        success: true,
        message: "Medicine added to pharmacy successfully",
        data: { medicine: created },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/pharmacy/medicines/:id
   */
  static async updateMedicine(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = getPharmacyId(req);
      const { id } = req.params;
      const validated = pharmacyMedicineUpdateSchema.parse(req.body);
      const updated = await PharmacyService.updateMedicine(pharmacyId, id, validated, req.user!.id);
      res.status(200).json({
        success: true,
        message: "Pharmacy medicine updated successfully",
        data: { medicine: updated },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/pharmacy/medicines/:id
   */
  static async deleteMedicine(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = getPharmacyId(req);
      const { id } = req.params;
      await PharmacyService.deleteMedicine(pharmacyId, id, req.user!.id);
      res.status(200).json({
        success: true,
        message: "Pharmacy medicine listing removed successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/pharmacy/inventory
   */
  static async listInventoryBatches(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = getPharmacyId(req);
      const filters = inventoryFilterSchema.parse(req.query);
      const result = await PharmacyService.listInventoryBatches(pharmacyId, filters);
      res.status(200).json({
        success: true,
        message: "Inventory batches retrieved successfully",
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/pharmacy/inventory/:id
   */
  static async getInventoryBatchById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = getPharmacyId(req);
      const { id } = req.params;
      const batch = await PharmacyService.getInventoryBatchById(pharmacyId, id);
      res.status(200).json({
        success: true,
        message: "Inventory batch retrieved successfully",
        data: { batch },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/pharmacy/inventory
   */
  static async createInventoryBatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = getPharmacyId(req);
      const validated = inventoryBatchCreateSchema.parse(req.body);
      const batch = await PharmacyService.createInventoryBatch(pharmacyId, validated, req.user!.id);
      res.status(201).json({
        success: true,
        message: "Inventory batch created successfully",
        data: { batch },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/pharmacy/inventory/:id
   */
  static async updateInventoryBatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = getPharmacyId(req);
      const { id } = req.params;
      const validated = inventoryBatchUpdateSchema.parse(req.body);
      const batch = await PharmacyService.updateInventoryBatch(
        pharmacyId,
        id,
        validated,
        req.user!.id
      );
      res.status(200).json({
        success: true,
        message: "Inventory batch updated successfully",
        data: { batch },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/pharmacy/categories
   */
  static async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await PharmacyService.getCategories();
      res.status(200).json({
        success: true,
        message: "Categories retrieved successfully",
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  }
}
