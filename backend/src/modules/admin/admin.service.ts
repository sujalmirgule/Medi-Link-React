import { Prisma, UserRole, VerificationStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  AuditLogFilterParams,
  DashboardStats,
  DeliveryPartnerFilterParams,
  PaginatedResult,
  PharmacyFilterParams,
  TriStateBoolean,
  UserFilterParams,
  VerificationFilterParams,
} from "./admin.types";

function parseBooleanParam(val: TriStateBoolean | undefined): boolean | undefined {
  if (val === undefined || val === "all") return undefined;
  if (val === true || val === "true") return true;
  if (val === false || val === "false") return false;
  return undefined;
}

export class AdminService {
  /**
   * 1. Dashboard Overview Statistics
   * Calculates real-time platform metrics dynamically from PostgreSQL.
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalUsers,
      activeUsers,
      totalCustomers,
      totalPharmacies,
      verifiedPharmacies,
      pendingPharmacies,
      rejectedPharmacies,
      totalDeliveryPartners,
      verifiedDeliveryPartners,
      pendingDeliveryPartners,
      rejectedDeliveryPartners,
      pendingVerificationsTotal,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
      prisma.pharmacy.count(),
      prisma.pharmacy.count({ where: { isVerified: true } }),
      prisma.verificationRequest.count({
        where: { role: UserRole.PHARMACY, status: VerificationStatus.PENDING },
      }),
      prisma.verificationRequest.count({
        where: { role: UserRole.PHARMACY, status: VerificationStatus.REJECTED },
      }),
      prisma.deliveryPartner.count(),
      prisma.deliveryPartner.count({ where: { isVerified: true } }),
      prisma.verificationRequest.count({
        where: { role: UserRole.DELIVERY_PARTNER, status: VerificationStatus.PENDING },
      }),
      prisma.verificationRequest.count({
        where: { role: UserRole.DELIVERY_PARTNER, status: VerificationStatus.REJECTED },
      }),
      prisma.verificationRequest.count({
        where: { status: VerificationStatus.PENDING },
      }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { email: true },
          },
        },
      }),
    ]);

    const formattedActivity = recentAuditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      actorEmail: log.user?.email || "System",
      timestamp: log.createdAt,
      metadata: log.metadata,
    }));

    return {
      metrics: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalCustomers,
        totalPharmacies,
        pendingPharmacies,
        verifiedPharmacies,
        rejectedPharmacies,
        totalDeliveryPartners,
        pendingDeliveryPartners,
        verifiedDeliveryPartners,
        rejectedDeliveryPartners,
        pendingVerificationsTotal,
      },
      recentActivity: formattedActivity,
    };
  }

  /**
   * 2. Verification Management (Paginated, Filtered & Searchable)
   */
  static async listVerifications(
    params: VerificationFilterParams
  ): Promise<PaginatedResult<any>> {
    const { page, limit, role, status, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.VerificationRequestWhereInput = {};

    if (role && role !== "all") {
      where.role = role as UserRole;
    }

    if (status && status !== "all") {
      where.status = status as VerificationStatus;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { user: { email: { contains: q, mode: "insensitive" } } },
        { user: { phone: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.verificationRequest.count({ where }),
      prisma.verificationRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: true,
              createdAt: true,
              ownedPharmacies: {
                select: {
                  id: true,
                  name: true,
                  licenseNumber: true,
                  city: true,
                  state: true,
                  isVerified: true,
                },
              },
              deliveryPartner: {
                select: {
                  id: true,
                  phone: true,
                  isVerified: true,
                },
              },
            },
          },
          reviewedBy: {
            select: {
              id: true,
              email: true,
            },
          },
        },
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
   * 3. Verification Detail View
   */
  static async getVerificationById(id: string) {
    const application = await prisma.verificationRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            verificationStatus: true,
            createdAt: true,
            ownedPharmacies: true,
            deliveryPartner: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!application) {
      const error: any = new Error("Verification application not found");
      error.statusCode = 404;
      throw error;
    }

    return application;
  }

  /**
   * 4. User Management (Paginated, Filtered, Zero passwordHash leak)
   */
  static async listUsers(params: UserFilterParams): Promise<PaginatedResult<any>> {
    const { page, limit, role, verificationStatus, isActive, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (role && role !== "all") {
      where.role = role as UserRole;
    }

    if (verificationStatus && verificationStatus !== "all") {
      where.verificationStatus = verificationStatus as VerificationStatus;
    }

    const parsedActive = parseBooleanParam(isActive);
    if (parsedActive !== undefined) {
      where.isActive = parsedActive;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { profile: { firstName: { contains: q, mode: "insensitive" } } },
        { profile: { lastName: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          verificationStatus: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          ownedPharmacies: {
            select: {
              id: true,
              name: true,
              licenseNumber: true,
              isVerified: true,
            },
          },
          deliveryPartner: {
            select: {
              id: true,
              isVerified: true,
              isAvailable: true,
            },
          },
        },
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
   * 5. User Deep Inspection
   */
  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        addresses: true,
        ownedPharmacies: true,
        deliveryPartner: true,
        verificationRequests: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!user) {
      const error: any = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  /**
   * 6. Account Activation / Deactivation (With Self-Deactivation Guard & AuditLog)
   */
  static async updateUserStatus(
    targetUserId: string,
    isActive: boolean,
    adminUserId: string
  ) {
    // Self-deactivation protection (Section 18)
    if (targetUserId === adminUserId && !isActive) {
      const error: any = new Error(
        "Self-deactivation is prohibited to prevent accidental administrator lockout"
      );
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!existingUser) {
      const error: any = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const actionName = isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED";

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetUserId },
        data: { isActive },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          verificationStatus: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: actionName,
          entity: "User",
          entityId: targetUserId,
          userId: adminUserId,
          metadata: {
            targetEmail: existingUser.email,
            targetRole: existingUser.role,
            isActive,
            performedBy: adminUserId,
          },
        },
      });

      return user;
    });

    return updatedUser;
  }

  /**
   * 7. Pharmacy Management Directory
   */
  static async listPharmacies(
    params: PharmacyFilterParams
  ): Promise<PaginatedResult<any>> {
    const { page, limit, isVerified, isActive, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PharmacyWhereInput = {};

    const parsedVerified = parseBooleanParam(isVerified);
    if (parsedVerified !== undefined) {
      where.isVerified = parsedVerified;
    }

    const parsedActive = parseBooleanParam(isActive);
    if (parsedActive !== undefined) {
      where.isActive = parsedActive;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { licenseNumber: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.pharmacy.count({ where }),
      prisma.pharmacy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              phone: true,
              isActive: true,
              verificationStatus: true,
            },
          },
        },
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
   * 8. Pharmacy Deep Inspection
   */
  static async getPharmacyById(id: string) {
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            phone: true,
            isActive: true,
            verificationStatus: true,
            createdAt: true,
          },
        },
        staff: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!pharmacy) {
      const error: any = new Error("Pharmacy not found");
      error.statusCode = 404;
      throw error;
    }

    return pharmacy;
  }

  /**
   * 9. Delivery Partner Management Directory
   */
  static async listDeliveryPartners(
    params: DeliveryPartnerFilterParams
  ): Promise<PaginatedResult<any>> {
    const { page, limit, isVerified, isActive, isAvailable, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.DeliveryPartnerWhereInput = {};

    const parsedVerified = parseBooleanParam(isVerified);
    if (parsedVerified !== undefined) {
      where.isVerified = parsedVerified;
    }

    const parsedActive = parseBooleanParam(isActive);
    if (parsedActive !== undefined) {
      where.isActive = parsedActive;
    }

    const parsedAvailable = parseBooleanParam(isAvailable);
    if (parsedAvailable !== undefined) {
      where.isAvailable = parsedAvailable;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { phone: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.deliveryPartner.count({ where }),
      prisma.deliveryPartner.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              isActive: true,
              verificationStatus: true,
              createdAt: true,
            },
          },
        },
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
   * 10. Delivery Partner Deep Inspection
   */
  static async getDeliveryPartnerById(id: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            isActive: true,
            verificationStatus: true,
            createdAt: true,
            addresses: true,
          },
        },
      },
    });

    if (!partner) {
      const error: any = new Error("Delivery partner not found");
      error.statusCode = 404;
      throw error;
    }

    return partner;
  }

  /**
   * 11. Audit Log Viewer (Read-only, Searchable, Filterable)
   */
  static async listAuditLogs(
    params: AuditLogFilterParams
  ): Promise<PaginatedResult<any>> {
    const { page, limit, action, entity, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (action && action.trim().length > 0) {
      where.action = { contains: action.trim(), mode: "insensitive" };
    }

    if (entity && entity.trim().length > 0) {
      where.entity = { equals: entity.trim() };
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { action: { contains: q, mode: "insensitive" } },
        { entity: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
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
   * 12. Admin Profile
   */
  static async getAdminProfile(adminUserId: string) {
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      const error: any = new Error("Admin user not found");
      error.statusCode = 404;
      throw error;
    }

    return admin;
  }
}
