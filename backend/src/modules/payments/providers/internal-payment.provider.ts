import { Payment, PaymentMethod, PaymentStatus, Order } from "@prisma/client";
import {
  IPaymentProvider,
  PaymentProviderResult,
  PaymentVerificationResult,
  PaymentRefundResult,
} from "./payment-provider.interface";

export class InternalPaymentProvider implements IPaymentProvider {
  readonly providerName: string = "INTERNAL";

  async createPayment(
    order: Order,
    method: PaymentMethod,
    _options?: Record<string, any>
  ): Promise<PaymentProviderResult> {
    if (method === PaymentMethod.COD) {
      return {
        success: true,
        provider: this.providerName,
        transactionReference: `COD-${order.orderNumber}`,
        metadata: {
          collectionMode: "CASH_ON_DELIVERY",
          currency: "INR",
          amount: Number(order.totalAmount),
        },
      };
    }

    if (method === PaymentMethod.UPI) {
      const referenceId = `UPI-SIM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        success: true,
        provider: this.providerName,
        transactionReference: referenceId,
        metadata: {
          upiVpa: "medilink.pay@hdfcbank",
          payeeName: "MediLink Pharmacy Platform",
          currency: "INR",
          amount: Number(order.totalAmount),
          note: `Prescription Order ${order.orderNumber}`,
        },
      };
    }

    return {
      success: false,
      provider: this.providerName,
      transactionReference: "",
      errorMessage: `Unsupported payment method: ${method}`,
    };
  }

  async verifyPayment(
    payment: Payment,
    verificationData?: {
      transactionReference?: string;
      simulateStatus?: "PAID" | "FAILED";
      reason?: string;
    }
  ): Promise<PaymentVerificationResult> {
    // Development / Simulation capability
    if (verificationData?.simulateStatus === "FAILED") {
      return {
        success: false,
        verified: false,
        status: PaymentStatus.FAILED,
        errorMessage: verificationData.reason || "Simulated payment failure by user or bank rejection.",
      };
    }

    const txRef =
      verificationData?.transactionReference ||
      payment.transactionReference ||
      `TXN-${payment.method}-${Date.now()}`;

    return {
      success: true,
      verified: true,
      status: PaymentStatus.PAID,
      transactionReference: txRef,
    };
  }

  async refundPayment(
    payment: Payment,
    reason?: string
  ): Promise<PaymentRefundResult> {
    const refundRef = `REFUND-${payment.id.slice(0, 8).toUpperCase()}-${Date.now()}`;
    return {
      success: true,
      refunded: true,
      refundReference: refundRef,
      errorMessage: reason ? undefined : undefined,
    };
  }
}
