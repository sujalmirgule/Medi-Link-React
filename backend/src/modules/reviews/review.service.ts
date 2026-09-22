import { Prisma, OrderStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  CreateReviewInput,
  UpdateReviewInput,
  ReviewFilterParams,
  FormattedReview,
  AggregateRating,
  OrderReviewStatus,
} from "./review.types";

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

function conflictError(msg: string): never {
  const err: any = new Error(msg);
  err.status = 409;
  throw err;
}

function formatReview(r: any): FormattedReview {
  return {
    id: r.id,
    customerId: r.customerId,
    orderId: r.orderId,
    medicineId: r.medicineId,
    pharmacyId: r.pharmacyId,
    deliveryPartnerId: r.deliveryPartnerId,
    rating: r.rating,
    comment: r.comment,
    isHidden: r.isHidden,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    customer: r.customer
      ? {
          id: r.customer.id,
          firstName: r.customer.profile?.firstName || undefined,
          lastName: r.customer.profile?.lastName || undefined,
          email: r.customer.email,
        }
      : undefined,
    medicine: r.medicine ? { id: r.medicine.id, name: r.medicine.name } : null,
    pharmacy: r.pharmacy ? { id: r.pharmacy.id, name: r.pharmacy.name } : null,
    deliveryPartner: r.deliveryPartner
      ? { id: r.deliveryPartner.id, userId: r.deliveryPartner.userId }
      : null,
  };
}

export class ReviewService {
  /**
   * 1. Create a verified review for a medicine, pharmacy, or delivery partner.
   */
  static async createReview(
    customerId: string,
    input: CreateReviewInput
  ): Promise<FormattedReview> {
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer || !customer.isActive) {
      badRequestError("Customer account is inactive or does not exist.");
    }

    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: {
        items: {
          include: {
            pharmacyMedicine: true,
          },
        },
        delivery: true,
      },
    });

    if (!order) {
      notFoundError("Order not found.");
    }

    if (order.customerId !== customerId) {
      forbiddenError("You are not authorized to review an order that does not belong to you.");
    }

    // A. Medicine Review Eligibility
    if (input.medicineId) {
      if (order.orderStatus !== OrderStatus.COMPLETED) {
        badRequestError("Medicine reviews are only allowed once an order has reached COMPLETED status.");
      }

      const medicinePurchased = order.items.some(
        (item) => item.pharmacyMedicine.medicineId === input.medicineId
      );

      if (!medicinePurchased) {
        badRequestError("The specified medicine was not part of this order.");
      }

      const existingReview = await prisma.review.findFirst({
        where: {
          customerId,
          orderId: input.orderId,
          medicineId: input.medicineId,
        },
      });

      if (existingReview) {
        conflictError("You have already reviewed this medicine for this order.");
      }
    }

    // B. Pharmacy Review Eligibility
    if (input.pharmacyId) {
      if (order.orderStatus !== OrderStatus.COMPLETED) {
        badRequestError("Pharmacy reviews are only allowed once an order has reached COMPLETED status.");
      }

      if (order.pharmacyId !== input.pharmacyId) {
        badRequestError("The specified pharmacy does not match the order pharmacy.");
      }

      const existingReview = await prisma.review.findFirst({
        where: {
          customerId,
          orderId: input.orderId,
          pharmacyId: input.pharmacyId,
        },
      });

      if (existingReview) {
        conflictError("You have already reviewed this pharmacy for this order.");
      }
    }

    // C. Delivery Partner Review Eligibility
    if (input.deliveryPartnerId) {
      if (
        order.orderStatus !== OrderStatus.DELIVERED &&
        order.orderStatus !== OrderStatus.COMPLETED
      ) {
        badRequestError("Delivery partner reviews are only allowed once the order is DELIVERED or COMPLETED.");
      }

      if (!order.delivery || order.delivery.deliveryPartnerId !== input.deliveryPartnerId) {
        badRequestError("The specified delivery partner did not handle this order delivery.");
      }

      const existingReview = await prisma.review.findFirst({
        where: {
          customerId,
          orderId: input.orderId,
          deliveryPartnerId: input.deliveryPartnerId,
        },
      });

      if (existingReview) {
        conflictError("You have already reviewed this delivery partner for this order.");
      }
    }

    const created = await prisma.review.create({
      data: {
        customerId,
        orderId: input.orderId,
        medicineId: input.medicineId || null,
        pharmacyId: input.pharmacyId || null,
        deliveryPartnerId: input.deliveryPartnerId || null,
        rating: input.rating,
        comment: input.comment || null,
        isHidden: false,
      },
      include: {
        customer: { include: { profile: true } },
        medicine: true,
        pharmacy: true,
        deliveryPartner: true,
      },
    });

    return formatReview(created);
  }

  /**
   * 2. Update own review (rating and/or comment).
   */
  static async updateReview(
    customerId: string,
    reviewId: string,
    input: UpdateReviewInput
  ): Promise<FormattedReview> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: { include: { profile: true } },
        medicine: true,
        pharmacy: true,
        deliveryPartner: true,
      },
    });

    if (!review) {
      notFoundError("Review not found.");
    }

    if (review.customerId !== customerId) {
      forbiddenError("You are not authorized to update this review.");
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.comment !== undefined && { comment: input.comment }),
      },
      include: {
        customer: { include: { profile: true } },
        medicine: true,
        pharmacy: true,
        deliveryPartner: true,
      },
    });

    return formatReview(updated);
  }

  /**
   * 3. List public, unhidden reviews for a specific medicine.
   */
  static async listMedicineReviews(
    medicineId: string,
    params: { page?: number; limit?: number }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      medicineId,
      isHidden: false,
    };

    const [items, total, aggregateData] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { include: { profile: true } },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const totalReviews = aggregateData._count.rating || 0;
    const rawAvg = aggregateData._avg.rating || 0;
    const averageRating = totalReviews > 0 ? Number(rawAvg.toFixed(1)) : 0;

    return {
      items: items.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        customerName: r.customer?.profile
          ? `${r.customer.profile.firstName} ${r.customer.profile.lastName?.charAt(0) || ""}.`.trim()
          : "Verified Customer",
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      aggregate: {
        averageRating,
        totalReviews,
      },
    };
  }

  /**
   * 4. Get aggregate rating for a medicine.
   */
  static async getMedicineAverageRating(medicineId: string): Promise<AggregateRating> {
    const aggregate = await prisma.review.aggregate({
      where: {
        medicineId,
        isHidden: false,
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const totalReviews = aggregate._count.rating || 0;
    const rawAvg = aggregate._avg.rating || 0;

    return {
      averageRating: totalReviews > 0 ? Number(rawAvg.toFixed(1)) : 0,
      totalReviews,
    };
  }

  /**
   * 5. Get aggregate rating for a pharmacy.
   */
  static async getPharmacyAverageRating(pharmacyId: string): Promise<AggregateRating> {
    const aggregate = await prisma.review.aggregate({
      where: {
        pharmacyId,
        isHidden: false,
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const totalReviews = aggregate._count.rating || 0;
    const rawAvg = aggregate._avg.rating || 0;

    return {
      averageRating: totalReviews > 0 ? Number(rawAvg.toFixed(1)) : 0,
      totalReviews,
    };
  }

  /**
   * 6. Get aggregate rating for a delivery partner.
   */
  static async getDeliveryPartnerAverageRating(deliveryPartnerId: string): Promise<AggregateRating> {
    const aggregate = await prisma.review.aggregate({
      where: {
        deliveryPartnerId,
        isHidden: false,
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const totalReviews = aggregate._count.rating || 0;
    const rawAvg = aggregate._avg.rating || 0;

    return {
      averageRating: totalReviews > 0 ? Number(rawAvg.toFixed(1)) : 0,
      totalReviews,
    };
  }

  /**
   * 7. List customer's own reviews.
   */
  static async listMyReviews(
    customerId: string,
    params: { page?: number; limit?: number }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = { customerId };

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          medicine: true,
          pharmacy: true,
          deliveryPartner: true,
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      items: items.map(formatReview),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 8. Check review status for an order (which items/entities have been reviewed).
   */
  static async getOrderReviewStatus(
    customerId: string,
    orderId: string
  ): Promise<{
    orderId: string;
    canReviewMedicine: boolean;
    canReviewPharmacy: boolean;
    canReviewDelivery: boolean;
    reviewedMedicineIds: string[];
    pharmacyReviewed: boolean;
    deliveryReviewed: boolean;
    reviews: FormattedReview[];
  }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            pharmacyMedicine: true,
          },
        },
        delivery: true,
      },
    });

    if (!order) {
      notFoundError("Order not found.");
    }

    if (order.customerId !== customerId) {
      forbiddenError("You are not authorized to view review status for this order.");
    }

    const reviews = await prisma.review.findMany({
      where: {
        orderId,
        customerId,
      },
      include: {
        medicine: true,
        pharmacy: true,
        deliveryPartner: true,
      },
    });

    const reviewedMedicineIds = reviews
      .map((r) => r.medicineId)
      .filter((id): id is string => Boolean(id));

    const pharmacyReviewed = reviews.some((r) => Boolean(r.pharmacyId));
    const deliveryReviewed = reviews.some((r) => Boolean(r.deliveryPartnerId));

    const isCompleted = order.orderStatus === OrderStatus.COMPLETED;
    const isDeliveredOrCompleted =
      order.orderStatus === OrderStatus.DELIVERED || order.orderStatus === OrderStatus.COMPLETED;

    return {
      orderId,
      canReviewMedicine: isCompleted,
      canReviewPharmacy: isCompleted,
      canReviewDelivery: isDeliveredOrCompleted && Boolean(order.delivery?.deliveryPartnerId),
      reviewedMedicineIds,
      pharmacyReviewed,
      deliveryReviewed,
      reviews: reviews.map(formatReview),
    };
  }

  /**
   * 9. Admin: List all reviews with filters & pagination.
   */
  static async adminListReviews(params: ReviewFilterParams & { search?: string }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {};

    if (params.isHidden !== undefined) {
      where.isHidden = params.isHidden;
    }
    if (params.medicineId) {
      where.medicineId = params.medicineId;
    }
    if (params.pharmacyId) {
      where.pharmacyId = params.pharmacyId;
    }
    if (params.deliveryPartnerId) {
      where.deliveryPartnerId = params.deliveryPartnerId;
    }
    if (params.customerId) {
      where.customerId = params.customerId;
    }
    if (params.minRating !== undefined || params.maxRating !== undefined) {
      where.rating = {
        ...(params.minRating !== undefined && { gte: params.minRating }),
        ...(params.maxRating !== undefined && { lte: params.maxRating }),
      };
    }
    if (params.search) {
      where.OR = [
        { comment: { contains: params.search, mode: "insensitive" } },
        { customer: { email: { contains: params.search, mode: "insensitive" } } },
        { medicine: { name: { contains: params.search, mode: "insensitive" } } },
        { pharmacy: { name: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { include: { profile: true } },
          medicine: true,
          pharmacy: true,
          deliveryPartner: true,
          order: true,
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      items: items.map((r) => ({
        ...formatReview(r),
        orderNumber: r.order?.orderNumber || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 10. Admin: Toggle soft-hide status on a review.
   */
  static async adminHideReview(adminId: string, reviewId: string, isHidden: boolean = true) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      notFoundError("Review not found.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.review.update({
        where: { id: reviewId },
        data: { isHidden },
        include: {
          customer: { include: { profile: true } },
          medicine: true,
          pharmacy: true,
          deliveryPartner: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: isHidden ? "ADMIN_HIDE_REVIEW" : "ADMIN_UNHIDE_REVIEW",
          entity: "Review",
          entityId: reviewId,
          metadata: {
            previousState: { isHidden: review.isHidden },
            newState: { isHidden },
          },
        },
      });

      return res;
    });

    return formatReview(updated);
  }

  /**
   * 11. Admin: Delete a review permanently.
   */
  static async adminDeleteReview(adminId: string, reviewId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      notFoundError("Review not found.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: { id: reviewId },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "ADMIN_DELETE_REVIEW",
          entity: "Review",
          entityId: reviewId,
          metadata: {
            deletedReview: {
              rating: review.rating,
              comment: review.comment,
              customerId: review.customerId,
              orderId: review.orderId,
            },
          },
        },
      });
    });

    return { id: reviewId, message: "Review deleted successfully" };
  }
}
