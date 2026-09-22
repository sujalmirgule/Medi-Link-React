import { prisma } from "../../../lib/prisma";
import { DeliveryStatus } from "@prisma/client";
import {
  IDeliveryProvider,
  DeliveryDetails,
  DeliveryProviderResult,
} from "./delivery-provider.interface";

export class InternalDeliveryProvider implements IDeliveryProvider {
  readonly providerName = "INTERNAL";

  async createDelivery(details: DeliveryDetails): Promise<DeliveryProviderResult> {
    const delivery = await prisma.delivery.upsert({
      where: { orderId: details.orderId },
      create: {
        orderId: details.orderId,
        provider: this.providerName,
        status: DeliveryStatus.PENDING,
      },
      update: {
        provider: this.providerName,
      },
    });

    return {
      success: true,
      deliveryId: delivery.id,
      status: delivery.status,
    };
  }

  async assignDelivery(deliveryId: string, partnerId: string): Promise<DeliveryProviderResult> {
    const delivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        deliveryPartnerId: partnerId,
        status: DeliveryStatus.ASSIGNED,
      },
    });

    return {
      success: true,
      deliveryId: delivery.id,
      status: delivery.status,
    };
  }

  async cancelDelivery(deliveryId: string, reason: string): Promise<DeliveryProviderResult> {
    const delivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: DeliveryStatus.FAILED,
      },
    });

    await prisma.deliveryEvent.create({
      data: {
        deliveryId,
        status: DeliveryStatus.FAILED,
        note: `Cancelled: ${reason}`,
      },
    });

    return {
      success: true,
      deliveryId: delivery.id,
      status: delivery.status,
    };
  }

  async getDeliveryStatus(deliveryId: string): Promise<DeliveryProviderResult> {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      return { success: false, message: "Delivery not found" };
    }

    return {
      success: true,
      deliveryId: delivery.id,
      status: delivery.status,
      currentLatitude: delivery.currentLatitude,
      currentLongitude: delivery.currentLongitude,
    };
  }

  async updateLocation(
    deliveryId: string,
    latitude: number,
    longitude: number
  ): Promise<DeliveryProviderResult> {
    const delivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationAt: new Date(),
      },
    });

    return {
      success: true,
      deliveryId: delivery.id,
      currentLatitude: delivery.currentLatitude,
      currentLongitude: delivery.currentLongitude,
    };
  }
}
