import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .optional(),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters"),
  role: z
    .enum(["CUSTOMER", "PHARMACY", "DELIVERY_PARTNER"], {
      errorMap: () => ({
        message: "Role must be CUSTOMER, PHARMACY, or DELIVERY_PARTNER. Public ADMIN registration is not allowed.",
      }),
    })
    .default("CUSTOMER"),
  // Optional Pharmacy registration fields
  pharmacyName: z.string().trim().optional(),
  licenseNumber: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  pincode: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email or phone number is required" })
    .trim()
    .min(1, "Email or phone cannot be empty"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password cannot be empty"),
});
