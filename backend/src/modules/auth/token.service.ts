import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { JwtPayload } from "./auth.types";

export class TokenService {
  /**
   * Sign a new JWT access token with minimal safe claims.
   */
  static signToken(payload: Omit<JwtPayload, "iat" | "exp" | "iss">): string {
    return jwt.sign(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      },
      env.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
        issuer: env.JWT_ISSUER,
      }
    );
  }

  /**
   * Verify an incoming JWT access token against the configured secret, issuer, and algorithm.
   */
  static verifyToken(token: string): JwtPayload {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
      algorithms: ["HS256"],
    }) as JwtPayload;

    if (!decoded.sub || !decoded.role) {
      throw new Error("Invalid token claims");
    }

    return decoded;
  }
}
