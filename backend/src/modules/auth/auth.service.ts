import { UserRole, VerificationStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import {
  AuthResponse,
  CustomerRegisterInput,
  DeliveryPartnerRegisterInput,
  LoginInput,
  PharmacyRegisterInput,
  RegisterInput,
  SafeUser,
} from "./auth.types";

export class AuthService {
  /**
   * Register a standard Customer account.
   * Customers do not require manual verification (verificationStatus: NOT_REQUIRED).
   */
  static async registerCustomer(input: CustomerRegisterInput): Promise<AuthResponse> {
    const email = input.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error: any = new Error("An account with this email already exists");
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await PasswordService.hashPassword(input.password);
    const nameParts = input.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          phone: input.phone?.trim() || null,
          passwordHash,
          role: UserRole.CUSTOMER,
          isActive: true,
          verificationStatus: VerificationStatus.NOT_REQUIRED,
        },
      });

      await tx.customerProfile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
        },
      });

      return user;
    });

    const fullUser = await this.getMe(newUser.id);
    const token = TokenService.signToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return { user: fullUser, token };
  }

  /**
   * Register a Pharmacy account.
   * Sets verificationStatus = PENDING, creates Pharmacy record, and logs VerificationRequest.
   * The pharmacy can log in immediately, but business features are guarded.
   */
  static async registerPharmacy(input: PharmacyRegisterInput): Promise<AuthResponse> {
    const email = input.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error: any = new Error("An account with this email already exists");
      error.statusCode = 409;
      throw error;
    }

    const existingLicense = await prisma.pharmacy.findUnique({
      where: { licenseNumber: input.licenseNumber.trim() },
    });

    if (existingLicense) {
      const error: any = new Error("A pharmacy with this license number already exists");
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await PasswordService.hashPassword(input.password);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          phone: input.phone.trim(),
          passwordHash,
          role: UserRole.PHARMACY,
          isActive: true,
          verificationStatus: VerificationStatus.PENDING,
        },
      });

      await tx.pharmacy.create({
        data: {
          ownerUserId: user.id,
          name: input.pharmacyName.trim(),
          licenseNumber: input.licenseNumber.trim(),
          phone: input.phone.trim(),
          email,
          address: input.address.trim(),
          city: input.city.trim(),
          state: input.state.trim(),
          pincode: input.pincode.trim(),
          isVerified: false,
          isActive: true,
        },
      });

      await tx.verificationRequest.create({
        data: {
          userId: user.id,
          role: UserRole.PHARMACY,
          status: VerificationStatus.PENDING,
          submittedData: {
            pharmacyName: input.pharmacyName.trim(),
            ownerName: input.ownerName.trim(),
            email,
            phone: input.phone.trim(),
            licenseNumber: input.licenseNumber.trim(),
            address: input.address.trim(),
            city: input.city.trim(),
            state: input.state.trim(),
            pincode: input.pincode.trim(),
          },
        },
      });

      return user;
    });

    const fullUser = await this.getMe(newUser.id);
    const token = TokenService.signToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return { user: fullUser, token };
  }

  /**
   * Register a Delivery Partner account.
   * Sets verificationStatus = PENDING, creates DeliveryPartner record, and logs VerificationRequest.
   * The driver can log in immediately, but delivery operations are guarded.
   */
  static async registerDeliveryPartner(
    input: DeliveryPartnerRegisterInput
  ): Promise<AuthResponse> {
    const email = input.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error: any = new Error("An account with this email already exists");
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await PasswordService.hashPassword(input.password);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          phone: input.phone.trim(),
          passwordHash,
          role: UserRole.DELIVERY_PARTNER,
          isActive: true,
          verificationStatus: VerificationStatus.PENDING,
        },
      });

      await tx.deliveryPartner.create({
        data: {
          userId: user.id,
          phone: input.phone.trim(),
          isVerified: false,
          isAvailable: false,
          isActive: true,
        },
      });

      await tx.verificationRequest.create({
        data: {
          userId: user.id,
          role: UserRole.DELIVERY_PARTNER,
          status: VerificationStatus.PENDING,
          submittedData: {
            fullName: input.fullName.trim(),
            email,
            phone: input.phone.trim(),
            address: input.address.trim(),
            city: input.city.trim(),
            state: input.state.trim(),
            pincode: input.pincode.trim(),
          },
        },
      });

      return user;
    });

    const fullUser = await this.getMe(newUser.id);
    const token = TokenService.signToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return { user: fullUser, token };
  }

  /**
   * Unified registration helper for backwards compatibility.
   */
  static async register(input: RegisterInput): Promise<AuthResponse> {
    const role = (input.role || "CUSTOMER") as UserRole;

    if (role === UserRole.PHARMACY) {
      return this.registerPharmacy({
        pharmacyName: input.pharmacyName || `${input.fullName}'s Pharmacy`,
        ownerName: input.ownerName || input.fullName,
        email: input.email,
        phone: input.phone || "N/A",
        password: input.password,
        licenseNumber:
          input.licenseNumber ||
          `LIC-PENDING-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        address: input.address || "Pending Address",
        city: input.city || "Mumbai",
        state: input.state || "Maharashtra",
        pincode: input.pincode || "400001",
      });
    }

    if (role === UserRole.DELIVERY_PARTNER) {
      return this.registerDeliveryPartner({
        fullName: input.fullName,
        email: input.email,
        phone: input.phone || "N/A",
        password: input.password,
        address: input.address || "Pending Address",
        city: input.city || "Mumbai",
        state: input.state || "Maharashtra",
        pincode: input.pincode || "400001",
      });
    }

    return this.registerCustomer({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      password: input.password,
    });
  }

  /**
   * Authenticate user credentials and return JWT.
   * NOTE: Users with verificationStatus = PENDING or REJECTED CAN STILL LOG IN!
   * (LOGIN ACCESS != BUSINESS ACCESS)
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
   * Returns verificationStatus and any latest rejectionReason.
   */
  static async getMe(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        ownedPharmacies: true,
        deliveryPartner: true,
        verificationRequests: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user || !user.isActive) {
      const error: any = new Error("User not found or account is inactive");
      error.statusCode = 401;
      throw error;
    }

    const latestVerification = user.verificationRequests[0];
    const rejectionReason =
      user.verificationStatus === VerificationStatus.REJECTED
        ? latestVerification?.rejectionReason || "Application details could not be verified"
        : null;

    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      verificationStatus: user.verificationStatus,
      rejectionReason,
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
