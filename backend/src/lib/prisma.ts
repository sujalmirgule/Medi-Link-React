import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.isDevelopment ? ["warn", "error"] : ["error"],
  });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
