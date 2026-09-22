import { UserRole, VerificationStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export class VerificationService {
  /**
   * List verification applications with optional status and role filtering.
   */
  static async listVerifications(query?: { status?: string; role?: string }) {
    const where: any = {};

    if (query?.status && query.status !== "all") {
      where.status = query.status as VerificationStatus;
    }

    if (query?.role && query.role !== "all") {
      where.role = query.role as UserRole;
    }

    const applications = await prisma.verificationRequest.findMany({
      where,
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
    });

    return applications;
  }

  /**
   * Get single verification request detail by ID.
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
      const error: any = new Error("Verification request not found");
      error.statusCode = 404;
      throw error;
    }

    return application;
  }

  /**
   * Approve a verification request and enable verified business privileges.
   */
  static async approveVerification(id: string, adminUserId: string) {
    const application = await prisma.verificationRequest.findUnique({
      where: { id },
    });

    if (!application) {
      const error: any = new Error("Verification request not found");
      error.statusCode = 404;
      throw error;
    }

    const actionName =
      application.role === UserRole.PHARMACY
        ? "PHARMACY_VERIFICATION_APPROVED"
        : "DELIVERY_PARTNER_VERIFICATION_APPROVED";

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update verification request
      const req = await tx.verificationRequest.update({
        where: { id },
        data: {
          status: VerificationStatus.VERIFIED,
          reviewedById: adminUserId,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });

      // 2. Update user verification status
      await tx.user.update({
        where: { id: application.userId },
        data: {
          verificationStatus: VerificationStatus.VERIFIED,
        },
      });

      // 3. Update role entity
      if (application.role === UserRole.PHARMACY) {
        await tx.pharmacy.updateMany({
          where: { ownerUserId: application.userId },
          data: { isVerified: true, isActive: true },
        });
      } else if (application.role === UserRole.DELIVERY_PARTNER) {
        await tx.deliveryPartner.updateMany({
          where: { userId: application.userId },
          data: { isVerified: true, isActive: true },
        });
      }

      // 4. Record AuditLog
      await tx.auditLog.create({
        data: {
          action: actionName,
          entity: "VerificationRequest",
          entityId: id,
          userId: adminUserId,
          metadata: {
            applicantUserId: application.userId,
            role: application.role,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return req;
    });

    return updated;
  }

  /**
   * Reject a verification request with a mandatory reason.
   * Note: The user account remains login-capable (isActive = true) to see the rejection reason.
   */
  static async rejectVerification(id: string, adminUserId: string, reason: string) {
    if (!reason || reason.trim().length < 5) {
      const error: any = new Error(
        "A clear rejection reason of at least 5 characters is required"
      );
      error.statusCode = 400;
      throw error;
    }

    const application = await prisma.verificationRequest.findUnique({
      where: { id },
    });

    if (!application) {
      const error: any = new Error("Verification request not found");
      error.statusCode = 404;
      throw error;
    }

    const actionName =
      application.role === UserRole.PHARMACY
        ? "PHARMACY_VERIFICATION_REJECTED"
        : "DELIVERY_PARTNER_VERIFICATION_REJECTED";

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update verification request with rejection reason
      const req = await tx.verificationRequest.update({
        where: { id },
        data: {
          status: VerificationStatus.REJECTED,
          rejectionReason: reason.trim(),
          reviewedById: adminUserId,
          reviewedAt: new Date(),
        },
      });

      // 2. Update user verification status to REJECTED (user remains active for login)
      await tx.user.update({
        where: { id: application.userId },
        data: {
          verificationStatus: VerificationStatus.REJECTED,
        },
      });

      // 3. Mark role entity as unverified
      if (application.role === UserRole.PHARMACY) {
        await tx.pharmacy.updateMany({
          where: { ownerUserId: application.userId },
          data: { isVerified: false },
        });
      } else if (application.role === UserRole.DELIVERY_PARTNER) {
        await tx.deliveryPartner.updateMany({
          where: { userId: application.userId },
          data: { isVerified: false, isAvailable: false },
        });
      }

      // 4. Record AuditLog
      await tx.auditLog.create({
        data: {
          action: actionName,
          entity: "VerificationRequest",
          entityId: id,
          userId: adminUserId,
          metadata: {
            applicantUserId: application.userId,
            role: application.role,
            reason: reason.trim(),
            timestamp: new Date().toISOString(),
          },
        },
      });

      return req;
    });

    return updated;
  }
}
