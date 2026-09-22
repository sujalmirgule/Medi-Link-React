import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  CustomerAddressInput,
  MedicineSearchParams,
  PharmacySearchParams,
} from "./marketplace.types";

export class MarketplaceService {
  /**
   * 1. Search and browse master medicines with verified pharmacy counts and live pricing.
   */
  static async searchMedicines(params: MedicineSearchParams) {
    const { page, limit, search, category, availability, sortBy } = params;
    const now = new Date();

    const where: Prisma.MedicineWhereInput = {
      isActive: true,
    };

    if (category && category !== "all" && category !== "All") {
      where.OR = [
        { categoryId: category },
        { category: { name: { equals: category, mode: "insensitive" } } },
      ];
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { genericName: { contains: q, mode: "insensitive" } },
            { composition: { contains: q, mode: "insensitive" } },
            { manufacturer: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
      ];
    }

    const medicines = await prisma.medicine.findMany({
      where,
      include: {
        category: true,
        pharmacyMedicines: {
          where: {
            isAvailable: true,
            pharmacy: {
              isVerified: true,
              isActive: true,
            },
          },
          include: {
            pharmacy: true,
            batches: {
              where: {
                expiryDate: { gt: now },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Compute marketplace metrics per medicine
    let enriched = medicines.map((m) => {
      let verifiedPharmaciesCount = 0;
      let totalAvailableStock = 0;
      let minPrice: number | null = null;
      let maxPrice: number | null = null;

      for (const pm of m.pharmacyMedicines) {
        const availableInPm = pm.batches.reduce(
          (sum, b) => sum + Math.max(0, b.quantity - b.reservedQuantity),
          0
        );

        if (availableInPm > 0) {
          verifiedPharmaciesCount++;
          totalAvailableStock += availableInPm;
          const priceNum = Number(pm.sellingPrice);

          if (minPrice === null || priceNum < minPrice) {
            minPrice = priceNum;
          }
          if (maxPrice === null || priceNum > maxPrice) {
            maxPrice = priceNum;
          }
        }
      }

      let availabilityStatus = "Out of Stock";
      if (totalAvailableStock >= 10) {
        availabilityStatus = "Available";
      } else if (totalAvailableStock > 0) {
        availabilityStatus = "Limited";
      }

      return {
        id: m.id,
        name: m.name,
        genericName: m.genericName,
        composition: m.composition,
        manufacturer: m.manufacturer,
        description: m.description,
        prescriptionRequired: m.prescriptionRequired,
        category: {
          id: m.category.id,
          name: m.category.name,
        },
        verifiedPharmaciesCount,
        totalAvailableStock,
        minPrice,
        maxPrice,
        priceDisplay: minPrice !== null ? `₹${minPrice.toFixed(2)}` : "Unavailable",
        availability: availabilityStatus,
      };
    });

    // Apply availability filter if specified
    if (availability && availability !== "All" && availability !== "all") {
      enriched = enriched.filter(
        (m) => m.availability.toLowerCase() === availability.toLowerCase()
      );
    }

    // Apply sorting
    if (sortBy === "Price Low to High") {
      enriched.sort((a, b) => {
        if (a.minPrice === null) return 1;
        if (b.minPrice === null) return -1;
        return a.minPrice - b.minPrice;
      });
    } else if (sortBy === "Price High to Low") {
      enriched.sort((a, b) => {
        if (a.minPrice === null) return 1;
        if (b.minPrice === null) return -1;
        return b.minPrice - a.minPrice;
      });
    }

    const total = enriched.length;
    const skip = (page - 1) * limit;
    const paginatedItems = enriched.slice(skip, skip + limit);

    return {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 2. Get single medicine details
   */
  static async getMedicineById(id: string) {
    const now = new Date();
    const medicine = await prisma.medicine.findUnique({
      where: { id },
      include: {
        category: true,
        pharmacyMedicines: {
          where: {
            isAvailable: true,
            pharmacy: {
              isVerified: true,
              isActive: true,
            },
          },
          include: {
            batches: {
              where: {
                expiryDate: { gt: now },
              },
            },
          },
        },
      },
    });

    if (!medicine || !medicine.isActive) {
      const err = new Error("Medicine not found") as any;
      err.status = 404;
      err.statusCode = 404;
      throw err;
    }

    let verifiedPharmaciesCount = 0;
    let minPrice: number | null = null;
    let totalAvailableStock = 0;

    for (const pm of medicine.pharmacyMedicines) {
      const available = pm.batches.reduce(
        (sum, b) => sum + Math.max(0, b.quantity - b.reservedQuantity),
        0
      );
      if (available > 0) {
        verifiedPharmaciesCount++;
        totalAvailableStock += available;
        const p = Number(pm.sellingPrice);
        if (minPrice === null || p < minPrice) {
          minPrice = p;
        }
      }
    }

    return {
      id: medicine.id,
      name: medicine.name,
      genericName: medicine.genericName,
      composition: medicine.composition,
      manufacturer: medicine.manufacturer,
      description: medicine.description,
      prescriptionRequired: medicine.prescriptionRequired,
      category: {
        id: medicine.category.id,
        name: medicine.category.name,
      },
      verifiedPharmaciesCount,
      totalAvailableStock,
      minPrice,
      priceDisplay: minPrice !== null ? `₹${minPrice.toFixed(2)}` : "Unavailable",
      availability: totalAvailableStock >= 10 ? "Available" : totalAvailableStock > 0 ? "Limited" : "Out of Stock",
    };
  }

  /**
   * 3. Get verified pharmacies offering a medicine with real available stock and prices.
   */
  static async getMedicinePharmacies(medicineId: string) {
    const now = new Date();

    const listings = await prisma.pharmacyMedicine.findMany({
      where: {
        medicineId,
        isAvailable: true,
        pharmacy: {
          isVerified: true,
          isActive: true,
        },
      },
      include: {
        pharmacy: true,
        batches: {
          where: {
            expiryDate: { gt: now },
          },
        },
      },
      orderBy: {
        sellingPrice: "asc",
      },
    });

    // Filter to pharmacies with available non-expired stock
    const availablePharmacies = [];

    for (const item of listings) {
      const availableStock = item.batches.reduce(
        (sum, b) => sum + Math.max(0, b.quantity - b.reservedQuantity),
        0
      );

      if (availableStock > 0) {
        availablePharmacies.push({
          pharmacyMedicineId: item.id,
          price: Number(item.sellingPrice),
          availableStock,
          pharmacy: {
            id: item.pharmacy.id,
            name: item.pharmacy.name,
            address: item.pharmacy.address,
            city: item.pharmacy.city,
            state: item.pharmacy.state,
            pincode: item.pharmacy.pincode,
            phone: item.pharmacy.phone,
            isVerified: item.pharmacy.isVerified,
          },
          fulfillmentOptions: ["PICKUP", "HOME_DELIVERY"],
          status: "Open",
        });
      }
    }

    return availablePharmacies;
  }

  /**
   * 4. Discover verified active pharmacies for directory search
   */
  static async searchPharmacies(params: PharmacySearchParams) {
    const { page, limit, search, city } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PharmacyWhereInput = {
      isVerified: true,
      isActive: true,
    };

    if (city && city.trim().length > 0) {
      where.city = { contains: city.trim(), mode: "insensitive" };
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { pincode: { contains: q } },
      ];
    }

    const [total, pharmacies] = await Promise.all([
      prisma.pharmacy.count({ where }),
      prisma.pharmacy.findMany({
        where,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
          pincode: true,
          phone: true,
          isVerified: true,
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: pharmacies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 5. Customer Addresses
   */
  static async getCustomerAddresses(userId: string) {
    return await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  static async createCustomerAddress(userId: string, input: CustomerAddressInput) {
    return await prisma.$transaction(async (tx) => {
      // If marking as default, unset other defaults
      if (input.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // If user has no existing addresses, make this first one default automatically
      const existingCount = await tx.address.count({ where: { userId } });
      const isDefault = input.isDefault || existingCount === 0;

      return await tx.address.create({
        data: {
          userId,
          label: input.label || "Home",
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 || null,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          isDefault,
        },
      });
    });
  }
}
