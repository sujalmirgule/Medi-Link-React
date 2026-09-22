import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authenticate";
import { UserRole, VerificationStatus } from "@prisma/client";

/**
 * Enforces that the authenticated user has the PHARMACY role and is VERIFIED.
 * Rejects pending or rejected accounts with HTTP 403 Forbidden.
 */
export function requireVerifiedPharmacy(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (req.user.role !== UserRole.PHARMACY) {
    res.status(403).json({
      success: false,
      message: "Forbidden: This action requires a Pharmacy account",
    });
    return;
  }

  if (req.user.verificationStatus !== VerificationStatus.VERIFIED) {
    res.status(403).json({
      success: false,
      message: "Pharmacy verification is required for this action",
    });
    return;
  }

  next();
}

/**
 * Enforces that the authenticated user has the DELIVERY_PARTNER role and is VERIFIED.
 * Rejects pending or rejected accounts with HTTP 403 Forbidden.
 */
export function requireVerifiedDeliveryPartner(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (req.user.role !== UserRole.DELIVERY_PARTNER) {
    res.status(403).json({
      success: false,
      message: "Forbidden: This action requires a Delivery Partner account",
    });
    return;
  }

  if (req.user.verificationStatus !== VerificationStatus.VERIFIED) {
    res.status(403).json({
      success: false,
      message: "Delivery partner verification is required for this action",
    });
    return;
  }

  next();
}
