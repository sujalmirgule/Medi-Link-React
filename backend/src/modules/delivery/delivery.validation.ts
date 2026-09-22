import { z } from "zod";

export const availabilitySchema = z.object({
  isAvailable: z.boolean({
    required_error: "isAvailable boolean is required",
  }),
});

export const assignDeliverySchema = z.object({
  deliveryPartnerId: z.string().uuid("Invalid delivery partner ID format"),
});

export const completeDeliverySchema = z.object({
  otp: z
    .string({
      required_error: "Delivery verification OTP is required",
    })
    .trim()
    .min(4, "OTP must be at least 4 digits")
    .max(8, "OTP cannot exceed 8 digits"),
});

export const failDeliverySchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Failure reason must be at least 3 characters")
    .max(500, "Failure reason cannot exceed 500 characters")
    .optional(),
});

export const updateLocationSchema = z.object({
  latitude: z
    .number({
      required_error: "Latitude is required",
    })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number({
      required_error: "Longitude is required",
    })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
});

export const updateDeliveryProfileSchema = z.object({
  phone: z.string().trim().min(8, "Valid phone number required").optional(),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
});

export const assignmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  status: z.enum(["all", "pending", "active", "completed"]).default("all"),
});
