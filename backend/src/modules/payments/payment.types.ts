import { PaymentMethod, PaymentStatus } from "@prisma/client";

export interface CreatePaymentInput {
  method: PaymentMethod;
}

export interface VerifyPaymentInput {
  transactionReference?: string;
  simulateStatus?: "PAID" | "FAILED";
  reason?: string;
}

export interface FailPaymentInput {
  reason: string;
}

export interface RefundPaymentInput {
  reason?: string;
}

export interface PaymentFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  search?: string;
}

export interface FormattedPayment {
  id: string;
  orderId: string;
  orderNumber?: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  provider: string;
  transactionReference: string | null;
  failureReason: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    email: string;
    phone?: string | null;
    fullName?: string;
  };
  pharmacy?: {
    id: string;
    name: string;
    city: string;
    phone: string;
  };
  settlement?: {
    id: string;
    status: string;
    amount: number;
    settledAt: Date | null;
  } | null;
}
