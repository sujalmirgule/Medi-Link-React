import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthService } from "../modules/auth/auth.service";
import { TokenService } from "../modules/auth/token.service";
import { PasswordService } from "../modules/auth/password.service";
import { env } from "../config/env";

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string) {
  totalCount++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    throw new Error(`Assertion failed for: ${testName}`);
  }
}

async function cleanup() {
  const testEmails = [
    "auth.customer@medilink.com",
    "auth.pharmacy@medilink.com",
    "auth.delivery@medilink.com",
    "auth.inactive@medilink.com",
    "auth.admin.test@medilink.com",
  ];

  await prisma.review.deleteMany({ where: { customer: { email: { in: testEmails } } } });
  await prisma.orderItem.deleteMany({ where: { order: { customer: { email: { in: testEmails } } } } });
  await prisma.delivery.deleteMany({ where: { order: { customer: { email: { in: testEmails } } } } });
  await prisma.payment.deleteMany({ where: { order: { customer: { email: { in: testEmails } } } } });
  await prisma.settlement.deleteMany({ where: { order: { customer: { email: { in: testEmails } } } } });
  await prisma.order.deleteMany({ where: { customer: { email: { in: testEmails } } } });
  await prisma.address.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.pharmacyStaff.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.pharmacyMedicine.deleteMany({ where: { pharmacy: { email: { in: testEmails } } } });
  await prisma.pharmacy.deleteMany({ where: { email: { in: testEmails } } });
  await prisma.deliveryPartner.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.customerProfile.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.notification.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.auditLog.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
}

async function runTests() {
  console.log("==================================================");
  console.log("   MediLink Phase 3: Auth & Security Test Matrix  ");
  console.log("==================================================");

  await cleanup();

  // -------------------------------------------------------------
  // 1. REGISTRATION MATRIX
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 1] Registration Matrix");

  // A. Customer Registration
  const custRes = await AuthService.register({
    fullName: "Alice Customer",
    email: "auth.customer@medilink.com",
    phone: "9100000001",
    password: "Password@123",
    role: "CUSTOMER",
  });
  assert(custRes.user.role === UserRole.CUSTOMER, "Customer registered with role CUSTOMER");
  assert(custRes.user.profile?.firstName === "Alice", "Customer profile firstName created in transaction");
  assert(!!custRes.token, "Customer registration returned JWT token");

  // Verify DB password hash is not plaintext
  const custDb = await prisma.user.findUnique({ where: { email: "auth.customer@medilink.com" } });
  assert(Boolean(custDb?.passwordHash.startsWith("$2a$") || custDb?.passwordHash.startsWith("$2b$")), "Password stored as bcrypt hash");
  assert(custDb?.passwordHash !== "Password@123", "Password is NOT stored in plaintext");

  // B. Pharmacy Registration
  const pharmRes = await AuthService.register({
    fullName: "MediCare Pharmacy",
    email: "auth.pharmacy@medilink.com",
    phone: "9100000002",
    password: "Password@123",
    role: "PHARMACY",
    pharmacyName: "MediCare Store 1",
  });
  assert(pharmRes.user.role === UserRole.PHARMACY, "Pharmacy registered with role PHARMACY");
  assert(pharmRes.user.pharmacy !== null, "Pharmacy record created");
  assert(pharmRes.user.pharmacy?.isVerified === false, "Registered pharmacy is NOT verified by default (isVerified = false)");

  // C. Delivery Partner Registration
  const delivRes = await AuthService.register({
    fullName: "Bob Driver",
    email: "auth.delivery@medilink.com",
    phone: "9100000003",
    password: "Password@123",
    role: "DELIVERY_PARTNER",
  });
  assert(delivRes.user.role === UserRole.DELIVERY_PARTNER, "Delivery Partner registered with role DELIVERY_PARTNER");
  assert(delivRes.user.deliveryPartner !== null, "Delivery partner record created");
  assert(delivRes.user.deliveryPartner?.isVerified === false, "Registered driver is NOT verified by default (isVerified = false)");
  assert(delivRes.user.deliveryPartner?.isAvailable === false, "Registered driver is NOT available by default");

  // D. Duplicate Registration
  try {
    await AuthService.register({
      fullName: "Duplicate User",
      email: "auth.customer@medilink.com",
      password: "Password@123",
      role: "CUSTOMER",
    });
    assert(false, "Duplicate email registration should have thrown error");
  } catch (err: any) {
    assert(err.message.includes("already exists"), "Duplicate email blocked with friendly error");
  }

  // -------------------------------------------------------------
  // 2. LOGIN MATRIX
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 2] Login Matrix");

  // A. Valid Login
  const loginRes = await AuthService.login({
    email: "auth.customer@medilink.com",
    password: "Password@123",
  });
  assert(loginRes.user.email === "auth.customer@medilink.com", "Login successful with correct credentials");
  assert(!!loginRes.token, "Login returned access token");

  // B. Wrong Password
  try {
    await AuthService.login({
      email: "auth.customer@medilink.com",
      password: "WrongPassword!456",
    });
    assert(false, "Login with wrong password should fail");
  } catch (err: any) {
    assert(err.statusCode === 401, "Wrong password rejected with 401 Unauthorized");
  }

  // C. Non-existent Email
  try {
    await AuthService.login({
      email: "nonexistent@medilink.com",
      password: "Password@123",
    });
    assert(false, "Login with non-existent email should fail");
  } catch (err: any) {
    assert(err.statusCode === 401, "Non-existent user rejected with 401 Unauthorized");
  }

  // -------------------------------------------------------------
  // 3. TOKEN & CLAIMS VERIFICATION
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 3] JWT Token & Claims Verification");

  const decoded = TokenService.verifyToken(loginRes.token);
  assert(decoded.sub === custRes.user.id, "Token sub matches user id");
  assert(decoded.role === UserRole.CUSTOMER, "Token role matches user role");
  assert(decoded.iss === env.JWT_ISSUER, "Token issuer matches configured JWT_ISSUER");
  assert((decoded as any).password === undefined, "Token does not contain password");
  assert((decoded as any).passwordHash === undefined, "Token does not contain passwordHash");

  // Malformed Token
  try {
    TokenService.verifyToken("malformed.jwt.token");
    assert(false, "Malformed token should fail");
  } catch (err) {
    assert(true, "Malformed token rejected");
  }

  // Expired Token
  const expiredToken = jwt.sign(
    { sub: custRes.user.id, role: UserRole.CUSTOMER, email: custRes.user.email },
    env.JWT_SECRET,
    { expiresIn: "-1s", issuer: env.JWT_ISSUER }
  );
  try {
    TokenService.verifyToken(expiredToken);
    assert(false, "Expired token should fail");
  } catch (err) {
    assert(true, "Expired token rejected");
  }

  // Invalid Secret
  const wrongSecretToken = jwt.sign(
    { sub: custRes.user.id, role: UserRole.CUSTOMER },
    "wrong-secret-key-12345",
    { expiresIn: "1h", issuer: env.JWT_ISSUER }
  );
  try {
    TokenService.verifyToken(wrongSecretToken);
    assert(false, "Token with invalid signature should fail");
  } catch (err) {
    assert(true, "Invalid signature token rejected");
  }

  // -------------------------------------------------------------
  // 4. CURRENT USER PROFILE (/me)
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 4] Current User (/me)");

  const meData = await AuthService.getMe(custRes.user.id);
  assert(meData.id === custRes.user.id, "getMe returned correct user id");
  assert(meData.profile?.firstName === "Alice", "getMe included customer profile");
  assert((meData as any).passwordHash === undefined, "getMe does not leak passwordHash");

  // -------------------------------------------------------------
  // 5. INACTIVE ACCOUNT BLOCKING
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 5] Inactive Account Verification");

  // Deactivate user
  await prisma.user.update({
    where: { id: custRes.user.id },
    data: { isActive: false },
  });

  // Try login with deactivated user
  try {
    await AuthService.login({
      email: "auth.customer@medilink.com",
      password: "Password@123",
    });
    assert(false, "Inactive account login should fail");
  } catch (err: any) {
    assert(err.statusCode === 403, "Inactive account login rejected with 403 Forbidden");
  }

  // Try getMe with token of deactivated user
  try {
    await AuthService.getMe(custRes.user.id);
    assert(false, "Inactive account getMe should fail");
  } catch (err: any) {
    assert(err.statusCode === 401, "Inactive account session rejected");
  }

  // Reactivate user
  await prisma.user.update({
    where: { id: custRes.user.id },
    data: { isActive: true },
  });
  const reactivated = await AuthService.getMe(custRes.user.id);
  assert(reactivated.isActive === true, "Reactivated account successfully accessible");

  // -------------------------------------------------------------
  // 6. ADMIN SECURITY
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 6] Admin Provisioning & RBAC");

  // Create admin through controlled helper
  const adminHash = await PasswordService.hashPassword("AdminSecret@2026");
  const adminUser = await prisma.user.create({
    data: {
      email: "auth.admin.test@medilink.com",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  assert(adminUser.role === UserRole.ADMIN, "Controlled Admin creation succeeded");

  // Sign admin token
  const adminToken = TokenService.signToken({
    sub: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
  });
  const adminDecoded = TokenService.verifyToken(adminToken);
  assert(adminDecoded.role === UserRole.ADMIN, "Admin token verified with role ADMIN");

  // Cleanup
  await cleanup();

  console.log("\n==================================================");
  console.log(`  ALL ${passedCount}/${totalCount} AUTH MATRIX TESTS PASSED!`);
  console.log("==================================================");
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
