import { z } from "zod";

export const createReviewSchema = z
  .object({
    orderId: z.string().uuid("Order ID must be a valid UUID"),
    rating: z
      .number({ required_error: "Rating is required" })
      .int("Rating must be an integer")
      .min(1, "Rating must be between 1 and 5")
      .max(5, "Rating must be between 1 and 5"),
    comment: z
      .string()
      .trim()
      .max(1000, "Review comment cannot exceed 1000 characters")
      .optional()
      .nullable(),
    medicineId: z.string().uuid("Medicine ID must be a valid UUID").optional().nullable(),
    pharmacyId: z.string().uuid("Pharmacy ID must be a valid UUID").optional().nullable(),
    deliveryPartnerId: z
      .string()
      .uuid("Delivery Partner ID must be a valid UUID")
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    const targets = [data.medicineId, data.pharmacyId, data.deliveryPartnerId].filter(Boolean);
    if (targets.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You must specify exactly one review target (medicineId, pharmacyId, or deliveryPartnerId)",
        path: ["medicineId"],
      });
    } else if (targets.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You can only specify one review target per review (medicineId, pharmacyId, or deliveryPartnerId)",
        path: ["medicineId"],
      });
    }
  });

export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5")
    .optional(),
  comment: z
    .string()
    .trim()
    .max(1000, "Review comment cannot exceed 1000 characters")
    .optional()
    .nullable(),
});

export const reviewFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  medicineId: z.string().optional(),
  pharmacyId: z.string().optional(),
  deliveryPartnerId: z.string().optional(),
  customerId: z.string().optional(),
  isHidden: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  maxRating: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().optional(),
});
