import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { PasswordService } from "../modules/auth/password.service";
import { env } from "../config/env";

async function main() {
  const email = env.DEV_ADMIN_EMAIL.toLowerCase().trim();
  const password = env.DEV_ADMIN_PASSWORD;

  console.log(`[Seed Admin] Checking admin account for: ${email}`);

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  const passwordHash = await PasswordService.hashPassword(password);

  if (existingAdmin) {
    await prisma.user.update({
      where: { email },
      data: {
        role: UserRole.ADMIN,
        isActive: true,
        verificationStatus: "NOT_REQUIRED",
        passwordHash,
      },
    });
    console.log(`[Seed Admin] Existing account updated to active ADMIN role.`);
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
        verificationStatus: "NOT_REQUIRED",
      },
    });
    console.log(`[Seed Admin] New ADMIN account provisioned successfully.`);
  }
}

main()
  .catch((e) => {
    console.error("[Seed Admin] Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
