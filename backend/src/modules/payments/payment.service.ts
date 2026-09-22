import { PrismaClient, Prisma, PaymentMethod, PaymentStatus, OrderStatus, DeliveryStatus, UserRole, NotificationType } from "@prisma/client";
import { PaymentProviderFactory } from "./providers/payment-provider.factory";
import { SettlementService } from "../settlements/settlement.service";
import {
  CreatePaymentInput,
  VerifyPaymentInput,
  FailPaymentInput,
  RefundPaymentInput,
  PaymentFilterParams,
  FormattedPayment,
} from "./payment.types";
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

function formatPayment(p: any): FormattedPayment {
  return {
    id: p.id,
    orderId: p.orderId,
    orderNumber: p.order?.orderNumber,
    method: p.method,
    status: p.status,
    amount: Number(p.amount),
    provider: p.provider,
    transactionReference: p.transactionReference,
    failureReason: p.failureReason,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    customer: p.order?.customer
      ? {
          id: p.order.customer.id,
          email: p.order.customer.email,
          phone: p.order.customer.phone,
          fullName: p.order.customer.profile
            ? `${p.order.customer.profile.firstName} ${p.order.customer.profile.lastName}`
            : p.order.customer.email,
        }
      : undefined,
    pharmacy: p.order?.pharmacy
      ? {
          id: p.order.pharmacy.id,
          name: p.order.pharmacy.name,
          city: p.order.pharmacy.city,
          phone: p.order.pharmacy.phone,
        }
      : undefined,
    settlement: p.settlement
      ? {
          id: p.settlement.id,
          status: p.settlement.status,
          amount: Number(p.settlement.amount),
          settledAt: p.settlement.settledAt,
        }
      : null,
  };
}

export class PaymentService {
  /**
   * 1. Create or retrieve payment intent for an order.
   * Derives payable amount exclusively from Order.totalAmount.
   * Enforces idempotency: does not duplicate payments for the same order.
   */
  static async createPaymentIntent(
    userId: string,
    role: string,
    orderId: string,
    input: CreatePaymentInput
  ): Promise<FormattedPayment> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { include: { profile: true } },
        pharmacy: true,
        delivery: true,
        payments: {
          orderBy: { createdAt: "desc" },
          include: { settlement: true },
        },
      },
    });

    if (!order) {
      notFoundError("Order not found.");
    }

    // Ownership authorization
    if (role === UserRole.CUSTOMER && order.customerId !== userId) {
      notFoundError("Order not found.");
    }

    // Eligibility validation
    if (order.orderStatus === OrderStatus.REJECTED || order.orderStatus === OrderStatus.CANCELLED) {
      badRequestError(`Cannot initiate payment for an order with status "${order.orderStatus}".`);
    }

    // Post-delivery business requirement check:
    // Home delivery orders must have arrived or completed delivery before payment collection
    if (order.fulfillmentType === "HOME_DELIVERY") {
      const allowedDeliveryStatuses: DeliveryStatus[] = [DeliveryStatus.DELIVERED, DeliveryStatus.OUT_FOR_DELIVERY];
      if (order.delivery && !allowedDeliveryStatuses.includes(order.delivery.status) && order.orderStatus !== OrderStatus.DELIVERED && order.orderStatus !== OrderStatus.COMPLETED) {
        badRequestError("Payment can only be collected after shipment is out for delivery or delivered.");
      }
    }

    // Idempotency: Check if an active or paid payment already exists for this order
    const existingPaid = order.payments.find((p) => p.status === PaymentStatus.PAID);
    if (existingPaid) {
      return formatPayment({
        ...existingPaid,
        order,
      });
    }

    const existingPending = order.payments.find((p) => p.status === PaymentStatus.PENDING);
    if (existingPending) {
      // If payment method matches, reuse existing pending record
      if (existingPending.method === input.method) {
        return formatPayment({
          ...existingPending,
          order,
        });
      }

      // If method changed (e.g. switched from COD to UPI), update the pending record
      const provider = PaymentProviderFactory.getProvider();
      const providerRes = await provider.createPayment(order, input.method);

      const updated = await prisma.payment.update({
        where: { id: existingPending.id },
        data: {
          method: input.method,
          transactionReference: providerRes.transactionReference,
          provider: providerRes.provider,
          amount: order.totalAmount, // Ensure authoritative amount
        },
        include: {
          settlement: true,
        },
      });

      return formatPayment({
        ...updated,
        order,
      });
    }

    // Initialize new payment intent through provider abstraction
    const provider = PaymentProviderFactory.getProvider();
    const providerRes = await provider.createPayment(order, input.method);

    if (!providerRes.success) {
      badRequestError(providerRes.errorMessage || "Failed to initialize payment with provider.");
    }

    const created = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          orderId: order.id,
          method: input.method,
          status: PaymentStatus.PENDING,
          amount: order.totalAmount, // Authoritative Decimal from database
          provider: providerRes.provider,
          transactionReference: providerRes.transactionReference,
        },
        include: {
          settlement: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "PAYMENT_CREATED",
          entity: "Payment",
          entityId: p.id,
          metadata: {
            orderNumber: order.orderNumber,
            method: input.method,
            amount: Number(order.totalAmount),
          },
        },
      });

      return p;
    });

    return formatPayment({
      ...created,
      order,
    });
  }

  /**
   * 2. Get payment status for an order with RBAC and multi-tenant isolation.
   */
  static async getPaymentForOrder(
    userId: string,
    role: string,
    orderId: string,
    pharmacyIdFromUser?: string
  ): Promise<FormattedPayment | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { include: { profile: true } },
        pharmacy: true,
        delivery: { include: { deliveryPartner: true } },
        payments: {
          orderBy: { createdAt: "desc" },
          include: { settlement: true },
        },
      },
    });

    if (!order) {
      notFoundError("Order not found.");
    }

    // Role-based access control
    if (role === UserRole.CUSTOMER) {
      if (order.customerId !== userId) {
        notFoundError("Order not found.");
      }
    } else if (role === UserRole.PHARMACY) {
      if (!pharmacyIdFromUser || order.pharmacyId !== pharmacyIdFromUser) {
        forbiddenError("Access denied. You can only view payments for your own pharmacy orders.");
      }
    } else if (role === UserRole.DELIVERY_PARTNER) {
      // Delivery partner only permitted if assigned to this delivery
      const isAssigned = order.delivery?.deliveryPartner?.userId === userId;
      if (!isAssigned) {
        forbiddenError("Access denied. You are not assigned to this delivery.");
      }
      // Delivery partner gets stripped down payment view
      const latestPayment = order.payments[0];
      if (!latestPayment) return null;
      return {
        id: latestPayment.id,
        orderId: latestPayment.orderId,
        orderNumber: order.orderNumber,
        method: latestPayment.method,
        status: latestPayment.status,
        amount: Number(latestPayment.amount),
        provider: latestPayment.provider,
        transactionReference: latestPayment.transactionReference,
        failureReason: null,
        paidAt: latestPayment.paidAt,
        createdAt: latestPayment.createdAt,
        updatedAt: latestPayment.updatedAt,
      };
    }

    const latestPayment = order.payments[0];
    if (!latestPayment) {
      return null;
    }

    return formatPayment({
      ...latestPayment,
      order,
    });
  }

  /**
   * 3. Verify payment through the provider abstraction.
   * State Machine: PENDING -> PAID.
   * Updates Payment, completes Order (OrderStatus.COMPLETED), and creates automated pharmacy Settlement.
   */
  static async verifyPayment(
    userId: string,
    role: string,
    paymentId: string,
    input: VerifyPaymentInput
  ): Promise<FormattedPayment> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            customer: { include: { profile: true } },
            pharmacy: true,
          },
        },
        settlement: true,
      },
    });

    if (!payment) {
      notFoundError("Payment record not found.");
    }

    // Ownership check
    if (role === UserRole.CUSTOMER && payment.order.customerId !== userId) {
      notFoundError("Payment record not found.");
    }

    // State machine guards
    if (payment.status === PaymentStatus.PAID) {
      return formatPayment(payment);
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      badRequestError("Cannot verify an already refunded payment.");
    }

    if (payment.status !== PaymentStatus.PENDING) {
      badRequestError(`Invalid payment transition. Cannot verify payment in "${payment.status}" status.`);
    }

    // Provider verification
    const provider = PaymentProviderFactory.getProvider(payment.provider);
    const verification = await provider.verifyPayment(payment, input);

    if (!verification.verified || verification.status === PaymentStatus.FAILED) {
      // Record failure on payment
      const failedPayment = await prisma.$transaction(async (tx) => {
        const p = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: verification.errorMessage || "Payment verification declined by provider.",
          },
          include: {
            order: { include: { customer: { include: { profile: true } }, pharmacy: true } },
            settlement: true,
          },
        });

        await tx.auditLog.create({
          data: {
            userId,
            action: "PAYMENT_FAILED",
            entity: "Payment",
            entityId: paymentId,
            metadata: {
              reason: verification.errorMessage || "Verification declined",
              orderId: payment.orderId,
            },
          },
        });

        return p;
      });

      badRequestError(verification.errorMessage || "Payment verification failed.");
    }

    // Verification succeeded: Transition to PAID, COMPLETE order, and create automated Settlement
    const updatedPayment = await prisma.$transaction(async (tx) => {
      // 1. Update Payment record to PAID
      const paid = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          transactionReference: verification.transactionReference || payment.transactionReference,
          failureReason: null,
        },
        include: {
          order: { include: { customer: { include: { profile: true } }, pharmacy: true } },
        },
      });

      // 2. Transition Order to COMPLETED
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          orderStatus: OrderStatus.COMPLETED,
        },
      });

      // 3. Automated Pharmacy Settlement creation
      await SettlementService.createOrUpdateSettlementForOrder(tx, {
        orderId: payment.orderId,
        pharmacyId: payment.order.pharmacyId,
        paymentId: payment.id,
        amount: payment.amount,
        autoSettle: true, // Automated settlement enabled per requirements
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: "PAYMENT_VERIFIED",
          entity: "Payment",
          entityId: paymentId,
          metadata: {
            orderNumber: payment.order.orderNumber,
            method: payment.method,
            amount: Number(payment.amount),
            transactionReference: paid.transactionReference,
          },
        },
      });

      return paid;
    });

    // Re-fetch with fresh settlement relation
    const finalPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: { include: { customer: { include: { profile: true } }, pharmacy: true } },
        settlement: true,
      },
    });

    // Notify customer: payment successful
    await NotificationService.create({
      userId: payment.order.customerId,
      type: NotificationType.ORDER_UPDATE,
      title: "Payment Successful",
      message: `Your payment of ₹${Number(payment.amount).toFixed(2)} for order #${payment.order.orderNumber} has been confirmed. Your order is now complete.`,
      reference: `orders/${payment.orderId}`,
    });

    return formatPayment(finalPayment);
  }

  /**
   * 4. Record payment failure (PENDING -> FAILED).
   */
  static async failPayment(
    userId: string,
    role: string,
    paymentId: string,
    input: FailPaymentInput
  ): Promise<FormattedPayment> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: { include: { customer: { include: { profile: true } }, pharmacy: true } },
        settlement: true,
      },
    });

    if (!payment) {
      notFoundError("Payment record not found.");
    }

    if (role === UserRole.CUSTOMER && payment.order.customerId !== userId) {
      notFoundError("Payment record not found.");
    }

    if (payment.status === PaymentStatus.PAID) {
      badRequestError("Cannot mark a paid payment as failed. Request a refund instead.");
    }

    if (payment.status !== PaymentStatus.PENDING) {
      badRequestError(`Cannot fail a payment in "${payment.status}" status.`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: input.reason.trim(),
        },
        include: {
          order: { include: { customer: { include: { profile: true } }, pharmacy: true } },
          settlement: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "PAYMENT_FAILED_MANUAL",
          entity: "Payment",
          entityId: paymentId,
          metadata: {
            reason: input.reason.trim(),
            orderId: payment.orderId,
          },
        },
      });

      return p;
    });

    // Notify customer: payment failed
    await NotificationService.create({
      userId: payment.order.customerId,
      type: NotificationType.ORDER_UPDATE,
      title: "Payment Failed",
      message: `Your payment for order #${payment.order.orderNumber} could not be processed. Reason: ${input.reason}. Please try again or contact support.`,
      reference: `orders/${payment.orderId}`,
    });

    return formatPayment(updated);
  }

  /**
   * 5. Admin: Refund a previously paid payment.
   * State Machine: PAID -> REFUNDED.
   */
  static async refundPayment(
    adminUserId: string,
    paymentId: string,
    input: RefundPaymentInput
  ): Promise<FormattedPayment> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: { include: { customer: { include: { profile: true } }, pharmacy: true } },
        settlement: true,
      },
    });

    if (!payment) {
      notFoundError("Payment record not found.");
    }

    if (payment.status !== PaymentStatus.PAID) {
      badRequestError(`Only payments in "PAID" status can be refunded. Current status is "${payment.status}".`);
    }

    const provider = PaymentProviderFactory.getProvider(payment.provider);
    const refundResult = await provider.refundPayment(payment, input.reason);

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          failureReason: input.reason ? `Refunded: ${input.reason}` : "Refunded by Administrator",
        },
        include: {
          order: { include: { customer: { include: { profile: true } }, pharmacy: true } },
          settlement: true,
        },
      });

      // Update associated settlement to FAILED or note reversal
      if (payment.settlement) {
        await tx.settlement.update({
          where: { id: payment.settlement.id },
          data: {
            status: "FAILED",
            failureReason: `Reversed due to customer payment refund (${refundResult.refundReference || "REFUND"})`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: "PAYMENT_REFUNDED",
          entity: "Payment",
          entityId: paymentId,
          metadata: {
            reason: input.reason,
            refundReference: refundResult.refundReference,
            amount: Number(payment.amount),
          },
        },
      });

      return p;
    });

    // Notify customer: payment refunded
    await NotificationService.create({
      userId: payment.order.customerId,
      type: NotificationType.ORDER_UPDATE,
      title: "Payment Refunded",
      message: `Your payment of ₹${Number(payment.amount).toFixed(2)} for order #${payment.order.orderNumber} has been refunded. Please allow 3–5 business days.`,
      reference: `orders/${payment.orderId}`,
    });

    return formatPayment(updated);
  }

  /**
   * 6. Admin: List payments with server-side filters and pagination.
   */
  static async listPaymentsAdmin(params: PaymentFilterParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};

    if (params.status && params.status !== "all") {
      where.status = params.status as PaymentStatus;
    }

    if (params.method && params.method !== "all") {
      where.method = params.method as PaymentMethod;
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { transactionReference: { contains: q, mode: "insensitive" } },
        { order: { orderNumber: { contains: q, mode: "insensitive" } } },
        { order: { customer: { email: { contains: q, mode: "insensitive" } } } },
        { order: { pharmacy: { name: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            include: {
              customer: { include: { profile: true } },
              pharmacy: true,
            },
          },
          settlement: true,
        },
      }),
    ]);

    const [paidSum, pendingSum] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: PaymentStatus.PENDING },
        _sum: { amount: true },
      }),
    ]);

    return {
      items: items.map(formatPayment),
      metrics: {
        totalPaidAmount: Number(paidSum._sum.amount || 0),
        pendingPaymentAmount: Number(pendingSum._sum.amount || 0),
        totalPayments: total,
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
   * 7. Admin: Get single payment details.
   */
  static async getPaymentDetailAdmin(paymentId: string): Promise<FormattedPayment> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            customer: { include: { profile: true } },
            pharmacy: true,
          },
        },
        settlement: true,
      },
    });

    if (!payment) {
      notFoundError("Payment record not found.");
    }

    return formatPayment(payment);
  }
}
