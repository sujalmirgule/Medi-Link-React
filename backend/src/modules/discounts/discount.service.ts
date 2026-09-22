import { PrismaClient, Prisma, DiscountType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  CreateDiscountInput,
  UpdateDiscountInput,
  DiscountFilterParams,
  FormattedDiscount,
  DiscountCalculationResult,
} from "./discount.types";

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

function conflictError(msg: string): never {
  const err: any = new Error(msg);
  err.status = 409;
  throw err;
}

function formatDiscount(d: any): FormattedDiscount {
  return {
    id: d.id,
    code: d.code,
    type: d.type,
    value: Number(d.value),
    maxDiscount: d.maxDiscount ? Number(d.maxDiscount) : null,
    minimumOrderAmount: d.minimumOrderAmount ? Number(d.minimumOrderAmount) : null,
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    isActive: d.isActive,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export class DiscountService {
  /**
   * 1. Validate and calculate discount for a given subtotal.
   * Can be used standalone (preview) or inside order creation transaction.
   */
  static async validateAndCalculateDiscount(
    code: string,
    subtotal: number,
    dbClient: PrismaClient | Prisma.TransactionClient = prisma
  ): Promise<DiscountCalculationResult> {
    const cleanCode = code.trim().toUpperCase();

    const discount = await dbClient.discount.findUnique({
      where: { code: cleanCode },
    });

    if (!discount) {
      badRequestError(`Invalid coupon code '${cleanCode}'.`);
    }

    if (!discount.isActive) {
      badRequestError(`Coupon code '${cleanCode}' is currently disabled.`);
    }

    const now = new Date();

    if (discount.startsAt && new Date(discount.startsAt) > now) {
      badRequestError(`Coupon code '${cleanCode}' is not yet active.`);
    }

    if (discount.endsAt && new Date(discount.endsAt) < now) {
      badRequestError(`Coupon code '${cleanCode}' has expired.`);
    }

    const minAmount = discount.minimumOrderAmount ? Number(discount.minimumOrderAmount) : null;
    if (minAmount !== null && subtotal < minAmount) {
      badRequestError(
        `Minimum order subtotal of ₹${minAmount.toFixed(2)} is required to use coupon '${cleanCode}'. Current subtotal is ₹${subtotal.toFixed(2)}.`
      );
    }

    let discountAmount = 0;
    const value = Number(discount.value);
    const maxDiscount = discount.maxDiscount ? Number(discount.maxDiscount) : null;

    if (discount.type === DiscountType.PERCENTAGE) {
      const rawDiscount = (subtotal * value) / 100;
      discountAmount = maxDiscount !== null ? Math.min(rawDiscount, maxDiscount) : rawDiscount;
    } else if (discount.type === DiscountType.FIXED) {
      discountAmount = Math.min(value, subtotal);
    }

    // Safety checks: discount cannot exceed subtotal and cannot be negative
    discountAmount = Math.max(0, Math.min(discountAmount, subtotal));
    const roundedDiscount = Number(discountAmount.toFixed(2));
    const finalSubtotal = Number(Math.max(0, subtotal - roundedDiscount).toFixed(2));

    return {
      isValid: true,
      discountId: discount.id,
      code: discount.code,
      type: discount.type,
      value,
      maxDiscount,
      minimumOrderAmount: minAmount,
      discountAmount: roundedDiscount,
      subtotal,
      finalSubtotal,
    };
  }

  /**
   * 2. Admin: Create a new discount coupon.
   */
  static async adminCreateDiscount(
    adminId: string,
    input: CreateDiscountInput
  ): Promise<FormattedDiscount> {
    const cleanCode = input.code.trim().toUpperCase();

    const existing = await prisma.discount.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      conflictError(`A discount coupon with code '${cleanCode}' already exists.`);
    }

    const created = await prisma.$transaction(async (tx) => {
      const discount = await tx.discount.create({
        data: {
          code: cleanCode,
          type: input.type,
          value: new Prisma.Decimal(input.value),
          maxDiscount: input.maxDiscount !== undefined && input.maxDiscount !== null
            ? new Prisma.Decimal(input.maxDiscount)
            : null,
          minimumOrderAmount:
            input.minimumOrderAmount !== undefined && input.minimumOrderAmount !== null
              ? new Prisma.Decimal(input.minimumOrderAmount)
              : null,
          startsAt: input.startsAt ? new Date(input.startsAt) : new Date(),
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          isActive: input.isActive !== undefined ? input.isActive : true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "ADMIN_CREATE_DISCOUNT",
          entity: "Discount",
          entityId: discount.id,
          metadata: {
            code: discount.code,
            type: discount.type,
            value: input.value,
          },
        },
      });

      return discount;
    });

    return formatDiscount(created);
  }

  /**
   * 3. Admin: List discounts with search, type, status filters and pagination.
   */
  static async adminListDiscounts(params: DiscountFilterParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.DiscountWhereInput = {};

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }
    if (params.type) {
      where.type = params.type;
    }
    if (params.search) {
      where.code = { contains: params.search.trim().toUpperCase(), mode: "insensitive" };
    }

    const [items, total] = await Promise.all([
      prisma.discount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.discount.count({ where }),
    ]);

    return {
      items: items.map(formatDiscount),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 4. Admin: Get single discount by ID.
   */
  static async adminGetDiscount(id: string): Promise<FormattedDiscount> {
    const discount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      notFoundError("Discount coupon not found.");
    }

    return formatDiscount(discount);
  }

  /**
   * 5. Admin: Update discount details.
   */
  static async adminUpdateDiscount(
    adminId: string,
    id: string,
    input: UpdateDiscountInput
  ): Promise<FormattedDiscount> {
    const discount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      notFoundError("Discount coupon not found.");
    }

    if (input.code && input.code.trim().toUpperCase() !== discount.code) {
      const duplicate = await prisma.discount.findUnique({
        where: { code: input.code.trim().toUpperCase() },
      });
      if (duplicate) {
        conflictError(`A discount coupon with code '${input.code.trim().toUpperCase()}' already exists.`);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.discount.update({
        where: { id },
        data: {
          ...(input.code && { code: input.code.trim().toUpperCase() }),
          ...(input.type && { type: input.type }),
          ...(input.value !== undefined && { value: new Prisma.Decimal(input.value) }),
          ...(input.maxDiscount !== undefined && {
            maxDiscount: input.maxDiscount !== null ? new Prisma.Decimal(input.maxDiscount) : null,
          }),
          ...(input.minimumOrderAmount !== undefined && {
            minimumOrderAmount:
              input.minimumOrderAmount !== null ? new Prisma.Decimal(input.minimumOrderAmount) : null,
          }),
          ...(input.startsAt !== undefined && { startsAt: new Date(input.startsAt) }),
          ...(input.endsAt !== undefined && {
            endsAt: input.endsAt !== null ? new Date(input.endsAt) : null,
          }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "ADMIN_UPDATE_DISCOUNT",
          entity: "Discount",
          entityId: id,
          metadata: JSON.parse(JSON.stringify({ changes: input })),
        },
      });

      return res;
    });

    return formatDiscount(updated);
  }

  /**
   * 6. Admin: Toggle discount active status.
   */
  static async adminToggleStatus(
    adminId: string,
    id: string,
    isActive: boolean
  ): Promise<FormattedDiscount> {
    const discount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      notFoundError("Discount coupon not found.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.discount.update({
        where: { id },
        data: { isActive },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "ADMIN_TOGGLE_DISCOUNT_STATUS",
          entity: "Discount",
          entityId: id,
          metadata: {
            previousState: { isActive: discount.isActive },
            newState: { isActive },
          },
        },
      });

      return res;
    });

    return formatDiscount(updated);
  }

  /**
   * 7. Admin: Delete discount coupon.
   */
  static async adminDeleteDiscount(adminId: string, id: string) {
    const discount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      notFoundError("Discount coupon not found.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.discount.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "ADMIN_DELETE_DISCOUNT",
          entity: "Discount",
          entityId: id,
          metadata: {
            deletedCode: discount.code,
            type: discount.type,
            value: Number(discount.value),
          },
        },
      });
    });

    return { id, message: `Discount coupon '${discount.code}' deleted successfully.` };
  }
}
