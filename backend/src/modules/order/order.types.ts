import { FulfillmentType, OrderStatus, Prisma } from "@prisma/client";

export interface OrderItemInput {
  pharmacyMedicineId: string;
  quantity: number;
}

export interface OrderCreateInput {
  pharmacyId: string;
  fulfillmentType: FulfillmentType;
  deliveryAddressId?: string | null;
  items: OrderItemInput[];
  customerNote?: string | null;
}

export interface OrderRejectInput {
  reason: string;
}

export interface OrderFilterParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

export interface AllocatedItem {
  pharmacyMedicineId: string;
  inventoryBatchId: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  totalPrice: Prisma.Decimal;
  medicineName: string;
}

export interface OrderResponseItem {
  id: string;
  pharmacyMedicineId: string;
  inventoryBatchId: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  medicine: {
    id: string;
    name: string;
    genericName: string;
    strength?: string;
    dosageForm?: string;
  };
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  customerId: string;
  pharmacyId: string;
  orderStatus: OrderStatus;
  fulfillmentType: FulfillmentType;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  customerNote: string | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  pharmacy: {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
  };
  deliveryAddress?: {
    id: string;
    label: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
  } | null;
  customer?: {
    id: string;
    email: string;
    phone: string | null;
    firstName?: string;
    lastName?: string;
  };
  delivery?: {
    id: string;
    status: string;
    attemptCount: number;
    pickupAt?: Date | null;
    pickedUpAt?: Date | null;
    outForDeliveryAt?: Date | null;
    deliveredAt?: Date | null;
    currentLatitude?: number | null;
    currentLongitude?: number | null;
    deliveryPartner?: {
      id: string;
      name: string;
      phone: string;
    } | null;
    events?: Array<{
      id: string;
      status: string;
      note?: string | null;
      createdAt: Date;
    }>;
  } | null;
  deliveryOtp?: string | null;
  items: OrderResponseItem[];
}
