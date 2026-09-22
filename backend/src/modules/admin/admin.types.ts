import { UserRole, VerificationStatus } from "@prisma/client";

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

export interface DashboardStats {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    totalCustomers: number;
    totalPharmacies: number;
    pendingPharmacies: number;
    verifiedPharmacies: number;
    rejectedPharmacies: number;
    totalDeliveryPartners: number;
    pendingDeliveryPartners: number;
    verifiedDeliveryPartners: number;
    rejectedDeliveryPartners: number;
    pendingVerificationsTotal: number;
  };
  recentActivity: {
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    actorEmail: string | null;
    timestamp: Date;
    metadata: any;
  }[];
}

export type TriStateBoolean = "true" | "false" | "all" | boolean;

export interface VerificationFilterParams extends PaginationParams {
  role?: UserRole | "all";
  status?: VerificationStatus | "all";
  search?: string;
}

export interface UserFilterParams extends PaginationParams {
  role?: UserRole | "all";
  verificationStatus?: VerificationStatus | "all";
  isActive?: TriStateBoolean;
  search?: string;
}

export interface PharmacyFilterParams extends PaginationParams {
  isVerified?: TriStateBoolean;
  isActive?: TriStateBoolean;
  search?: string;
}

export interface DeliveryPartnerFilterParams extends PaginationParams {
  isVerified?: TriStateBoolean;
  isActive?: TriStateBoolean;
  isAvailable?: TriStateBoolean;
  search?: string;
}

export interface AuditLogFilterParams extends PaginationParams {
  action?: string;
  entity?: string;
  search?: string;
}
