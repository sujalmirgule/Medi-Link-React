import { UserRole } from "@prisma/client";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
  iss?: string;
}

export interface SafeUser {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  profile?: {
    firstName: string;
    lastName: string;
  } | null;
  pharmacy?: {
    id: string;
    name: string;
    licenseNumber: string;
    isVerified: boolean;
  } | null;
  deliveryPartner?: {
    id: string;
    isVerified: boolean;
    isAvailable: boolean;
  } | null;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role?: "CUSTOMER" | "PHARMACY" | "DELIVERY_PARTNER";
  // Pharmacy optional fields
  pharmacyName?: string;
  licenseNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
