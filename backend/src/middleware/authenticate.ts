import { Request, Response, NextFunction } from "express";
import { TokenService } from "../modules/auth/token.service";
import { AuthService } from "../modules/auth/auth.service";
import { SafeUser } from "../modules/auth/auth.types";

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

export type AuthenticatedRequest = Request;

/**
 * Authentication Middleware
 * Validates the JWT Bearer token and verifies the account is active.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authorization token required",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = TokenService.verifyToken(token);
    const user = await AuthService.getMe(decoded.sub);

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: "Account is inactive or disabled",
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}
