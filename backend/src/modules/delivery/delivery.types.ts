import { DeliveryStatus, OrderStatus, FulfillmentType } from "@prisma/client";

export interface DeliveryPartnerDashboardStats {
  verificationStatus: string;
  isVerified: boolean;
  isAvailable: boolean;
  isActive: boolean;
  activeDelivery: FormattedAssignment | null;
  pendingAssignmentsCount: number;
  completedDeliveriesCount: number;
  totalDeliveriesCount: number;
}

export interface FormattedAssignment {
  id: string;
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  deliveryStatus: DeliveryStatus;
  fulfillmentType: FulfillmentType;
  totalAmount: number;
  pickupAddress: {
    pharmacyName: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  deliveryAddress: {
    label?: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
    customerName?: string;
    customerPhone?: string | null;
  } | null;
  items: Array<{
    name: string;
    quantity: number;
    dosageForm?: string;
  }>;
  timestamps: {
    createdAt: Date;
    pickupAt?: Date | null;
    pickedUpAt?: Date | null;
    outForDeliveryAt?: Date | null;
    deliveredAt?: Date | null;
  };
  attemptCount: number;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  lastLocationAt?: Date | null;
  events?: Array<{
    id: string;
    status: DeliveryStatus;
    note?: string | null;
    createdAt: Date;
  }>;
}

export interface DeliveryPartnerProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  isVerified: boolean;
  isAvailable: boolean;
  isActive: boolean;
  verificationStatus: string;
  rejectionReason?: string | null;
  createdAt: Date;
}
