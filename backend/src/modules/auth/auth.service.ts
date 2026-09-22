import { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import { AuthResponse, LoginInput, RegisterInput, SafeUser } from "./auth.types";

export class AuthService {
  /**
   * Register a new user with transactional profile creation.
   */
  static async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (existingUser) {
      const error: any = new Error("An account with this email already exists");
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await PasswordService.hashPassword(input.password);
    const role = (input.role || "CUSTOMER") as UserRole;

    // Split name into first and last
    const nameParts = input.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    // Use Prisma transaction for atomic account + role entity creation
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase().trim(),
          phone: input.phone?.trim() || null,
          passwordHash,
          role,
          isActive: true,
        },
      });

      if (role === UserRole.CUSTOMER) {
        await tx.customerProfile.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
          },
        });
      } else if (role === UserRole.PHARMACY) {
        await tx.pharmacy.create({
          data: {
            ownerUserId: user.id,
            name: input.pharmacyName?.trim() || `${input.fullName}'s Pharmacy`,
            licenseNumber:
              input.licenseNumber?.trim() ||
              `LIC-PENDING-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            phone: input.phone?.trim() || "N/A",
            email: input.email.toLowerCase().trim(),
            address: input.address?.trim() || "Registration Address Pending",
            city: input.city?.trim() || "Mumbai",
            state: input.state?.trim() || "Maharashtra",
            pincode: input.pincode?.trim() || "400001",
            isVerified: false,
            isActive: true,
          },
        });
      } else if (role === UserRole.DELIVERY_PARTNER) {
        await tx.deliveryPartner.create({
          data: {
            userId: user.id,
            phone: input.phone?.trim() || "N/A",
            isVerified: false,
            isAvailable: false,
            isActive: true,
          },
        });
      }

      return user;
    });

    // Load newly created user with relational details
    const fullUser = await this.getMe(newUser.id);
    const token = TokenService.signToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      user: fullUser,
      token,
    };
  }

  /**
   * Authenticate user credentials and return JWT.
   */
  static async login(input: LoginInput): Promise<AuthResponse> {
    const identifier = input.email.trim().toLowerCase();

    // Query user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!user) {
      const error: any = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error: any = new Error("Your account has been deactivated. Please contact support.");
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await PasswordService.comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      const error: any = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const safeUser = await this.getMe(user.id);
    const token = TokenService.signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: safeUser,
      token,
    };
  }

  /**
   * Fetch safe authenticated user profile by user ID.
   */
  static async getMe(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        ownedPharmacies: true,
        deliveryPartner: true,
      },
    });

    if (!user || !user.isActive) {
      const error: any = new Error("User not found or account is inactive");
      error.statusCode = 401;
      throw error;
    }

    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      profile: user.profile
        ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
          }
        : null,
      pharmacy: user.ownedPharmacies[0]
        ? {
            id: user.ownedPharmacies[0].id,
            name: user.ownedPharmacies[0].name,
            licenseNumber: user.ownedPharmacies[0].licenseNumber,
            isVerified: user.ownedPharmacies[0].isVerified,
          }
        : null,
      deliveryPartner: user.deliveryPartner
        ? {
            id: user.deliveryPartner.id,
            isVerified: user.deliveryPartner.isVerified,
            isAvailable: user.deliveryPartner.isAvailable,
          }
        : null,
    };

    return safeUser;
  }
}
