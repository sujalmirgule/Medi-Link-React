import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const createPaymentSchema = z.object({
  method: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: "Payment method must be either 'UPI' or 'COD'" }),
  }),
});

export const verifyPaymentSchema = z.object({
  transactionReference: z.string().optional(),
  simulateStatus: z.enum(["PAID", "FAILED"]).optional(),
  reason: z.string().optional(),
});

export const failPaymentSchema = z.object({
  reason: z.string().min(5, "Failure reason must be at least 5 characters"),
});

export const refundPaymentSchema = z.object({
  reason: z.string().min(5, "Refund reason must be at least 5 characters").optional(),
});
