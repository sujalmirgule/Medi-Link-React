import { z } from "zod";

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 10)) : 10)),
});

export const verificationFilterSchema = paginationSchema.extend({
  role: z.enum(["PHARMACY", "DELIVERY_PARTNER", "all"]).optional().default("all"),
  status: z.enum(["PENDING", "VERIFIED", "REJECTED", "all"]).optional().default("all"),
  search: z.string().trim().optional(),
});

export const userFilterSchema = paginationSchema.extend({
  role: z.enum(["CUSTOMER", "PHARMACY", "DELIVERY_PARTNER", "ADMIN", "all"]).optional().default("all"),
  verificationStatus: z.enum(["NOT_REQUIRED", "PENDING", "VERIFIED", "REJECTED", "all"]).optional().default("all"),
  isActive: z.enum(["true", "false", "all"]).optional().default("all"),
  search: z.string().trim().optional(),
});

export const userStatusUpdateSchema = z.object({
  isActive: z.boolean({ required_error: "isActive boolean is required" }),
});

export const pharmacyFilterSchema = paginationSchema.extend({
  isVerified: z.enum(["true", "false", "all"]).optional().default("all"),
  isActive: z.enum(["true", "false", "all"]).optional().default("all"),
  search: z.string().trim().optional(),
});

export const deliveryPartnerFilterSchema = paginationSchema.extend({
  isVerified: z.enum(["true", "false", "all"]).optional().default("all"),
  isActive: z.enum(["true", "false", "all"]).optional().default("all"),
  isAvailable: z.enum(["true", "false", "all"]).optional().default("all"),
  search: z.string().trim().optional(),
});

export const auditLogFilterSchema = paginationSchema.extend({
  action: z.string().trim().optional(),
  entity: z.string().trim().optional(),
  search: z.string().trim().optional(),
});
