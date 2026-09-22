import { UserRole, VerificationStatus } from "@prisma/client";

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
  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
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

export interface CustomerRegisterInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface PharmacyRegisterInput {
  pharmacyName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  licenseNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface DeliveryPartnerRegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface RegisterInput extends CustomerRegisterInput {
  role?: "CUSTOMER" | "PHARMACY" | "DELIVERY_PARTNER";
  pharmacyName?: string;
  ownerName?: string;
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

export interface RejectVerificationInput {
  reason: string;
}
