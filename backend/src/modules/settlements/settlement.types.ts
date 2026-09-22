import { SettlementStatus } from "@prisma/client";

export interface SettlementFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  pharmacyId?: string;
  search?: string;
}

export interface SettlementFormatted {
  id: string;
  orderId: string;
  pharmacyId: string;
  paymentId: string | null;
  amount: number;
  status: SettlementStatus;
  failureReason: string | null;
  settledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  order?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    orderStatus: string;
    fulfillmentType: string;
    createdAt: Date;
  };
  pharmacy?: {
    id: string;
    name: string;
    city: string;
    phone: string;
  };
  payment?: {
    id: string;
    method: string;
    status: string;
    transactionReference: string | null;
    paidAt: Date | null;
  } | null;
}
