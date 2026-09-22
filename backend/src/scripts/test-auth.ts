import jwt from "jsonwebtoken";
import { UserRole, VerificationStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthService } from "../modules/auth/auth.service";
import { TokenService } from "../modules/auth/token.service";
import { PasswordService } from "../modules/auth/password.service";
import { VerificationService } from "../modules/verification/verification.service";
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
    "auth.pharmacy.reject@medilink.com",
    "auth.delivery@medilink.com",
    "auth.delivery.reject@medilink.com",
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
  await prisma.verificationRequest.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.auditLog.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
}

async function runTests() {
  console.log("==================================================");
  console.log("   MediLink Phase 3: Auth & Verification Matrix   ");
  console.log("==================================================");

  await cleanup();

  // -------------------------------------------------------------
  // 1. REGISTRATION MATRIX
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 1] Registration Matrix");

  // A. Customer Registration
  const custRes = await AuthService.registerCustomer({
    fullName: "Alice Customer",
    email: "auth.customer@medilink.com",
    phone: "9100000001",
    password: "Password@123",
  });
  assert(custRes.user.role === UserRole.CUSTOMER, "Customer registered with role CUSTOMER");
  assert(custRes.user.verificationStatus === VerificationStatus.NOT_REQUIRED, "Customer verificationStatus is NOT_REQUIRED");
  assert(custRes.user.profile?.firstName === "Alice", "Customer profile firstName created in transaction");
  assert(!!custRes.token, "Customer registration returned JWT token");

  // Verify DB password hash is not plaintext
  const custDb = await prisma.user.findUnique({ where: { email: "auth.customer@medilink.com" } });
  assert(Boolean(custDb?.passwordHash.startsWith("$2a$") || custDb?.passwordHash.startsWith("$2b$")), "Password stored as bcrypt hash");
  assert(custDb?.passwordHash !== "Password@123", "Password is NOT stored in plaintext");

  // B. Pharmacy Registration
  const pharmRes = await AuthService.registerPharmacy({
    pharmacyName: "MediCare Store 1",
    ownerName: "Dr. Dave",
    email: "auth.pharmacy@medilink.com",
    phone: "9100000002",
    password: "Password@123",
    licenseNumber: "LIC-TEST-PHARM-001",
    address: "123 Health Ave",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
  });
  assert(pharmRes.user.role === UserRole.PHARMACY, "Pharmacy registered with role PHARMACY");
  assert(pharmRes.user.verificationStatus === VerificationStatus.PENDING, "Pharmacy verificationStatus is PENDING");
  assert(pharmRes.user.pharmacy !== null, "Pharmacy record created");
  assert(pharmRes.user.pharmacy?.isVerified === false, "Registered pharmacy is NOT verified by default (isVerified = false)");

  // C. Delivery Partner Registration
  const delivRes = await AuthService.registerDeliveryPartner({
    fullName: "Bob Driver",
    email: "auth.delivery@medilink.com",
    phone: "9100000003",
    password: "Password@123",
    address: "456 Courier Lane",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400002",
  });
  assert(delivRes.user.role === UserRole.DELIVERY_PARTNER, "Delivery Partner registered with role DELIVERY_PARTNER");
  assert(delivRes.user.verificationStatus === VerificationStatus.PENDING, "Delivery Partner verificationStatus is PENDING");
  assert(delivRes.user.deliveryPartner !== null, "Delivery partner record created");
  assert(delivRes.user.deliveryPartner?.isVerified === false, "Registered driver is NOT verified by default (isVerified = false)");
  assert(delivRes.user.deliveryPartner?.isAvailable === false, "Registered driver is NOT available by default");

  // D. Duplicate Registration
  try {
    await AuthService.registerCustomer({
      fullName: "Duplicate User",
      email: "auth.customer@medilink.com",
      password: "Password@123",
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

  await prisma.user.update({
    where: { id: custRes.user.id },
    data: { isActive: false },
  });

  try {
    await AuthService.login({
      email: "auth.customer@medilink.com",
      password: "Password@123",
    });
    assert(false, "Inactive account login should fail");
  } catch (err: any) {
    assert(err.statusCode === 403, "Inactive account login rejected with 403 Forbidden");
  }

  try {
    await AuthService.getMe(custRes.user.id);
    assert(false, "Inactive account getMe should fail");
  } catch (err: any) {
    assert(err.statusCode === 401, "Inactive account session rejected");
  }

  await prisma.user.update({
    where: { id: custRes.user.id },
    data: { isActive: true },
  });
  const reactivated = await AuthService.getMe(custRes.user.id);
  assert(reactivated.isActive === true, "Reactivated account successfully accessible");

  // -------------------------------------------------------------
  // 6. ADMIN PROVISIONING & RBAC
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 6] Admin Provisioning & RBAC");

  const adminHash = await PasswordService.hashPassword("AdminSecret@2026");
  const adminUser = await prisma.user.create({
    data: {
      email: "auth.admin.test@medilink.com",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      isActive: true,
      verificationStatus: VerificationStatus.NOT_REQUIRED,
    },
  });
  assert(adminUser.role === UserRole.ADMIN, "Controlled Admin creation succeeded");

  const adminToken = TokenService.signToken({
    sub: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
  });
  const adminDecoded = TokenService.verifyToken(adminToken);
  assert(adminDecoded.role === UserRole.ADMIN, "Admin token verified with role ADMIN");

  // -------------------------------------------------------------
  // 7. PHARMACY VERIFICATION WORKFLOW (Section 2 & 14-16)
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 7] Pharmacy Verification Workflow");

  // Pending pharmacy login allowed (LOGIN ACCESS != BUSINESS ACCESS)
  const pharmLogin = await AuthService.login({
    email: "auth.pharmacy@medilink.com",
    password: "Password@123",
  });
  assert(pharmLogin.user.verificationStatus === VerificationStatus.PENDING, "Pending pharmacy can log in and has PENDING status");
  assert(pharmLogin.user.isActive === true, "Pending pharmacy account is active");

  // Find verification request for this pharmacy
  const pharmReq = await prisma.verificationRequest.findFirst({
    where: { userId: pharmRes.user.id },
  });
  assert(pharmReq !== null, "VerificationRequest record found for pharmacy");
  assert(pharmReq?.status === VerificationStatus.PENDING, "Initial VerificationRequest status is PENDING");

  // Admin approves pharmacy
  const approvedPharm = await VerificationService.approveVerification(pharmReq!.id, adminUser.id);
  assert(approvedPharm.status === VerificationStatus.VERIFIED, "VerificationRequest status changed to VERIFIED");

  // Check User and Pharmacy DB state after approval
  const approvedPharmUser = await AuthService.getMe(pharmRes.user.id);
  assert(approvedPharmUser.verificationStatus === VerificationStatus.VERIFIED, "Pharmacy user verificationStatus updated to VERIFIED");
  assert(approvedPharmUser.pharmacy?.isVerified === true, "Pharmacy record isVerified is true");

  // Verify AuditLog for approval
  const approveAudit = await prisma.auditLog.findFirst({
    where: { action: "PHARMACY_VERIFICATION_APPROVED", entityId: pharmReq!.id },
  });
  assert(approveAudit !== null, "AuditLog created for PHARMACY_VERIFICATION_APPROVED");

  // Test Pharmacy Rejection Workflow
  const rejectPharmRes = await AuthService.registerPharmacy({
    pharmacyName: "Reject Pharmacy Store",
    ownerName: "Dr. BadLicense",
    email: "auth.pharmacy.reject@medilink.com",
    phone: "9100000099",
    password: "Password@123",
    licenseNumber: "LIC-INVALID-999",
    address: "999 Error St",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400099",
  });
  const rejectPharmReq = await prisma.verificationRequest.findFirst({
    where: { userId: rejectPharmRes.user.id },
  });

  const rejectionReason = "Pharmacy license number could not be verified in state registry";
  await VerificationService.rejectVerification(rejectPharmReq!.id, adminUser.id, rejectionReason);

  // Rejected pharmacy can still login (LOGIN ACCESS != BUSINESS ACCESS)
  const rejectedLogin = await AuthService.login({
    email: "auth.pharmacy.reject@medilink.com",
    password: "Password@123",
  });
  assert(rejectedLogin.user.verificationStatus === VerificationStatus.REJECTED, "Rejected pharmacy can log in with REJECTED status");
  assert(rejectedLogin.user.rejectionReason === rejectionReason, "Rejection reason returned on user profile");
  assert(rejectedLogin.user.pharmacy?.isVerified === false, "Rejected pharmacy remains isVerified = false");

  const rejectAudit = await prisma.auditLog.findFirst({
    where: { action: "PHARMACY_VERIFICATION_REJECTED", entityId: rejectPharmReq!.id },
  });
  assert(rejectAudit !== null, "AuditLog created for PHARMACY_VERIFICATION_REJECTED");

  // -------------------------------------------------------------
  // 8. DELIVERY PARTNER VERIFICATION WORKFLOW (Section 3 & 19-20)
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 8] Delivery Partner Verification Workflow");

  // Pending delivery partner login allowed
  const delivLogin = await AuthService.login({
    email: "auth.delivery@medilink.com",
    password: "Password@123",
  });
  assert(delivLogin.user.verificationStatus === VerificationStatus.PENDING, "Pending driver can log in and has PENDING status");

  const delivReq = await prisma.verificationRequest.findFirst({
    where: { userId: delivRes.user.id },
  });
  assert(delivReq !== null, "VerificationRequest record found for delivery partner");

  // Admin approves delivery partner
  await VerificationService.approveVerification(delivReq!.id, adminUser.id);
  const approvedDelivUser = await AuthService.getMe(delivRes.user.id);
  assert(approvedDelivUser.verificationStatus === VerificationStatus.VERIFIED, "Driver user verificationStatus updated to VERIFIED");
  assert(approvedDelivUser.deliveryPartner?.isVerified === true, "Driver record isVerified is true");

  const delivApproveAudit = await prisma.auditLog.findFirst({
    where: { action: "DELIVERY_PARTNER_VERIFICATION_APPROVED", entityId: delivReq!.id },
  });
  assert(delivApproveAudit !== null, "AuditLog created for DELIVERY_PARTNER_VERIFICATION_APPROVED");

  // Rejection of delivery partner
  const rejectDelivRes = await AuthService.registerDeliveryPartner({
    fullName: "Reject Driver",
    email: "auth.delivery.reject@medilink.com",
    phone: "9100000088",
    password: "Password@123",
    address: "888 Nowhere St",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400088",
  });
  const rejectDelivReq = await prisma.verificationRequest.findFirst({
    where: { userId: rejectDelivRes.user.id },
  });

  const delivRejectionReason = "Driver contact details could not be validated";
  await VerificationService.rejectVerification(rejectDelivReq!.id, adminUser.id, delivRejectionReason);

  const rejectedDelivLogin = await AuthService.login({
    email: "auth.delivery.reject@medilink.com",
    password: "Password@123",
  });
  assert(rejectedDelivLogin.user.verificationStatus === VerificationStatus.REJECTED, "Rejected driver can log in with REJECTED status");
  assert(rejectedDelivLogin.user.rejectionReason === delivRejectionReason, "Rejection reason attached to driver profile");

  const delivRejectAudit = await prisma.auditLog.findFirst({
    where: { action: "DELIVERY_PARTNER_VERIFICATION_REJECTED", entityId: rejectDelivReq!.id },
  });
  assert(delivRejectAudit !== null, "AuditLog created for DELIVERY_PARTNER_VERIFICATION_REJECTED");

  // -------------------------------------------------------------
  // 9. ADMIN VERIFICATION LIST & VALIDATION
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 9] Admin Verification List & Validation");

  const allApps = await VerificationService.listVerifications();
  assert(allApps.length >= 4, "Admin can list all verification applications");

  const pharmOnly = await VerificationService.listVerifications({ role: "PHARMACY" });
  assert(pharmOnly.every((a) => a.role === UserRole.PHARMACY), "Filtering by role PHARMACY returns only pharmacies");

  const delivOnly = await VerificationService.listVerifications({ role: "DELIVERY_PARTNER" });
  assert(delivOnly.every((a) => a.role === UserRole.DELIVERY_PARTNER), "Filtering by role DELIVERY_PARTNER returns only drivers");

  // Rejection requires valid reason
  try {
    await VerificationService.rejectVerification(delivReq!.id, adminUser.id, "bad");
    assert(false, "Short rejection reason should fail");
  } catch (err: any) {
    assert(err.statusCode === 400, "Rejection without proper reason rejected with 400 Bad Request");
  }

  // Cleanup
  await cleanup();

  console.log("\n==================================================");
  console.log(`  ALL ${passedCount}/${totalCount} PHASE 3 TESTS PASSED!`);
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
