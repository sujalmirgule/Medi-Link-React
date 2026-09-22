import { z } from "zod";
import { DiscountType } from "@prisma/client";

export const createDiscountSchema = z
  .object({
    code: z
      .string({ required_error: "Coupon code is required" })
      .trim()
      .min(3, "Coupon code must be at least 3 characters")
      .max(20, "Coupon code cannot exceed 20 characters")
      .regex(/^[A-Za-z0-9_-]+$/, "Coupon code must contain only letters, numbers, hyphens, and underscores")
      .transform((val) => val.toUpperCase()),
    type: z.nativeEnum(DiscountType, {
      errorMap: () => ({ message: "Discount type must be PERCENTAGE or FIXED" }),
    }),
    value: z
      .number({ required_error: "Discount value is required", invalid_type_error: "Discount value must be a number" })
      .positive("Discount value must be greater than 0"),
    maxDiscount: z
      .number({ invalid_type_error: "Max discount must be a number" })
      .positive("Max discount must be greater than 0")
      .nullable()
      .optional(),
    minimumOrderAmount: z
      .number({ invalid_type_error: "Minimum order amount must be a number" })
      .positive("Minimum order amount must be greater than 0")
      .nullable()
      .optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    isActive: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.type === DiscountType.PERCENTAGE && data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Percentage discount value cannot exceed 100%",
      });
    }

    if (data.startsAt && data.endsAt && new Date(data.endsAt) <= new Date(data.startsAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "End date must be after start date",
      });
    }
  });

export const updateDiscountSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Coupon code must be at least 3 characters")
      .max(20, "Coupon code cannot exceed 20 characters")
      .regex(/^[A-Za-z0-9_-]+$/, "Coupon code must contain only letters, numbers, hyphens, and underscores")
      .transform((val) => val.toUpperCase())
      .optional(),
    type: z.nativeEnum(DiscountType).optional(),
    value: z.number().positive("Discount value must be greater than 0").optional(),
    maxDiscount: z.number().positive().nullable().optional(),
    minimumOrderAmount: z.number().positive().nullable().optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === DiscountType.PERCENTAGE && data.value !== undefined && data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Percentage discount value cannot exceed 100%",
      });
    }

    if (data.startsAt && data.endsAt && new Date(data.endsAt) <= new Date(data.startsAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "End date must be after start date",
      });
    }
  });

export const discountFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  type: z.nativeEnum(DiscountType).optional(),
});

export const previewDiscountSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required"),
  subtotal: z.number({ invalid_type_error: "Subtotal must be a number" }).positive("Subtotal must be greater than 0"),
});
