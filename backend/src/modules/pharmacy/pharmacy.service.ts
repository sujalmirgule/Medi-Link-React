import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  CatalogFilterParams,
  InventoryBatchCreateInput,
  InventoryBatchUpdateInput,
  InventoryFilterParams,
  PaginatedResult,
  PharmacyDashboardData,
  PharmacyMedicineCreateInput,
  PharmacyMedicineFilterParams,
  PharmacyMedicineUpdateInput,
  PharmacyProfileUpdateInput,
} from "./pharmacy.types";

function notFoundError(entity: string): never {
  const error: any = new Error(`${entity} not found`);
  error.statusCode = 404;
  throw error;
}

function badRequestError(message: string): never {
  const error: any = new Error(message);
  error.statusCode = 400;
  throw error;
}

export class PharmacyService {
  /**
   * 1. Get real-time Pharmacy Dashboard data
   */
  static async getDashboardData(pharmacyId: string): Promise<PharmacyDashboardData> {
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      include: {
        owner: {
          include: {
            verificationRequests: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!pharmacy) {
      notFoundError("Pharmacy");
    }

    const latestVerif = pharmacy.owner.verificationRequests[0];
    const rejectionReason =
      pharmacy.owner.verificationStatus === "REJECTED"
        ? latestVerif?.rejectionReason || "Application details could not be verified"
        : null;

    // Aggregations
    const now = new Date();
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [totalMedicines, activeMedicines, batches] = await Promise.all([
      prisma.pharmacyMedicine.count({ where: { pharmacyId } }),
      prisma.pharmacyMedicine.count({ where: { pharmacyId, isAvailable: true } }),
      prisma.inventoryBatch.findMany({
        where: { pharmacyMedicine: { pharmacyId } },
        include: {
          pharmacyMedicine: {
            include: { medicine: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    let totalInventoryUnits = 0;
    let expiredBatches = 0;
    let expiringSoonBatches = 0;

    // Track stock per medicine to compute out-of-stock
    const medicineStockMap = new Map<string, number>();

    for (const b of batches) {
      const available = Math.max(0, b.quantity - b.reservedQuantity);
      totalInventoryUnits += available;

      const currentMedStock = medicineStockMap.get(b.pharmacyMedicineId) || 0;
      medicineStockMap.set(b.pharmacyMedicineId, currentMedStock + available);

      const exp = new Date(b.expiryDate);
      if (exp < now) {
        expiredBatches++;
      } else if (exp <= in30Days) {
        expiringSoonBatches++;
      }
    }

    // Out of stock = total medicines minus medicines that have available stock > 0
    let outOfStockMedicines = 0;
    const allMedListings = await prisma.pharmacyMedicine.findMany({
      where: { pharmacyId },
      select: { id: true },
    });

    for (const med of allMedListings) {
      const stock = medicineStockMap.get(med.id) || 0;
      if (stock <= 0) {
        outOfStockMedicines++;
      }
    }

    const recentBatches = batches.slice(0, 5).map((b) => ({
      id: b.id,
      batchNumber: b.batchNumber,
      medicineName: b.pharmacyMedicine.medicine.name,
      quantity: b.quantity,
      reservedQuantity: b.reservedQuantity,
      availableQuantity: Math.max(0, b.quantity - b.reservedQuantity),
      expiryDate: b.expiryDate,
      isExpired: new Date(b.expiryDate) < now,
    }));

    return {
      pharmacy: {
        id: pharmacy.id,
        name: pharmacy.name,
        licenseNumber: pharmacy.licenseNumber,
        city: pharmacy.city,
        state: pharmacy.state,
        isVerified: pharmacy.isVerified,
        isActive: pharmacy.isActive,
        verificationStatus: pharmacy.owner.verificationStatus,
        rejectionReason,
      },
      metrics: {
        totalMedicines,
        activeMedicines,
        totalInventoryUnits,
        outOfStockMedicines,
        expiringSoonBatches,
        expiredBatches,
      },
      recentBatches,
    };
  }

  /**
   * 2. Get Pharmacy Profile
   */
  static async getProfile(pharmacyId: string) {
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            phone: true,
            verificationStatus: true,
            createdAt: true,
            profile: true,
          },
        },
      },
    });

    if (!pharmacy) {
      notFoundError("Pharmacy");
    }

    return pharmacy;
  }

  /**
   * 3. Update Pharmacy Profile (editable fields only)
   */
  static async updateProfile(
    pharmacyId: string,
    input: PharmacyProfileUpdateInput,
    userId: string
  ) {
    const existing = await prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
    });

    if (!existing) {
      notFoundError("Pharmacy");
    }

    const updated = await prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: {
        phone: input.phone !== undefined ? input.phone : undefined,
        email: input.email !== undefined ? input.email : undefined,
        address: input.address !== undefined ? input.address : undefined,
        city: input.city !== undefined ? input.city : undefined,
        state: input.state !== undefined ? input.state : undefined,
        pincode: input.pincode !== undefined ? input.pincode : undefined,
        latitude: input.latitude !== undefined ? input.latitude : undefined,
        longitude: input.longitude !== undefined ? input.longitude : undefined,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "PHARMACY_PROFILE_UPDATED",
        entity: "Pharmacy",
        entityId: pharmacyId,
        metadata: JSON.parse(
          JSON.stringify({
            previous: {
              phone: existing.phone,
              email: existing.email,
              address: existing.address,
              city: existing.city,
            },
            updated: input,
          })
        ),
      },
    });

    return updated;
  }

  /**
   * 4. Search Master Medicine Catalog
   */
  static async getCatalogMedicines(params: CatalogFilterParams): Promise<PaginatedResult<any>> {
    const { page, limit, search, categoryId } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.MedicineWhereInput = { isActive: true };

    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { genericName: { contains: q, mode: "insensitive" } },
        { manufacturer: { contains: q, mode: "insensitive" } },
        { composition: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.medicine.count({ where }),
      prisma.medicine.findMany({
        where,
        include: { category: true },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 5. List Pharmacy Medicines
   */
  static async listMedicines(
    pharmacyId: string,
    params: PharmacyMedicineFilterParams
  ): Promise<PaginatedResult<any>> {
    const { page, limit, search, categoryId, isAvailable } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PharmacyMedicineWhereInput = { pharmacyId };

    if (isAvailable !== undefined && isAvailable !== "all") {
      where.isAvailable = isAvailable === "true" || isAvailable === true;
    }

    const medicineWhere: Prisma.MedicineWhereInput = {};

    if (categoryId && categoryId !== "all") {
      medicineWhere.categoryId = categoryId;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      medicineWhere.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { genericName: { contains: q, mode: "insensitive" } },
        { manufacturer: { contains: q, mode: "insensitive" } },
      ];
    }

    if (Object.keys(medicineWhere).length > 0) {
      where.medicine = medicineWhere;
    }

    const [total, rawItems] = await Promise.all([
      prisma.pharmacyMedicine.count({ where }),
      prisma.pharmacyMedicine.findMany({
        where,
        include: {
          medicine: {
            include: { category: true },
          },
          batches: true,
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const items = rawItems.map((item) => {
      let totalStock = 0;
      let reservedStock = 0;
      for (const b of item.batches) {
        totalStock += b.quantity;
        reservedStock += b.reservedQuantity;
      }
      return {
        id: item.id,
        pharmacyId: item.pharmacyId,
        medicineId: item.medicineId,
        sellingPrice: Number(item.sellingPrice),
        isAvailable: item.isAvailable,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        medicine: item.medicine,
        batchCount: item.batches.length,
        totalStock,
        reservedStock,
        availableStock: Math.max(0, totalStock - reservedStock),
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 6. Get Single Pharmacy Medicine Detail
   */
  static async getMedicineById(pharmacyId: string, id: string) {
    const item = await prisma.pharmacyMedicine.findUnique({
      where: { id },
      include: {
        medicine: {
          include: { category: true },
        },
        batches: {
          orderBy: { expiryDate: "asc" },
        },
      },
    });

    if (!item || item.pharmacyId !== pharmacyId) {
      notFoundError("Pharmacy medicine listing");
    }

    let totalStock = 0;
    let reservedStock = 0;
    const now = new Date();

    const formattedBatches = item.batches.map((b) => {
      totalStock += b.quantity;
      reservedStock += b.reservedQuantity;
      return {
        ...b,
        availableQuantity: Math.max(0, b.quantity - b.reservedQuantity),
        isExpired: new Date(b.expiryDate) < now,
      };
    });

    return {
      id: item.id,
      pharmacyId: item.pharmacyId,
      medicineId: item.medicineId,
      sellingPrice: Number(item.sellingPrice),
      isAvailable: item.isAvailable,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      medicine: item.medicine,
      batches: formattedBatches,
      totalStock,
      reservedStock,
      availableStock: Math.max(0, totalStock - reservedStock),
    };
  }

  /**
   * 7. Add Medicine to Pharmacy
   */
  static async createMedicine(
    pharmacyId: string,
    input: PharmacyMedicineCreateInput,
    userId: string
  ) {
    const catalogMed = await prisma.medicine.findUnique({
      where: { id: input.medicineId },
    });

    if (!catalogMed) {
      badRequestError("Medicine does not exist in master catalog");
    }

    const existing = await prisma.pharmacyMedicine.findUnique({
      where: {
        pharmacyId_medicineId: {
          pharmacyId,
          medicineId: input.medicineId,
        },
      },
    });

    if (existing) {
      badRequestError("Medicine is already listed in this pharmacy");
    }

    const created = await prisma.pharmacyMedicine.create({
      data: {
        pharmacyId,
        medicineId: input.medicineId,
        sellingPrice: new Prisma.Decimal(input.sellingPrice),
        isAvailable: input.isAvailable !== undefined ? input.isAvailable : true,
      },
      include: {
        medicine: {
          include: { category: true },
        },
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "PHARMACY_MEDICINE_CREATED",
        entity: "PharmacyMedicine",
        entityId: created.id,
        metadata: {
          pharmacyId,
          medicineId: input.medicineId,
          sellingPrice: input.sellingPrice,
          medicineName: catalogMed.name,
        },
      },
    });

    return {
      ...created,
      sellingPrice: Number(created.sellingPrice),
    };
  }

  /**
   * 8. Update Pharmacy Medicine (Price & Availability)
   */
  static async updateMedicine(
    pharmacyId: string,
    id: string,
    input: PharmacyMedicineUpdateInput,
    userId: string
  ) {
    const existing = await prisma.pharmacyMedicine.findUnique({
      where: { id },
    });

    if (!existing || existing.pharmacyId !== pharmacyId) {
      notFoundError("Pharmacy medicine listing");
    }

    const updated = await prisma.pharmacyMedicine.update({
      where: { id },
      data: {
        sellingPrice:
          input.sellingPrice !== undefined
            ? new Prisma.Decimal(input.sellingPrice)
            : undefined,
        isAvailable: input.isAvailable !== undefined ? input.isAvailable : undefined,
      },
      include: {
        medicine: {
          include: { category: true },
        },
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "PHARMACY_MEDICINE_UPDATED",
        entity: "PharmacyMedicine",
        entityId: id,
        metadata: JSON.parse(
          JSON.stringify({
            previous: {
              sellingPrice: Number(existing.sellingPrice),
              isAvailable: existing.isAvailable,
            },
            updated: input,
          })
        ),
      },
    });

    return {
      ...updated,
      sellingPrice: Number(updated.sellingPrice),
    };
  }

  /**
   * 9. Delete Pharmacy Medicine Listing
   */
  static async deleteMedicine(pharmacyId: string, id: string, userId: string) {
    const existing = await prisma.pharmacyMedicine.findUnique({
      where: { id },
      include: { batches: true },
    });

    if (!existing || existing.pharmacyId !== pharmacyId) {
      notFoundError("Pharmacy medicine listing");
    }

    const totalStock = existing.batches.reduce((sum, b) => sum + b.quantity, 0);
    if (totalStock > 0) {
      badRequestError(
        `Cannot delete medicine listing with ${totalStock} units of active stock. Set as unavailable instead or remove inventory batches.`
      );
    }

    await prisma.pharmacyMedicine.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: "PHARMACY_MEDICINE_DELETED",
        entity: "PharmacyMedicine",
        entityId: id,
        metadata: {
          pharmacyId,
          medicineId: existing.medicineId,
        },
      },
    });

    return { success: true };
  }

  /**
   * 10. List Inventory Batches
   */
  static async listInventoryBatches(
    pharmacyId: string,
    params: InventoryFilterParams
  ): Promise<PaginatedResult<any>> {
    const { page, limit, search, pharmacyMedicineId, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryBatchWhereInput = {
      pharmacyMedicine: { pharmacyId },
    };

    if (pharmacyMedicineId && pharmacyMedicineId !== "all") {
      where.pharmacyMedicineId = pharmacyMedicineId;
    }

    const now = new Date();
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (status === "expired") {
      where.expiryDate = { lt: now };
    } else if (status === "expiring_soon") {
      where.expiryDate = { gte: now, lte: in30Days };
    } else if (status === "active") {
      where.expiryDate = { gte: now };
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { batchNumber: { contains: q, mode: "insensitive" } },
        {
          pharmacyMedicine: {
            medicine: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { genericName: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    const [total, rawItems] = await Promise.all([
      prisma.inventoryBatch.count({ where }),
      prisma.inventoryBatch.findMany({
        where,
        include: {
          pharmacyMedicine: {
            include: {
              medicine: {
                include: { category: true },
              },
            },
          },
        },
        orderBy: { expiryDate: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const items = rawItems.map((b) => {
      const availableQuantity = Math.max(0, b.quantity - b.reservedQuantity);
      const exp = new Date(b.expiryDate);
      return {
        id: b.id,
        pharmacyMedicineId: b.pharmacyMedicineId,
        batchNumber: b.batchNumber,
        manufacturingDate: b.manufacturingDate,
        expiryDate: b.expiryDate,
        quantity: b.quantity,
        reservedQuantity: b.reservedQuantity,
        availableQuantity,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        medicine: b.pharmacyMedicine.medicine,
        sellingPrice: Number(b.pharmacyMedicine.sellingPrice),
        isExpired: exp < now,
        isExpiringSoon: exp >= now && exp <= in30Days,
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 11. Get Single Inventory Batch
   */
  static async getInventoryBatchById(pharmacyId: string, id: string) {
    const batch = await prisma.inventoryBatch.findUnique({
      where: { id },
      include: {
        pharmacyMedicine: {
          include: {
            medicine: {
              include: { category: true },
            },
          },
        },
      },
    });

    if (!batch || batch.pharmacyMedicine.pharmacyId !== pharmacyId) {
      notFoundError("Inventory batch");
    }

    const now = new Date();
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const exp = new Date(batch.expiryDate);

    return {
      id: batch.id,
      pharmacyMedicineId: batch.pharmacyMedicineId,
      batchNumber: batch.batchNumber,
      manufacturingDate: batch.manufacturingDate,
      expiryDate: batch.expiryDate,
      quantity: batch.quantity,
      reservedQuantity: batch.reservedQuantity,
      availableQuantity: Math.max(0, batch.quantity - batch.reservedQuantity),
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
      medicine: batch.pharmacyMedicine.medicine,
      sellingPrice: Number(batch.pharmacyMedicine.sellingPrice),
      isExpired: exp < now,
      isExpiringSoon: exp >= now && exp <= in30Days,
    };
  }

  /**
   * 12. Create Inventory Batch
   */
  static async createInventoryBatch(
    pharmacyId: string,
    input: InventoryBatchCreateInput,
    userId: string
  ) {
    const listing = await prisma.pharmacyMedicine.findUnique({
      where: { id: input.pharmacyMedicineId },
      include: { medicine: true },
    });

    if (!listing || listing.pharmacyId !== pharmacyId) {
      notFoundError("Pharmacy medicine listing");
    }

    const existingBatch = await prisma.inventoryBatch.findUnique({
      where: {
        pharmacyMedicineId_batchNumber: {
          pharmacyMedicineId: input.pharmacyMedicineId,
          batchNumber: input.batchNumber.trim(),
        },
      },
    });

    if (existingBatch) {
      badRequestError(
        `Batch number "${input.batchNumber.trim()}" already exists for this medicine listing`
      );
    }

    const created = await prisma.inventoryBatch.create({
      data: {
        pharmacyMedicineId: input.pharmacyMedicineId,
        batchNumber: input.batchNumber.trim(),
        manufacturingDate: input.manufacturingDate ? new Date(input.manufacturingDate) : null,
        expiryDate: new Date(input.expiryDate),
        quantity: input.quantity,
        reservedQuantity: 0,
      },
      include: {
        pharmacyMedicine: {
          include: { medicine: true },
        },
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "INVENTORY_BATCH_CREATED",
        entity: "InventoryBatch",
        entityId: created.id,
        metadata: {
          pharmacyId,
          batchNumber: created.batchNumber,
          quantity: created.quantity,
          medicineName: listing.medicine.name,
          expiryDate: created.expiryDate,
        },
      },
    });

    return {
      ...created,
      availableQuantity: created.quantity,
    };
  }

  /**
   * 13. Update Inventory Batch (Stock adjustment & details)
   */
  static async updateInventoryBatch(
    pharmacyId: string,
    id: string,
    input: InventoryBatchUpdateInput,
    userId: string
  ) {
    const batch = await prisma.inventoryBatch.findUnique({
      where: { id },
      include: {
        pharmacyMedicine: {
          include: { medicine: true },
        },
      },
    });

    if (!batch || batch.pharmacyMedicine.pharmacyId !== pharmacyId) {
      notFoundError("Inventory batch");
    }

    if (input.quantity !== undefined && input.quantity < batch.reservedQuantity) {
      badRequestError(
        `Cannot reduce stock to ${input.quantity}. Currently ${batch.reservedQuantity} units are reserved for pending orders.`
      );
    }

    const updated = await prisma.inventoryBatch.update({
      where: { id },
      data: {
        batchNumber: input.batchNumber?.trim() || undefined,
        manufacturingDate:
          input.manufacturingDate !== undefined
            ? input.manufacturingDate
              ? new Date(input.manufacturingDate)
              : null
            : undefined,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
        quantity: input.quantity !== undefined ? input.quantity : undefined,
      },
      include: {
        pharmacyMedicine: {
          include: { medicine: true },
        },
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "INVENTORY_BATCH_UPDATED",
        entity: "InventoryBatch",
        entityId: id,
        metadata: JSON.parse(
          JSON.stringify({
            previous: {
              quantity: batch.quantity,
              batchNumber: batch.batchNumber,
              expiryDate: batch.expiryDate,
            },
            updated: input,
          })
        ),
      },
    });

    return {
      ...updated,
      availableQuantity: Math.max(0, updated.quantity - updated.reservedQuantity),
    };
  }

  /**
   * 14. Get Active Medicine Categories
   */
  static async getCategories() {
    return prisma.medicineCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }
}
