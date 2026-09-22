import { VerificationStatus } from "@prisma/client";

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PharmacyDashboardMetrics {
  totalMedicines: number;
  activeMedicines: number;
  totalInventoryUnits: number;
  outOfStockMedicines: number;
  expiringSoonBatches: number;
  expiredBatches: number;
}

export interface PharmacyDashboardData {
  pharmacy: {
    id: string;
    name: string;
    licenseNumber: string;
    city: string;
    state: string;
    isVerified: boolean;
    isActive: boolean;
    verificationStatus: VerificationStatus;
    rejectionReason: string | null;
  };
  metrics: PharmacyDashboardMetrics;
  recentBatches: any[];
}

export interface PharmacyProfileUpdateInput {
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PharmacyMedicineCreateInput {
  medicineId: string;
  sellingPrice: number;
  isAvailable?: boolean;
}

export interface PharmacyMedicineUpdateInput {
  sellingPrice?: number;
  isAvailable?: boolean;
}

export interface InventoryBatchCreateInput {
  pharmacyMedicineId: string;
  batchNumber: string;
  manufacturingDate?: string | Date | null;
  expiryDate: string | Date;
  quantity: number;
}

export interface InventoryBatchUpdateInput {
  batchNumber?: string;
  manufacturingDate?: string | Date | null;
  expiryDate?: string | Date;
  quantity?: number;
}

export interface PharmacyMedicineFilterParams extends PaginationParams {
  search?: string;
  categoryId?: string;
  isAvailable?: boolean | "all" | string;
}

export interface InventoryFilterParams extends PaginationParams {
  search?: string;
  pharmacyMedicineId?: string;
  status?: "all" | "active" | "expiring_soon" | "expired";
}

export interface CatalogFilterParams extends PaginationParams {
  search?: string;
  categoryId?: string;
}
