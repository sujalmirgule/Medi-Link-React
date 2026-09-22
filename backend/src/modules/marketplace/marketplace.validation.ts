import { z } from "zod";

export const medicineSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  availability: z.string().optional(),
  sortBy: z.string().optional(),
});

export const pharmacySearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  city: z.string().optional(),
});

export const addressCreateSchema = z.object({
  label: z.string().trim().min(1).default("Home"),
  addressLine1: z.string().trim().min(3, "Address line 1 must be at least 3 characters"),
  addressLine2: z.string().trim().optional().nullable(),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Pincode must be a valid 6-digit postal code"),
  isDefault: z.boolean().default(false),
});
