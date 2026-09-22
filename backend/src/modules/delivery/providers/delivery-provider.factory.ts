import { IDeliveryProvider } from "./delivery-provider.interface";
import { InternalDeliveryProvider } from "./internal-delivery.provider";

export class DeliveryProviderFactory {
  private static internalProvider = new InternalDeliveryProvider();

  static getProvider(providerType: string = "INTERNAL"): IDeliveryProvider {
    switch (providerType.toUpperCase()) {
      case "INTERNAL":
      default:
        return this.internalProvider;
    }
  }
}
