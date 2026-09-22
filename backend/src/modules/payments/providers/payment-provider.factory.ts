import { IPaymentProvider } from "./payment-provider.interface";
import { InternalPaymentProvider } from "./internal-payment.provider";

export class PaymentProviderFactory {
  private static providers: Map<string, IPaymentProvider> = new Map();

  static {
    const internal = new InternalPaymentProvider();
    this.providers.set("INTERNAL", internal);
  }

  static getProvider(name?: string): IPaymentProvider {
    const key = (name || process.env.PAYMENT_PROVIDER || "INTERNAL").toUpperCase();
    const provider = this.providers.get(key);
    if (!provider) {
      // Fallback to internal provider if requested is not found
      return this.providers.get("INTERNAL")!;
    }
    return provider;
  }

  static registerProvider(name: string, provider: IPaymentProvider): void {
    this.providers.set(name.toUpperCase(), provider);
  }
}
