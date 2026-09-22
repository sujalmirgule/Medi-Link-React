import { DiscountType, Prisma } from "@prisma/client";

export interface CreateDiscountInput {
  code: string;
  type: DiscountType;
  value: number;
  maxDiscount?: number | null;
  minimumOrderAmount?: number | null;
  startsAt?: Date | string;
  endsAt?: Date | string | null;
  isActive?: boolean;
}

export interface UpdateDiscountInput {
  code?: string;
  type?: DiscountType;
  value?: number;
  maxDiscount?: number | null;
  minimumOrderAmount?: number | null;
  startsAt?: Date | string;
  endsAt?: Date | string | null;
  isActive?: boolean;
}

export interface DiscountFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  type?: DiscountType;
}

export interface FormattedDiscount {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  maxDiscount: number | null;
  minimumOrderAmount: number | null;
  startsAt: Date;
  endsAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountCalculationResult {
  isValid: boolean;
  discountId: string;
  code: string;
  type: DiscountType;
  value: number;
  maxDiscount: number | null;
  minimumOrderAmount: number | null;
  discountAmount: number;
  subtotal: number;
  finalSubtotal: number;
}
