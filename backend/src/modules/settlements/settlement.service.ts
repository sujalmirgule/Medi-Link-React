import { PrismaClient, Prisma, SettlementStatus, NotificationType } from "@prisma/client";
import { SettlementFilterParams, SettlementFormatted } from "./settlement.types";
import { NotificationService } from "../notifications/notification.service";

const prisma = new PrismaClient();

function badRequestError(msg: string): never {
  const err: any = new Error(msg);
  err.status = 400;
  throw err;
}

function notFoundError(msg: string): never {
  const err: any = new Error(msg);
  err.status = 404;
  throw err;
}

function forbiddenError(msg: string): never {
  const err: any = new Error(msg);
  err.status = 403;
  throw err;
}

function formatSettlement(s: any): SettlementFormatted {
  return {
    id: s.id,
    orderId: s.orderId,
    pharmacyId: s.pharmacyId,
    paymentId: s.paymentId,
    amount: Number(s.amount),
    status: s.status,
    failureReason: s.failureReason,
    settledAt: s.settledAt,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    order: s.order
      ? {
          id: s.order.id,
          orderNumber: s.order.orderNumber,
          totalAmount: Number(s.order.totalAmount),
          orderStatus: s.order.orderStatus,
          fulfillmentType: s.order.fulfillmentType,
          createdAt: s.order.createdAt,
        }
      : undefined,
    pharmacy: s.pharmacy
      ? {
          id: s.pharmacy.id,
          name: s.pharmacy.name,
          city: s.pharmacy.city,
          phone: s.pharmacy.phone,
        }
      : undefined,
    payment: s.payment
      ? {
          id: s.payment.id,
          method: s.payment.method,
          status: s.payment.status,
          transactionReference: s.payment.transactionReference,
          paidAt: s.payment.paidAt,
        }
      : null,
  };
}

export class SettlementService {
  /**
   * Automatically create or update a settlement record inside a transaction when a payment is marked PAID.
   */
  static async createOrUpdateSettlementForOrder(
    tx: Prisma.TransactionClient,
    params: {
      orderId: string;
      pharmacyId: string;
      paymentId: string;
      amount: Prisma.Decimal | number;
      autoSettle?: boolean;
    }
  ): Promise<SettlementFormatted> {
    const { orderId, pharmacyId, paymentId, amount, autoSettle = true } = params;

    // Check if settlement already exists for this order
    const existing = await tx.settlement.findUnique({
      where: { orderId },
      include: { order: true, pharmacy: true, payment: true },
    });

    const settlementAmount = new Prisma.Decimal(amount);
    const now = new Date();

    if (existing) {
      if (existing.status === SettlementStatus.SETTLED) {
        return formatSettlement(existing);
      }

      const updated = await tx.settlement.update({
        where: { id: existing.id },
        data: {
          paymentId,
          amount: settlementAmount,
          status: autoSettle ? SettlementStatus.SETTLED : SettlementStatus.PENDING,
          settledAt: autoSettle ? now : null,
          failureReason: null,
        },
        include: { order: true, pharmacy: true, payment: true },
      });

      return formatSettlement(updated);
    }

    const created = await tx.settlement.create({
      data: {
        orderId,
        pharmacyId,
        paymentId,
        amount: settlementAmount,
        status: autoSettle ? SettlementStatus.SETTLED : SettlementStatus.PENDING,
        settledAt: autoSettle ? now : null,
      },
      include: { order: true, pharmacy: true, payment: true },
    });

    return formatSettlement(created);
  }

  /**
   * Pharmacy: List settlements belonging to the authenticated pharmacy.
   */
  static async listPharmacySettlements(
    pharmacyId: string,
    params: SettlementFilterParams
  ) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.SettlementWhereInput = {
      pharmacyId,
    };

    if (params.status && params.status !== "all") {
      where.status = params.status as SettlementStatus;
    }

    const [total, items] = await Promise.all([
      prisma.settlement.count({ where }),
      prisma.settlement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: true,
          payment: true,
        },
      }),
    ]);

    // Aggregate summary metrics for pharmacy dashboard
    const [settledAgg, pendingAgg] = await Promise.all([
      prisma.settlement.aggregate({
        where: { pharmacyId, status: SettlementStatus.SETTLED },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.settlement.aggregate({
        where: { pharmacyId, status: SettlementStatus.PENDING },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    return {
      items: items.map(formatSettlement),
      metrics: {
        totalSettledAmount: Number(settledAgg._sum.amount || 0),
        totalSettledCount: settledAgg._count.id || 0,
        pendingSettlementAmount: Number(pendingAgg._sum.amount || 0),
        pendingSettlementCount: pendingAgg._count.id || 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Pharmacy: Get single settlement details (with tenant ownership check).
   */
  static async getPharmacySettlementById(
    pharmacyId: string,
    settlementId: string
  ): Promise<SettlementFormatted> {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        order: true,
        pharmacy: true,
        payment: true,
      },
    });

    if (!settlement) {
      notFoundError("Settlement record not found.");
    }

    if (settlement.pharmacyId !== pharmacyId) {
      forbiddenError("Access denied. You can only view settlements for your own pharmacy.");
    }

    return formatSettlement(settlement);
  }

  /**
   * Admin: List all settlements across all pharmacies.
   */
  static async listSettlementsAdmin(params: SettlementFilterParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.SettlementWhereInput = {};

    if (params.pharmacyId) {
      where.pharmacyId = params.pharmacyId;
    }

    if (params.status && params.status !== "all") {
      where.status = params.status as SettlementStatus;
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { order: { orderNumber: { contains: q, mode: "insensitive" } } },
        { pharmacy: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.settlement.count({ where }),
      prisma.settlement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: true,
          pharmacy: true,
          payment: true,
        },
      }),
    ]);

    const [settledSum, pendingSum] = await Promise.all([
      prisma.settlement.aggregate({
        where: { status: SettlementStatus.SETTLED },
        _sum: { amount: true },
      }),
      prisma.settlement.aggregate({
        where: { status: SettlementStatus.PENDING },
        _sum: { amount: true },
      }),
    ]);

    return {
      items: items.map(formatSettlement),
      metrics: {
        totalSettledAmount: Number(settledSum._sum.amount || 0),
        pendingSettlementAmount: Number(pendingSum._sum.amount || 0),
        totalCount: total,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Admin: Get single settlement details.
   */
  static async getSettlementDetailAdmin(settlementId: string): Promise<SettlementFormatted> {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        order: true,
        pharmacy: true,
        payment: true,
      },
    });

    if (!settlement) {
      notFoundError("Settlement record not found.");
    }

    return formatSettlement(settlement);
  }

  /**
   * Admin: Manually mark a pending settlement as settled.
   */
  static async settleAdmin(adminUserId: string, settlementId: string): Promise<SettlementFormatted> {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { order: true, pharmacy: true, payment: true },
    });

    if (!settlement) {
      notFoundError("Settlement record not found.");
    }

    if (settlement.status === SettlementStatus.SETTLED) {
      badRequestError("Settlement is already marked as SETTLED.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.settlement.update({
        where: { id: settlementId },
        data: {
          status: SettlementStatus.SETTLED,
          settledAt: new Date(),
          failureReason: null,
        },
        include: { order: true, pharmacy: true, payment: true },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: "SETTLEMENT_SETTLED_ADMIN",
          entity: "Settlement",
          entityId: settlementId,
          metadata: {
            pharmacyId: settlement.pharmacyId,
            orderId: settlement.orderId,
            amount: Number(settlement.amount),
          },
        },
      });

      return res;
    });

    return formatSettlement(updated);
  }

  // Notify pharmacy owner that settlement was processed
  // (after return to avoid blocking the response)
  // We fire async without awaiting the outer call
  static async _notifySettleAdmin(settlementId: string, pharmacyId: string, orderId: string, amount: number, orderNumber?: string): Promise<void> {
    const pharmacy = await new PrismaClient().pharmacy.findUnique({ where: { id: pharmacyId } });
    if (pharmacy?.ownerUserId) {
      await NotificationService.create({
        userId: pharmacy.ownerUserId,
        type: NotificationType.ORDER_UPDATE,
        title: "Settlement Processed",
        message: `Your settlement of ₹${amount.toFixed(2)} for order #${orderNumber || orderId} has been processed and transferred to your account.`,
        reference: `settlements/${settlementId}`,
      });
    }
  }

  /**
   * Admin: Mark a settlement as failed with failure reason.
   */
  static async failSettlementAdmin(
    adminUserId: string,
    settlementId: string,
    reason: string
  ): Promise<SettlementFormatted> {
    if (!reason || reason.trim().length < 5) {
      badRequestError("Please provide a descriptive failure reason (at least 5 characters).");
    }

    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { order: true, pharmacy: true, payment: true },
    });

    if (!settlement) {
      notFoundError("Settlement record not found.");
    }

    if (settlement.status === SettlementStatus.SETTLED) {
      badRequestError("Cannot mark an already SETTLED payout as FAILED.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.settlement.update({
        where: { id: settlementId },
        data: {
          status: SettlementStatus.FAILED,
          failureReason: reason.trim(),
        },
        include: { order: true, pharmacy: true, payment: true },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: "SETTLEMENT_FAILED_ADMIN",
          entity: "Settlement",
          entityId: settlementId,
          metadata: {
            pharmacyId: settlement.pharmacyId,
            orderId: settlement.orderId,
            reason: reason.trim(),
          },
        },
      });

      return res;
    });

    return formatSettlement(updated);
  }

  static async _notifyFailSettlementAdmin(settlementId: string, pharmacyId: string, orderId: string, amount: number, reason: string, orderNumber?: string): Promise<void> {
    const pharmacy = await new PrismaClient().pharmacy.findUnique({ where: { id: pharmacyId } });
    if (pharmacy?.ownerUserId) {
      await NotificationService.create({
        userId: pharmacy.ownerUserId,
        type: NotificationType.SYSTEM,
        title: "Settlement Failed",
        message: `Your settlement of ₹${amount.toFixed(2)} for order #${orderNumber || orderId} could not be processed. Reason: ${reason}. Please contact support.`,
        reference: `settlements/${settlementId}`,
      });
    }
  }
}
