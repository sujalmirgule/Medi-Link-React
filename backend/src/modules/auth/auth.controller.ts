import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthService } from "./auth.service";
import {
  customerRegisterSchema,
  deliveryPartnerRegisterSchema,
  loginSchema,
  pharmacyRegisterSchema,
  registerSchema,
} from "./auth.validation";

export class AuthController {
  /**
   * Register a new user (Customer, Pharmacy, or Delivery Partner)
   * POST /api/v1/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedBody = registerSchema.parse(req.body);
      const result = await AuthService.register(parsedBody);

      res.status(201).json({
        success: true,
        message: "Account registered successfully",
        data: result,
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0]?.message || "Validation failed",
          errors: error.errors,
        });
        return;
      }

      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Register a Pharmacy account
   * POST /api/v1/auth/register/pharmacy
   */
  static async registerPharmacy(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parsedBody = pharmacyRegisterSchema.parse(req.body);
      const result = await AuthService.registerPharmacy(parsedBody);

      res.status(201).json({
        success: true,
        message: "Pharmacy registered successfully and submitted for verification",
        data: result,
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0]?.message || "Validation failed",
          errors: error.errors,
        });
        return;
      }

      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Register a Delivery Partner account
   * POST /api/v1/auth/register/delivery-partner
   */
  static async registerDeliveryPartner(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parsedBody = deliveryPartnerRegisterSchema.parse(req.body);
      const result = await AuthService.registerDeliveryPartner(parsedBody);

      res.status(201).json({
        success: true,
        message: "Delivery partner registered successfully and submitted for verification",
        data: result,
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0]?.message || "Validation failed",
          errors: error.errors,
        });
        return;
      }

      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Authenticate user and return JWT
   * POST /api/v1/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedBody = loginSchema.parse(req.body);
      const result = await AuthService.login(parsedBody);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0]?.message || "Validation failed",
          errors: error.errors,
        });
        return;
      }

      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Get authenticated user profile
   * GET /api/v1/auth/me
   */
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "User profile retrieved successfully",
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
