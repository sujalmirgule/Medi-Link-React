import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import {
  DeliveryStatus,
  OrderStatus,
  FulfillmentType,
  UserRole,
  VerificationStatus,
  NotificationType,
} from "@prisma/client";
import {
  DeliveryPartnerDashboardStats,
  FormattedAssignment,
  DeliveryPartnerProfile,
} from "./delivery.types";

function badRequestError(message: string): never {
  const err: any = new Error(message);
  err.status = 400;
  err.statusCode = 400;
  throw err;
}

function forbiddenError(message: string): never {
  const err: any = new Error(message);
  err.status = 403;
  err.statusCode = 403;
  throw err;
}

function notFoundError(entity: string = "Resource"): never {
  const err: any = new Error(`${entity} not found`);
  err.status = 404;
  err.statusCode = 404;
  throw err;
}

function formatAssignment(delivery: any): FormattedAssignment {
  return {
    id: delivery.id,
    orderId: delivery.orderId,
    orderNumber: delivery.order.orderNumber,
    orderStatus: delivery.order.orderStatus,
    deliveryStatus: delivery.status,
    fulfillmentType: delivery.order.fulfillmentType,
    totalAmount: Number(delivery.order.totalAmount),
    pickupAddress: {
      pharmacyName: delivery.order.pharmacy.name,
      line1: delivery.order.pharmacy.address || "Pharmacy Address",
      city: delivery.order.pharmacy.city,
      state: delivery.order.pharmacy.state,
      pincode: delivery.order.pharmacy.pincode,
      phone: delivery.order.pharmacy.phone,
    },
    deliveryAddress: delivery.order.deliveryAddress
      ? {
          label: delivery.order.deliveryAddress.label,
          line1: delivery.order.deliveryAddress.addressLine1,
          line2: delivery.order.deliveryAddress.addressLine2,
          city: delivery.order.deliveryAddress.city,
          state: delivery.order.deliveryAddress.state,
          pincode: delivery.order.deliveryAddress.pincode,
          customerName: delivery.order.customer?.profile
            ? `${delivery.order.customer.profile.firstName} ${delivery.order.customer.profile.lastName}`
            : delivery.order.customer?.email,
          customerPhone: delivery.order.customer?.phone,
        }
      : null,
    items: (delivery.order.items || []).map((item: any) => ({
      name: item.pharmacyMedicine?.medicine?.name || "Medicine",
      quantity: item.quantity,
      dosageForm: item.pharmacyMedicine?.medicine?.dosageForm,
    })),
    timestamps: {
      createdAt: delivery.createdAt,
      pickupAt: delivery.pickupAt,
      pickedUpAt: delivery.pickedUpAt,
      outForDeliveryAt: delivery.outForDeliveryAt,
      deliveredAt: delivery.deliveredAt,
    },
    attemptCount: delivery.attemptCount,
    currentLatitude: delivery.currentLatitude,
    currentLongitude: delivery.currentLongitude,
    lastLocationAt: delivery.lastLocationAt,
    events: (delivery.events || []).map((event: any) => ({
      id: event.id,
      status: event.status,
      note: event.note,
      createdAt: event.createdAt,
    })),
  };
}

export class DeliveryService {
  /**
   * Helper to retrieve and validate the delivery partner record for a user.
   */
  private static async getPartnerByUserId(userId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    if (!partner) {
      notFoundError("Delivery partner account");
    }

    return partner;
  }

  /**
   * 1. Toggle Partner Availability (PATCH /delivery/availability)
   * Only VERIFIED and ACTIVE delivery partners can toggle availability.
   */
  static async updateAvailability(userId: string, isAvailable: boolean) {
    const partner = await this.getPartnerByUserId(userId);

    if (partner.user.verificationStatus !== VerificationStatus.VERIFIED || !partner.isVerified) {
      forbiddenError(
        "Delivery partner verification is required to update availability. Unverified partners cannot accept orders."
      );
    }

    if (!partner.isActive || !partner.user.isActive) {
      forbiddenError("Inactive delivery partners cannot update availability.");
    }

    const updated = await prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: { isAvailable },
    });

    return {
      success: true,
      isAvailable: updated.isAvailable,
      message: updated.isAvailable
        ? "You are now online and available for order deliveries."
        : "You are now offline.",
    };
  }

  /**
   * 2. Partner Dashboard Statistics (GET /delivery/dashboard)
   */
  static async getDashboardStats(userId: string): Promise<DeliveryPartnerDashboardStats> {
    const partner = await this.getPartnerByUserId(userId);

    // Active delivery currently in progress
    const activeDeliveryRecord = await prisma.delivery.findFirst({
      where: {
        deliveryPartnerId: partner.id,
        status: {
          in: [
            DeliveryStatus.ASSIGNED,
            DeliveryStatus.PICKED_UP,
            DeliveryStatus.OUT_FOR_DELIVERY,
          ],
        },
      },
      include: {
        order: {
          include: {
            pharmacy: true,
            deliveryAddress: true,
            customer: { include: { profile: true } },
            items: { include: { pharmacyMedicine: { include: { medicine: true } } } },
          },
        },
        events: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const [pendingCount, completedCount, totalCount] = await Promise.all([
      prisma.delivery.count({
        where: {
          deliveryPartnerId: partner.id,
          status: DeliveryStatus.ASSIGNED,
        },
      }),
      prisma.delivery.count({
        where: {
          deliveryPartnerId: partner.id,
          status: DeliveryStatus.DELIVERED,
        },
      }),
      prisma.delivery.count({
        where: {
          deliveryPartnerId: partner.id,
        },
      }),
    ]);

    return {
      verificationStatus: partner.user.verificationStatus,
      isVerified: partner.isVerified,
      isAvailable: partner.isAvailable,
      isActive: partner.isActive,
      activeDelivery: activeDeliveryRecord ? formatAssignment(activeDeliveryRecord) : null,
      pendingAssignmentsCount: pendingCount,
      completedDeliveriesCount: completedCount,
      totalDeliveriesCount: totalCount,
    };
  }

  /**
   * 3. Get Partner Assignments (GET /delivery/assignments)
   */
  static async getAssignments(userId: string, params: { page?: number; limit?: number; status?: string }) {
    const partner = await this.getPartnerByUserId(userId);
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deliveryPartnerId: partner.id,
    };

    if (params.status === "pending") {
      where.status = DeliveryStatus.ASSIGNED;
    } else if (params.status === "active") {
      where.status = {
        in: [
          DeliveryStatus.ASSIGNED,
          DeliveryStatus.PICKED_UP,
          DeliveryStatus.OUT_FOR_DELIVERY,
        ],
      };
    } else if (params.status === "completed") {
      where.status = {
        in: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED],
      };
    }

    const [total, records] = await Promise.all([
      prisma.delivery.count({ where }),
      prisma.delivery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            include: {
              pharmacy: true,
              deliveryAddress: true,
              customer: { include: { profile: true } },
              items: { include: { pharmacyMedicine: { include: { medicine: true } } } },
            },
          },
          events: { orderBy: { createdAt: "asc" } },
        },
      }),
    ]);

    return {
      items: records.map(formatAssignment),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 4. Get Single Assignment By ID (GET /delivery/assignments/:id)
   * Strictly verifies delivery partner ownership.
   */
  static async getAssignmentById(userId: string, deliveryId: string) {
    const partner = await this.getPartnerByUserId(userId);

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: {
            pharmacy: true,
            deliveryAddress: true,
            customer: { include: { profile: true } },
            items: { include: { pharmacyMedicine: { include: { medicine: true } } } },
          },
        },
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!delivery) {
      notFoundError("Delivery assignment");
    }

    if (delivery.deliveryPartnerId !== partner.id) {
      notFoundError("Delivery assignment");
    }

    return formatAssignment(delivery);
  }

  /**
   * 5. Accept Assignment (POST /delivery/assignments/:id/accept)
   */
  static async acceptAssignment(userId: string, deliveryId: string) {
    const partner = await this.getPartnerByUserId(userId);

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!delivery || delivery.deliveryPartnerId !== partner.id) {
      notFoundError("Delivery assignment");
    }

    if (delivery.status !== DeliveryStatus.ASSIGNED) {
      badRequestError(
        `Cannot accept assignment in status "${delivery.status}". Only ASSIGNED deliveries can be accepted.`
      );
    }

    await prisma.deliveryEvent.create({
      data: {
        deliveryId,
        status: DeliveryStatus.ASSIGNED,
        note: "Delivery partner accepted assignment and is heading to the pharmacy.",
      },
    });

    return this.getAssignmentById(userId, deliveryId);
  }

  /**
   * 6. Pick Up Order from Pharmacy (POST /delivery/assignments/:id/pickup)
   * Transitions: ASSIGNED -> PICKED_UP
   */
  static async pickupAssignment(userId: string, deliveryId: string) {
    const partner = await this.getPartnerByUserId(userId);

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!delivery || delivery.deliveryPartnerId !== partner.id) {
      notFoundError("Delivery assignment");
    }

    if (delivery.status !== DeliveryStatus.ASSIGNED) {
      badRequestError(
        `Cannot pick up package from status "${delivery.status}". Allowed transition is ASSIGNED -> PICKED_UP.`
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: DeliveryStatus.PICKED_UP,
          pickedUpAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: delivery.orderId },
        data: {
          orderStatus: OrderStatus.PICKED_UP,
        },
      });

      await tx.deliveryEvent.create({
        data: {
          deliveryId,
          status: DeliveryStatus.PICKED_UP,
          note: "Package picked up from pharmacy by delivery partner.",
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "DELIVERY_PICKED_UP",
          entity: "Delivery",
          entityId: deliveryId,
          metadata: {
            orderNumber: delivery.order.orderNumber,
            deliveryPartnerId: partner.id,
          },
        },
      });
    });

    return this.getAssignmentById(userId, deliveryId);
  }

  /**
   * 7. Out For Delivery (POST /delivery/assignments/:id/out-for-delivery)
   * Transitions: PICKED_UP -> OUT_FOR_DELIVERY
   * Generates secure 6-digit OTP, hashes it with SHA-256 into deliveryOtpHash,
   * dispatches customer notification with OTP.
   */
  static async outForDelivery(userId: string, deliveryId: string) {
    const partner = await this.getPartnerByUserId(userId);

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!delivery || delivery.deliveryPartnerId !== partner.id) {
      notFoundError("Delivery assignment");
    }

    if (delivery.status !== DeliveryStatus.PICKED_UP) {
      badRequestError(
        `Cannot start delivery transit from status "${delivery.status}". Allowed transition is PICKED_UP -> OUT_FOR_DELIVERY.`
      );
    }

    // Generate 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(rawOtp).digest("hex");

    await prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: DeliveryStatus.OUT_FOR_DELIVERY,
          outForDeliveryAt: new Date(),
          deliveryOtpHash: hashedOtp,
        },
      });

      await tx.order.update({
        where: { id: delivery.orderId },
        data: {
          orderStatus: OrderStatus.OUT_FOR_DELIVERY,
        },
      });

      await tx.deliveryEvent.create({
        data: {
          deliveryId,
          status: DeliveryStatus.OUT_FOR_DELIVERY,
          note: "Delivery partner is out for delivery with your package.",
        },
      });

      // Dispatches customer notification containing plaintext OTP
      await tx.notification.create({
        data: {
          userId: delivery.order.customerId,
          type: NotificationType.DELIVERY_UPDATE,
          title: "Delivery Verification OTP",
          message: `Your MediLink delivery verification OTP for order ${delivery.order.orderNumber} is ${rawOtp}. Share this OTP with your delivery partner upon package arrival.`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "DELIVERY_OUT_FOR_DELIVERY",
          entity: "Delivery",
          entityId: deliveryId,
          metadata: {
            orderNumber: delivery.order.orderNumber,
            deliveryPartnerId: partner.id,
          },
        },
      });
    });

    return this.getAssignmentById(userId, deliveryId);
  }

  /**
   * 8. Complete Delivery via OTP (POST /delivery/assignments/:id/complete)
   * Validates delivery is OUT_FOR_DELIVERY, matches SHA-256 OTP, verifies expiration (60 min),
   * sets Delivery -> DELIVERED, Order -> DELIVERED, clears OTP hash to prevent reuse.
   */
  static async completeDelivery(userId: string, deliveryId: string, inputOtp: string) {
    const partner = await this.getPartnerByUserId(userId);

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!delivery || delivery.deliveryPartnerId !== partner.id) {
      notFoundError("Delivery assignment");
    }

    if (delivery.status !== DeliveryStatus.OUT_FOR_DELIVERY) {
      badRequestError(
        `Cannot complete delivery from status "${delivery.status}". Delivery must be OUT_FOR_DELIVERY.`
      );
    }

    if (!delivery.deliveryOtpHash) {
      badRequestError("Invalid or expired delivery OTP.");
    }

    // Expiration check: OTP valid for 60 minutes from outForDeliveryAt
    if (delivery.outForDeliveryAt) {
      const elapsed = Date.now() - new Date(delivery.outForDeliveryAt).getTime();
      if (elapsed > 60 * 60 * 1000) {
        badRequestError("Invalid or expired delivery OTP.");
      }
    }

    // Compare hash
    const inputHash = crypto.createHash("sha256").update(inputOtp.trim()).digest("hex");
    if (inputHash !== delivery.deliveryOtpHash) {
      badRequestError("Invalid or expired delivery OTP.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: DeliveryStatus.DELIVERED,
          deliveredAt: new Date(),
          deliveryOtpHash: null, // Invalidate to prevent replay
        },
      });

      await tx.order.update({
        where: { id: delivery.orderId },
        data: {
          orderStatus: OrderStatus.DELIVERED,
        },
      });

      await tx.deliveryEvent.create({
        data: {
          deliveryId,
          status: DeliveryStatus.DELIVERED,
          note: "Order successfully delivered to customer via OTP verification.",
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "DELIVERY_DELIVERED",
          entity: "Delivery",
          entityId: deliveryId,
          metadata: {
            orderNumber: delivery.order.orderNumber,
            deliveryPartnerId: partner.id,
          },
        },
      });
    });

    return this.getAssignmentById(userId, deliveryId);
  }

  /**
   * 9. Delivery Failure (POST /delivery/assignments/:id/fail)
   * Safely marks Delivery as FAILED and increments attempt count.
   * Does NOT cancel the order (remains in non-terminal state for retry/admin action).
   */
  static async failDelivery(userId: string, deliveryId: string, reason?: string) {
    const partner = await this.getPartnerByUserId(userId);

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!delivery || delivery.deliveryPartnerId !== partner.id) {
      notFoundError("Delivery assignment");
    }

    if (
      delivery.status !== DeliveryStatus.ASSIGNED &&
      delivery.status !== DeliveryStatus.PICKED_UP &&
      delivery.status !== DeliveryStatus.OUT_FOR_DELIVERY
    ) {
      badRequestError(`Cannot fail delivery from status "${delivery.status}".`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: DeliveryStatus.FAILED,
          attemptCount: { increment: 1 },
          deliveryOtpHash: null,
        },
      });

      await tx.deliveryEvent.create({
        data: {
          deliveryId,
          status: DeliveryStatus.FAILED,
          note: reason ? `Delivery failed: ${reason}` : "Delivery attempt failed.",
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "DELIVERY_FAILED",
          entity: "Delivery",
          entityId: deliveryId,
          metadata: {
            orderNumber: delivery.order.orderNumber,
            deliveryPartnerId: partner.id,
            reason: reason || "Unspecified",
          },
        },
      });
    });

    return this.getAssignmentById(userId, deliveryId);
  }

  /**
   * 10. Update Live Location (PATCH /delivery/assignments/:id/location)
   */
  static async updateLocation(userId: string, deliveryId: string, latitude: number, longitude: number) {
    const partner = await this.getPartnerByUserId(userId);

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery || delivery.deliveryPartnerId !== partner.id) {
      notFoundError("Delivery assignment");
    }

    if (
      delivery.status !== DeliveryStatus.ASSIGNED &&
      delivery.status !== DeliveryStatus.PICKED_UP &&
      delivery.status !== DeliveryStatus.OUT_FOR_DELIVERY
    ) {
      badRequestError("Location can only be updated for active deliveries in progress.");
    }

    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationAt: new Date(),
      },
    });

    return {
      success: true,
      currentLatitude: updated.currentLatitude,
      currentLongitude: updated.currentLongitude,
      lastLocationAt: updated.lastLocationAt,
    };
  }

  /**
   * 11. Delivery Partner Profile (GET /delivery/profile & PATCH /delivery/profile)
   */
  static async getProfile(userId: string): Promise<DeliveryPartnerProfile> {
    const partner = await this.getPartnerByUserId(userId);
    return {
      id: partner.id,
      userId: partner.userId,
      fullName: partner.user.profile
        ? `${partner.user.profile.firstName} ${partner.user.profile.lastName}`.trim()
        : partner.user.email,
      email: partner.user.email,
      phone: partner.phone,
      isVerified: partner.isVerified,
      isAvailable: partner.isAvailable,
      isActive: partner.isActive,
      verificationStatus: partner.user.verificationStatus,
      createdAt: partner.createdAt,
    };
  }

  static async updateProfile(userId: string, data: { phone?: string; firstName?: string; lastName?: string }) {
    const partner = await this.getPartnerByUserId(userId);

    await prisma.$transaction(async (tx) => {
      if (data.phone) {
        await tx.deliveryPartner.update({
          where: { id: partner.id },
          data: { phone: data.phone.trim() },
        });
      }

      if (data.firstName !== undefined || data.lastName !== undefined) {
        await tx.customerProfile.upsert({
          where: { userId },
          create: {
            userId,
            firstName: data.firstName?.trim() || "Delivery",
            lastName: data.lastName?.trim() || "Partner",
          },
          update: {
            ...(data.firstName !== undefined ? { firstName: data.firstName.trim() } : {}),
            ...(data.lastName !== undefined ? { lastName: data.lastName.trim() } : {}),
          },
        });
      }
    });

    return this.getProfile(userId);
  }

  /**
   * 12. Admin Delivery Assignment (POST /admin/orders/:orderId/assign-delivery)
   * Validates order, partner eligibility, and records transactional assignment.
   */
  static async assignDeliveryAdmin(adminUserId: string, orderId: string, deliveryPartnerId: string) {
    // 1. Validate order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        pharmacy: true,
        delivery: true,
      },
    });

    if (!order) {
      notFoundError("Order");
    }

    if (order.fulfillmentType !== FulfillmentType.HOME_DELIVERY) {
      badRequestError("Only Home Delivery orders can be assigned a delivery partner.");
    }

    if (order.orderStatus !== OrderStatus.READY_FOR_PICKUP) {
      badRequestError(
        `Cannot assign delivery partner. Order must be in "READY_FOR_PICKUP" status, currently "${order.orderStatus}".`
      );
    }

    // 2. Validate partner
    const partner = await prisma.deliveryPartner.findUnique({
      where: { id: deliveryPartnerId },
      include: { user: true },
    });

    if (!partner || partner.user.role !== UserRole.DELIVERY_PARTNER) {
      badRequestError("Invalid delivery partner specified.");
    }

    if (!partner.isVerified || partner.user.verificationStatus !== VerificationStatus.VERIFIED) {
      badRequestError("Cannot assign unverified delivery partner.");
    }

    if (!partner.isActive || !partner.user.isActive) {
      badRequestError("Cannot assign inactive delivery partner.");
    }

    if (!partner.isAvailable) {
      badRequestError("Cannot assign delivery partner who is currently unavailable/offline.");
    }

    // 3. Incompatible active assignment check
    const activePartnerAssignment = await prisma.delivery.findFirst({
      where: {
        deliveryPartnerId: partner.id,
        status: {
          in: [
            DeliveryStatus.ASSIGNED,
            DeliveryStatus.PICKED_UP,
            DeliveryStatus.OUT_FOR_DELIVERY,
          ],
        },
      },
    });

    if (activePartnerAssignment) {
      badRequestError(
        "Delivery partner already has an active in-progress delivery assignment."
      );
    }

    // 4. Transactional Assignment
    const updatedDelivery = await prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.upsert({
        where: { orderId },
        create: {
          orderId,
          deliveryPartnerId: partner.id,
          status: DeliveryStatus.ASSIGNED,
          provider: "INTERNAL",
        },
        update: {
          deliveryPartnerId: partner.id,
          status: DeliveryStatus.ASSIGNED,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: OrderStatus.ASSIGNED,
        },
      });

      await tx.deliveryEvent.create({
        data: {
          deliveryId: delivery.id,
          status: DeliveryStatus.ASSIGNED,
          note: `Assigned to delivery partner ${partner.user.email} by Admin.`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: "DELIVERY_ASSIGNED",
          entity: "Order",
          entityId: orderId,
          metadata: {
            orderNumber: order.orderNumber,
            deliveryPartnerId: partner.id,
            deliveryId: delivery.id,
          },
        },
      });

      return delivery;
    });

    return {
      success: true,
      deliveryId: updatedDelivery.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      deliveryStatus: updatedDelivery.status,
      message: "Delivery partner assigned successfully.",
    };
  }

  /**
   * 13. Admin Deliveries List (GET /admin/deliveries)
   */
  static async listDeliveriesAdmin(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.status && params.status !== "all") {
      where.status = params.status as DeliveryStatus;
    }

    if (params.search && params.search.trim().length > 0) {
      const q = params.search.trim();
      where.OR = [
        { order: { orderNumber: { contains: q, mode: "insensitive" } } },
        { deliveryPartner: { user: { email: { contains: q, mode: "insensitive" } } } },
        { order: { pharmacy: { name: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.delivery.count({ where }),
      prisma.delivery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            include: {
              pharmacy: true,
              deliveryAddress: true,
              customer: { include: { profile: true } },
            },
          },
          deliveryPartner: {
            include: { user: { include: { profile: true } } },
          },
          events: { orderBy: { createdAt: "asc" } },
        },
      }),
    ]);

    return {
      items: items.map((d) => ({
        id: d.id,
        orderId: d.orderId,
        orderNumber: d.order.orderNumber,
        orderStatus: d.order.orderStatus,
        status: d.status,
        provider: d.provider,
        pharmacyName: d.order.pharmacy.name,
        customerName: d.order.customer?.profile
          ? `${d.order.customer.profile.firstName} ${d.order.customer.profile.lastName}`
          : d.order.customer.email,
        deliveryPartnerName: d.deliveryPartner?.user?.profile
          ? `${d.deliveryPartner.user.profile.firstName} ${d.deliveryPartner.user.profile.lastName}`
          : d.deliveryPartner?.user?.email || "Unassigned",
        deliveryPartnerPhone: d.deliveryPartner?.phone,
        totalAmount: Number(d.order.totalAmount),
        createdAt: d.createdAt,
        deliveredAt: d.deliveredAt,
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
   * 14. Admin Single Delivery Detail (GET /admin/deliveries/:id)
   */
  static async getDeliveryDetailAdmin(deliveryId: string) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: {
            pharmacy: true,
            deliveryAddress: true,
            customer: { include: { profile: true } },
            items: { include: { pharmacyMedicine: { include: { medicine: true } } } },
          },
        },
        deliveryPartner: {
          include: { user: { include: { profile: true } } },
        },
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!delivery) {
      notFoundError("Delivery");
    }

    return {
      ...formatAssignment(delivery),
      deliveryPartner: delivery.deliveryPartner
        ? {
            id: delivery.deliveryPartner.id,
            name: delivery.deliveryPartner.user?.profile
              ? `${delivery.deliveryPartner.user.profile.firstName} ${delivery.deliveryPartner.user.profile.lastName}`
              : delivery.deliveryPartner.user?.email,
            email: delivery.deliveryPartner.user?.email,
            phone: delivery.deliveryPartner.phone,
            isAvailable: delivery.deliveryPartner.isAvailable,
          }
        : null,
    };
  }

  /**
   * 15. Admin Eligible Orders for Assignment (GET /admin/orders/eligible-for-delivery)
   */
  static async getEligibleOrdersAdmin() {
    const orders = await prisma.order.findMany({
      where: {
        fulfillmentType: FulfillmentType.HOME_DELIVERY,
        orderStatus: OrderStatus.READY_FOR_PICKUP,
      },
      include: {
        pharmacy: true,
        deliveryAddress: true,
        customer: { include: { profile: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      pharmacyName: o.pharmacy.name,
      pharmacyCity: o.pharmacy.city,
      customerName: o.customer.profile
        ? `${o.customer.profile.firstName} ${o.customer.profile.lastName}`
        : o.customer.email,
      deliveryCity: o.deliveryAddress?.city || "Unknown",
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt,
    }));
  }

  /**
   * 16. Admin Eligible Delivery Partners (GET /admin/delivery-partners/eligible)
   */
  static async getEligiblePartnersAdmin() {
    const partners = await prisma.deliveryPartner.findMany({
      where: {
        isVerified: true,
        isActive: true,
        isAvailable: true,
        user: {
          verificationStatus: VerificationStatus.VERIFIED,
          isActive: true,
        },
      },
      include: {
        user: { include: { profile: true } },
        deliveries: {
          where: {
            status: {
              in: [
                DeliveryStatus.ASSIGNED,
                DeliveryStatus.PICKED_UP,
                DeliveryStatus.OUT_FOR_DELIVERY,
              ],
            },
          },
        },
      },
    });

    // Only return partners without an active assignment
    return partners
      .filter((p) => p.deliveries.length === 0)
      .map((p) => ({
        id: p.id,
        name: p.user.profile
          ? `${p.user.profile.firstName} ${p.user.profile.lastName}`
          : p.user.email,
        email: p.user.email,
        phone: p.phone,
        isAvailable: p.isAvailable,
      }));
  }
}
