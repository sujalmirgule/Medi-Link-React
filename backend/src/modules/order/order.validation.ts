import { z } from "zod";
import { FulfillmentType } from "@prisma/client";

export const orderItemInputSchema = z.object({
  pharmacyMedicineId: z.string().min(1, "Pharmacy medicine ID is required"),
  quantity: z
    .number({ invalid_type_error: "Quantity must be a number" })
    .int("Quantity must be an integer")
    .positive("Quantity must be at least 1"),
});

export const orderCreateSchema = z
  .object({
    pharmacyId: z.string().min(1, "Pharmacy ID is required"),
    fulfillmentType: z.nativeEnum(FulfillmentType, {
      errorMap: () => ({ message: "Fulfillment type must be PICKUP or HOME_DELIVERY" }),
    }),
    deliveryAddressId: z.string().nullable().optional(),
    customerNote: z.string().max(500, "Customer note cannot exceed 500 characters").nullable().optional(),
    items: z
      .array(orderItemInputSchema)
      .min(1, "Order must contain at least one medicine item"),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillmentType === FulfillmentType.HOME_DELIVERY && (!data.deliveryAddressId || !data.deliveryAddressId.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryAddressId"],
        message: "Delivery address is required for Home Delivery fulfillment",
      });
    }
  });

export const orderRejectSchema = z.object({
  reason: z
    .string({ required_error: "Rejection reason is required" })
    .trim()
    .min(3, "Rejection reason must be at least 3 characters long")
    .max(500, "Rejection reason cannot exceed 500 characters"),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.string().optional(),
  search: z.string().optional(),
});
