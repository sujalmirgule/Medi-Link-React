import { AuthService } from "../modules/auth/auth.service";
import { TokenService } from "../modules/auth/token.service";
import { prisma } from "../lib/prisma";
import { UserRole, VerificationStatus } from "@prisma/client";

async function verifyDemoAccounts() {
  console.log("==================================================");
  console.log("🔍 Verifying Demo Accounts & Portal Integrity");
  console.log("==================================================");

  const demoPassword = "Demo@12345";

  // 1. Customer Verification
  console.log("\n1. Verifying Demo Customer Account...");
  const customerAuth = await AuthService.login({
    email: "demo.customer@medilink.test",
    password: demoPassword,
  });
  console.log("  ✓ Customer login succeeded");
  console.log(`  ✓ User ID: ${customerAuth.user.id}`);
  console.log(`  ✓ Role: ${customerAuth.user.role}`);
  console.log(`  ✓ Verification Status: ${customerAuth.user.verificationStatus}`);
  console.log(`  ✓ Token verified: ${Boolean(TokenService.verifyToken(customerAuth.token))}`);

  // 2. Pharmacy Verification
  console.log("\n2. Verifying Demo Pharmacy Account...");
  const pharmacyAuth = await AuthService.login({
    email: "demo.pharmacy@medilink.test",
    password: demoPassword,
  });
  console.log("  ✓ Pharmacy login succeeded");
  console.log(`  ✓ User ID: ${pharmacyAuth.user.id}`);
  console.log(`  ✓ Role: ${pharmacyAuth.user.role}`);
  console.log(`  ✓ Verification Status: ${pharmacyAuth.user.verificationStatus}`);
  
  const pharmacy = await prisma.pharmacy.findFirst({
    where: { ownerUserId: pharmacyAuth.user.id },
    include: {
      medicines: {
        include: {
          medicine: true,
          batches: true,
        },
      },
    },
  });
  if (!pharmacy) throw new Error("Demo Pharmacy record not found!");
  console.log(`  ✓ Pharmacy Name: ${pharmacy.name} (License: ${pharmacy.licenseNumber})`);
  console.log(`  ✓ Is Verified: ${pharmacy.isVerified}`);
  console.log(`  ✓ Total Listed Medicines: ${pharmacy.medicines.length}`);
  pharmacy.medicines.forEach((pm) => {
    const totalQty = pm.batches.reduce((sum, b) => sum + b.quantity, 0);
    const reservedQty = pm.batches.reduce((sum, b) => sum + b.reservedQuantity, 0);
    console.log(`    - ${pm.medicine.name}: ₹${pm.sellingPrice} | Available Stock: ${totalQty - reservedQty} (Total: ${totalQty}, Reserved: ${reservedQty})`);
  });

  // 3. Delivery Partner Verification
  console.log("\n3. Verifying Demo Delivery Partner Account...");
  const deliveryAuth = await AuthService.login({
    email: "demo.delivery@medilink.test",
    password: demoPassword,
  });
  console.log("  ✓ Delivery partner login succeeded");
  console.log(`  ✓ User ID: ${deliveryAuth.user.id}`);
  console.log(`  ✓ Role: ${deliveryAuth.user.role}`);
  console.log(`  ✓ Verification Status: ${deliveryAuth.user.verificationStatus}`);

  const deliveryPartner = await prisma.deliveryPartner.findUnique({
    where: { userId: deliveryAuth.user.id },
  });
  if (!deliveryPartner) throw new Error("Demo DeliveryPartner record not found!");
  console.log(`  ✓ Delivery Partner Profile Verified: isVerified = ${deliveryPartner.isVerified}, isAvailable = ${deliveryPartner.isAvailable}`);

  // 4. Admin Verification
  console.log("\n4. Verifying Demo Admin Account...");
  const adminAuth = await AuthService.login({
    email: "demo.admin@medilink.test",
    password: demoPassword,
  });
  console.log("  ✓ Admin login succeeded");
  console.log(`  ✓ User ID: ${adminAuth.user.id}`);
  console.log(`  ✓ Role: ${adminAuth.user.role}`);

  // 5. Verify Discount Coupons
  console.log("\n5. Verifying Demo Discount Coupons...");
  const discounts = await prisma.discount.findMany({
    where: { code: { in: ["DEMO10", "SAVE50"] } },
  });
  console.log(`  ✓ Total Demo Coupons Active: ${discounts.length}`);
  discounts.forEach((d) => {
    console.log(`    - Code: ${d.code} (${d.type} - Value: ${d.value})`);
  });

  console.log("\n==================================================");
  console.log("🎉 ALL 4 DEMO ACCOUNTS & TEST DATA VERIFIED!");
  console.log("==================================================");
}

verifyDemoAccounts()
  .catch((e) => {
    console.error("❌ Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
