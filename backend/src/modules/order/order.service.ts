import { FulfillmentType, OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { InventoryReservationService } from "./inventory.reservation.service";
import {
  OrderCreateInput,
  OrderFilterParams,
  OrderResponse,
  OrderResponseItem,
} from "./order.types";

function badRequestError(message: string): never {
  const err = new Error(message) as any;
  err.status = 400;
  err.statusCode = 400;
  throw err;
}

function notFoundError(entity: string): never {
  const err = new Error(`${entity} not found`) as any;
  err.status = 404;
  err.statusCode = 404;
  throw err;
}

function formatOrderResponse(order: any): OrderResponse {
  const items: OrderResponseItem[] = (order.items || []).map((item: any) => ({
    id: item.id,
    pharmacyMedicineId: item.pharmacyMedicineId,
    inventoryBatchId: item.inventoryBatchId,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    totalPrice: Number(item.totalPrice),
    medicine: {
      id: item.pharmacyMedicine?.medicine?.id || "",
      name: item.pharmacyMedicine?.medicine?.name || "Medicine",
      genericName: item.pharmacyMedicine?.medicine?.genericName || "",
      strength: item.pharmacyMedicine?.medicine?.strength || "",
      dosageForm: item.pharmacyMedicine?.medicine?.dosageForm || "",
    },
  }));

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    pharmacyId: order.pharmacyId,
    orderStatus: order.orderStatus,
    fulfillmentType: order.fulfillmentType,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    discountAmount: Number(order.discountAmount || 0),
    totalAmount: Number(order.totalAmount),
    customerNote: order.customerNote,
    cancellationReason: order.cancellationReason,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    pharmacy: {
      id: order.pharmacy.id,
      name: order.pharmacy.name,
      address: order.pharmacy.address,
      city: order.pharmacy.city,
      phone: order.pharmacy.phone,
    },
    deliveryAddress: order.deliveryAddress
      ? {
          id: order.deliveryAddress.id,
          label: order.deliveryAddress.label,
          addressLine1: order.deliveryAddress.addressLine1,
          addressLine2: order.deliveryAddress.addressLine2,
          city: order.deliveryAddress.city,
          state: order.deliveryAddress.state,
          pincode: order.deliveryAddress.pincode,
        }
      : null,
    customer: order.customer
      ? {
          id: order.customer.id,
          email: order.customer.email,
          phone: order.customer.phone,
          firstName: order.customer.profile?.firstName,
          lastName: order.customer.profile?.lastName,
        }
      : undefined,
    items,
  };
}

export class OrderService {
  /**
   * 1. Place a new order with atomic stock reservation inside a database transaction.
   */
  static async createOrder(customerId: string, input: OrderCreateInput): Promise<OrderResponse> {
    return await prisma.$transaction(async (tx) => {
      // 1. Verify customer exists and is active
      const customer = await tx.user.findUnique({
        where: { id: customerId },
        include: { profile: true },
      });

      if (!customer || !customer.isActive) {
        badRequestError("Customer account is disabled or does not exist.");
      }

      // 2. Verify pharmacy exists, is active, and is verified
      const pharmacy = await tx.pharmacy.findUnique({
        where: { id: input.pharmacyId },
      });

      if (!pharmacy || !pharmacy.isActive) {
        badRequestError("Selected pharmacy is inactive or does not exist.");
      }

      if (!pharmacy.isVerified) {
        badRequestError("Selected pharmacy is not verified to process orders.");
      }

      // 3. Verify delivery address if HOME_DELIVERY
      let deliveryAddressId: string | null = null;
      if (input.fulfillmentType === FulfillmentType.HOME_DELIVERY) {
        if (!input.deliveryAddressId) {
          badRequestError("Delivery address is required for Home Delivery fulfillment.");
        }

        const address = await tx.address.findUnique({
          where: { id: input.deliveryAddressId },
        });

        if (!address || address.userId !== customerId) {
          badRequestError("The selected delivery address does not belong to your account.");
        }

        deliveryAddressId = address.id;
      }

      // 4. Validate medicines and allocate stock atomically
      const allocatedItems = await InventoryReservationService.validateAndAllocateStock(
        tx,
        input.pharmacyId,
        input.items
      );

      // 5. Calculate financial totals server-side
      let subtotal = new Prisma.Decimal(0);
      for (const item of allocatedItems) {
        subtotal = subtotal.add(item.totalPrice);
      }

      const deliveryFee =
        input.fulfillmentType === FulfillmentType.HOME_DELIVERY
          ? new Prisma.Decimal(30.0)
          : new Prisma.Decimal(0.0);

      const discountAmount = new Prisma.Decimal(0.0);
      const totalAmount = subtotal.add(deliveryFee).sub(discountAmount);

      // 6. Generate deterministic unique order identifier
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;

      // 7. Create Order & OrderItem records
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          pharmacyId: input.pharmacyId,
          deliveryAddressId,
          orderStatus: OrderStatus.PENDING,
          fulfillmentType: input.fulfillmentType,
          subtotal,
          deliveryFee,
          discountAmount,
          totalAmount,
          customerNote: input.customerNote || null,
          items: {
            create: allocatedItems.map((item) => ({
              pharmacyMedicineId: item.pharmacyMedicineId,
              inventoryBatchId: item.inventoryBatchId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: {
          pharmacy: true,
          deliveryAddress: true,
          customer: {
            include: { profile: true },
          },
          items: {
            include: {
              pharmacyMedicine: {
                include: { medicine: true },
              },
            },
          },
        },
      });

      // 8. Create Delivery record for Home Delivery tracking
      if (input.fulfillmentType === FulfillmentType.HOME_DELIVERY) {
        await tx.delivery.create({
          data: {
            orderId: createdOrder.id,
            status: "PENDING",
          },
        });
      }

      // 9. Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: customerId,
          action: "ORDER_CREATED",
          entity: "Order",
          entityId: createdOrder.id,
          metadata: JSON.parse(
            JSON.stringify({
              orderNumber: createdOrder.orderNumber,
              pharmacyId: input.pharmacyId,
              fulfillmentType: input.fulfillmentType,
              totalAmount: Number(totalAmount),
              itemsCount: allocatedItems.length,
            })
          ),
        },
      });

      return formatOrderResponse(createdOrder);
    });
  }

  /**
   * 2. List customer orders with pagination
   */
  static async getCustomerOrders(customerId: string, params: OrderFilterParams) {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { customerId };
    if (status && status !== "all") {
      where.orderStatus = status as OrderStatus;
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          pharmacy: true,
          deliveryAddress: true,
          items: {
            include: {
              pharmacyMedicine: {
                include: { medicine: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: orders.map(formatOrderResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 3. Get single customer order details
   */
  static async getCustomerOrderById(customerId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        pharmacy: true,
        deliveryAddress: true,
        items: {
          include: {
            pharmacyMedicine: {
              include: { medicine: true },
            },
          },
        },
      },
    });

    if (!order || order.customerId !== customerId) {
      notFoundError("Order");
    }

    return formatOrderResponse(order);
  }

  /**
   * 4. List orders for a specific pharmacy
   */
  static async getPharmacyOrders(pharmacyId: string, params: OrderFilterParams) {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { pharmacyId };
    if (status && status !== "all") {
      where.orderStatus = status as OrderStatus;
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          pharmacy: true,
          deliveryAddress: true,
          customer: {
            include: { profile: true },
          },
          items: {
            include: {
              pharmacyMedicine: {
                include: { medicine: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: orders.map(formatOrderResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 5. Get single pharmacy order details
   */
  static async getPharmacyOrderById(pharmacyId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        pharmacy: true,
        deliveryAddress: true,
        customer: {
          include: { profile: true },
        },
        items: {
          include: {
            pharmacyMedicine: {
              include: { medicine: true },
            },
          },
        },
      },
    });

    if (!order || order.pharmacyId !== pharmacyId) {
      notFoundError("Order");
    }

    return formatOrderResponse(order);
  }

  /**
   * 6. Accept a PENDING order
   */
  static async acceptOrder(pharmacyId: string, orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.pharmacyId !== pharmacyId) {
      notFoundError("Order");
    }

    if (order.orderStatus !== OrderStatus.PENDING) {
      badRequestError(
        `Cannot accept order with status "${order.orderStatus}". Only PENDING orders can be accepted.`
      );
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: OrderStatus.ACCEPTED,
      },
      include: {
        pharmacy: true,
        deliveryAddress: true,
        customer: {
          include: { profile: true },
        },
        items: {
          include: {
            pharmacyMedicine: {
              include: { medicine: true },
            },
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: "ORDER_ACCEPTED",
        entity: "Order",
        entityId: orderId,
        metadata: {
          orderNumber: order.orderNumber,
          previousStatus: order.orderStatus,
          newStatus: OrderStatus.ACCEPTED,
        },
      },
    });

    return formatOrderResponse(updated);
  }

  /**
   * 7. Reject a PENDING order and atomically release reserved inventory stock.
   */
  static async rejectOrder(pharmacyId: string, orderId: string, reason: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order || order.pharmacyId !== pharmacyId) {
        notFoundError("Order");
      }

      if (order.orderStatus !== OrderStatus.PENDING) {
        badRequestError(
          `Cannot reject order with status "${order.orderStatus}". Only PENDING orders can be rejected.`
        );
      }

      // 1. Release reserved stock back into available inventory
      await InventoryReservationService.releaseReservedStock(
        tx,
        order.items.map((i) => ({
          inventoryBatchId: i.inventoryBatchId,
          quantity: i.quantity,
        }))
      );

      // 2. Transition order status to REJECTED and store rejection reason
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: OrderStatus.REJECTED,
          cancellationReason: reason,
        },
        include: {
          pharmacy: true,
          deliveryAddress: true,
          customer: {
            include: { profile: true },
          },
          items: {
            include: {
              pharmacyMedicine: {
                include: { medicine: true },
              },
            },
          },
        },
      });

      // 3. Record audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: "ORDER_REJECTED",
          entity: "Order",
          entityId: orderId,
          metadata: {
            orderNumber: order.orderNumber,
            reason,
            releasedItemsCount: order.items.length,
          },
        },
      });

      return {
        order: formatOrderResponse(updated),
        message: "Order rejected successfully. Reserved stock released back to available inventory.",
      };
    });
  }

  /**
   * 8. Mark order as PREPARING (ACCEPTED -> PREPARING)
   */
  static async markPreparing(pharmacyId: string, orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.pharmacyId !== pharmacyId) {
      notFoundError("Order");
    }

    if (order.orderStatus !== OrderStatus.ACCEPTED) {
      badRequestError(
        `Cannot mark order as preparing from status "${order.orderStatus}". Allowed transition is ACCEPTED -> PREPARING.`
      );
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: OrderStatus.PREPARING,
      },
      include: {
        pharmacy: true,
        deliveryAddress: true,
        customer: {
          include: { profile: true },
        },
        items: {
          include: {
            pharmacyMedicine: {
              include: { medicine: true },
            },
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: "ORDER_PREPARING",
        entity: "Order",
        entityId: orderId,
        metadata: {
          orderNumber: order.orderNumber,
          newStatus: OrderStatus.PREPARING,
        },
      },
    });

    return formatOrderResponse(updated);
  }

  /**
   * 9. Mark order as READY_FOR_PICKUP (PREPARING -> READY_FOR_PICKUP)
   */
  static async markReady(pharmacyId: string, orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.pharmacyId !== pharmacyId) {
      notFoundError("Order");
    }

    if (order.orderStatus !== OrderStatus.PREPARING) {
      badRequestError(
        `Cannot mark order as ready from status "${order.orderStatus}". Allowed transition is PREPARING -> READY_FOR_PICKUP.`
      );
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: OrderStatus.READY_FOR_PICKUP,
      },
      include: {
        pharmacy: true,
        deliveryAddress: true,
        customer: {
          include: { profile: true },
        },
        items: {
          include: {
            pharmacyMedicine: {
              include: { medicine: true },
            },
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: "ORDER_READY",
        entity: "Order",
        entityId: orderId,
        metadata: {
          orderNumber: order.orderNumber,
          newStatus: OrderStatus.READY_FOR_PICKUP,
        },
      },
    });

    return formatOrderResponse(updated);
  }
}
