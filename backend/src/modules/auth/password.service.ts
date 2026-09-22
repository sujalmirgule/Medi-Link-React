import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export class PasswordService {
  /**
   * Hash a plaintext password securely using bcrypt.
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare a plaintext password against a stored bcrypt hash.
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
