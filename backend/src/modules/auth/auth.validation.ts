import { z } from "zod";

export const customerRegisterSchema = z.object({
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
  phone: z.string().trim().optional(),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters"),
});

export const pharmacyRegisterSchema = z.object({
  pharmacyName: z
    .string({ required_error: "Pharmacy name is required" })
    .trim()
    .min(2, "Pharmacy name must be at least 2 characters")
    .max(150, "Pharmacy name cannot exceed 150 characters"),
  ownerName: z
    .string({ required_error: "Owner / contact person name is required" })
    .trim()
    .min(2, "Owner name must be at least 2 characters")
    .max(100, "Owner name cannot exceed 100 characters"),
  email: z
    .string({ required_error: "Email address is required" })
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .min(7, "Phone number must be at least 7 characters"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters"),
  licenseNumber: z
    .string({ required_error: "Pharmacy license number is required" })
    .trim()
    .min(3, "License number must be at least 3 characters"),
  address: z
    .string({ required_error: "Address is required" })
    .trim()
    .min(3, "Address must be at least 3 characters"),
  city: z
    .string({ required_error: "City is required" })
    .trim()
    .min(2, "City must be at least 2 characters"),
  state: z
    .string({ required_error: "State is required" })
    .trim()
    .min(2, "State must be at least 2 characters"),
  pincode: z
    .string({ required_error: "Pincode is required" })
    .trim()
    .min(3, "Pincode must be at least 3 characters"),
});

export const deliveryPartnerRegisterSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  email: z
    .string({ required_error: "Email address is required" })
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .min(7, "Phone number must be at least 7 characters"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters"),
  address: z
    .string({ required_error: "Address is required" })
    .trim()
    .min(3, "Address must be at least 3 characters"),
  city: z
    .string({ required_error: "City is required" })
    .trim()
    .min(2, "City must be at least 2 characters"),
  state: z
    .string({ required_error: "State is required" })
    .trim()
    .min(2, "State must be at least 2 characters"),
  pincode: z
    .string({ required_error: "Pincode is required" })
    .trim()
    .min(3, "Pincode must be at least 3 characters"),
});

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
  phone: z.string().trim().optional(),
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
  pharmacyName: z.string().trim().optional(),
  ownerName: z.string().trim().optional(),
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

export const rejectVerificationSchema = z.object({
  reason: z
    .string({ required_error: "Rejection reason is required" })
    .trim()
    .min(5, "Rejection reason must be at least 5 characters long")
    .max(500, "Rejection reason cannot exceed 500 characters"),
});
