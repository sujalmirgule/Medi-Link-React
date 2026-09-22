import { DeliveryStatus } from "@prisma/client";

export interface DeliveryDetails {
  orderId: string;
  pickupAddress: {
    name: string;
    line1: string;
    city: string;
    pincode: string;
    phone: string;
  };
  deliveryAddress: {
    line1: string;
    city: string;
    pincode: string;
    contactPhone?: string;
  };
  totalAmount: number;
}

export interface DeliveryProviderResult {
  success: boolean;
  deliveryId?: string;
  status?: DeliveryStatus;
  message?: string;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
}

/**
 * Common abstraction for MediLink delivery providers.
 * Supports INTERNAL (MediLink Delivery Partners) and prepared for future THIRD_PARTY integrations.
 */
export interface IDeliveryProvider {
  readonly providerName: string;

  /**
   * Initialize a delivery for an eligible order
   */
  createDelivery(details: DeliveryDetails): Promise<DeliveryProviderResult>;

  /**
   * Assign a delivery partner to the delivery
   */
  assignDelivery(deliveryId: string, partnerId: string): Promise<DeliveryProviderResult>;

  /**
   * Cancel or decline a delivery
   */
  cancelDelivery(deliveryId: string, reason: string): Promise<DeliveryProviderResult>;

  /**
   * Retrieve current delivery status
   */
  getDeliveryStatus(deliveryId: string): Promise<DeliveryProviderResult>;

  /**
   * Update delivery GPS coordinates
   */
  updateLocation(
    deliveryId: string,
    latitude: number,
    longitude: number
  ): Promise<DeliveryProviderResult>;
}
