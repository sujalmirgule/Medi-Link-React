import { Payment, PaymentMethod, PaymentStatus, Order } from "@prisma/client";

export interface PaymentProviderResult {
  success: boolean;
  transactionReference: string;
  provider: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  verified: boolean;
  status: PaymentStatus;
  transactionReference?: string;
  errorMessage?: string;
}

export interface PaymentRefundResult {
  success: boolean;
  refunded: boolean;
  refundReference?: string;
  errorMessage?: string;
}

export interface IPaymentProvider {
  readonly providerName: string;

  /**
   * Initialize or create a payment intent/transaction with the provider.
   */
  createPayment(
    order: Order,
    method: PaymentMethod,
    options?: Record<string, any>
  ): Promise<PaymentProviderResult>;

  /**
   * Verify an existing payment with provider credentials or simulation data.
   */
  verifyPayment(
    payment: Payment,
    verificationData?: {
      transactionReference?: string;
      simulateStatus?: "PAID" | "FAILED";
      reason?: string;
    }
  ): Promise<PaymentVerificationResult>;

  /**
   * Issue a refund for a previously paid transaction.
   */
  refundPayment(
    payment: Payment,
    reason?: string
  ): Promise<PaymentRefundResult>;
}
