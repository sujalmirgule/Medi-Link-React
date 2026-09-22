import { UserRole, VerificationStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthService } from "../modules/auth/auth.service";
import { TokenService } from "../modules/auth/token.service";
import { PasswordService } from "../modules/auth/password.service";
import { AdminService } from "../modules/admin/admin.service";
import { VerificationService } from "../modules/verification/verification.service";
import app from "../app";

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
    "admin.test.cust@medilink.com",
    "admin.test.pharm@medilink.com",
    "admin.test.driver@medilink.com",
    "admin.test.admin@medilink.com",
    "admin.test.deactivate@medilink.com",
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
  console.log("   MediLink Phase 4: Production Admin Portal Test ");
  console.log("==================================================");

  await cleanup();

  // 1. Setup Admin user
  const adminHash = await PasswordService.hashPassword("AdminPass@2026");
  const admin = await prisma.user.create({
    data: {
      email: "admin.test.admin@medilink.com",
      passwordHash: adminHash,
      phone: "9988776655",
      role: UserRole.ADMIN,
      isActive: true,
      verificationStatus: VerificationStatus.NOT_REQUIRED,
    },
  });

  const adminToken = TokenService.signToken({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
  });
  assert(!!adminToken, "Admin access token created successfully");

  // 2. Setup customer
  const customer = await AuthService.registerCustomer({
    fullName: "AdminTest Customer",
    email: "admin.test.cust@medilink.com",
    phone: "9188770001",
    password: "Password@123",
  });

  // 3. Setup pharmacy
  const pharmacy = await AuthService.registerPharmacy({
    pharmacyName: "AdminTest Pharmacy Plaza",
    ownerName: "Owner AdminTest",
    email: "admin.test.pharm@medilink.com",
    phone: "9188770002",
    password: "Password@123",
    licenseNumber: "LIC-ADM-TEST-999",
    address: "99 Admin Way",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
  });

  // 4. Setup driver
  const driver = await AuthService.registerDeliveryPartner({
    fullName: "AdminTest Courier",
    email: "admin.test.driver@medilink.com",
    phone: "9188770003",
    password: "Password@123",
    address: "789 Speed St",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560002",
  });

  // 5. Setup target for deactivation
  const deactivateTarget = await AuthService.registerCustomer({
    fullName: "Target For Deactivation",
    email: "admin.test.deactivate@medilink.com",
    phone: "9188770004",
    password: "Password@123",
  });

  // -------------------------------------------------------------
  // 1. DYNAMIC DASHBOARD METRICS
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 1] Dynamic Dashboard Metrics");
  const stats = await AdminService.getDashboardStats();
  assert(typeof stats.metrics.totalUsers === "number" && stats.metrics.totalUsers >= 5, "totalUsers metric is accurate number");
  assert(stats.metrics.totalCustomers >= 2, "totalCustomers metric includes registered customers");
  assert(stats.metrics.totalPharmacies >= 1, "totalPharmacies metric includes registered pharmacies");
  assert(stats.metrics.totalDeliveryPartners >= 1, "totalDeliveryPartners metric includes registered drivers");
  assert(stats.metrics.pendingVerificationsTotal >= 2, "pendingVerificationsTotal correctly aggregates pending partners");
  assert(Array.isArray(stats.recentActivity), "recentActivity returns an array");
  assert(stats.recentActivity.length <= 10, "recentActivity limited to 10 latest entries");

  // -------------------------------------------------------------
  // 2. VERIFICATION MANAGEMENT
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 2] Verification Applications Management");
  const allVerifs = await AdminService.listVerifications({ page: 1, limit: 10 });
  assert(allVerifs.items.length >= 2, "listVerifications returns items");
  assert(allVerifs.pagination.total >= 2, "listVerifications includes pagination metadata");

  const pharmVerifs = await AdminService.listVerifications({ role: "PHARMACY", page: 1, limit: 10 });
  assert(pharmVerifs.items.every((v) => v.role === "PHARMACY"), "Filter by role PHARMACY returns only pharmacies");

  const singleVerif = await AdminService.getVerificationById(pharmVerifs.items[0].id);
  assert(singleVerif !== null, "getVerificationById returns application");
  assert(singleVerif?.id === pharmVerifs.items[0].id, "Verification id matches requested id");

  // Test approval flow via VerificationService with Admin ID
  const approved = await VerificationService.approveVerification(pharmVerifs.items[0].id, admin.id);
  assert(approved.status === VerificationStatus.VERIFIED, "Verification status successfully updated to VERIFIED");

  // Verify pharmacy is now verified in DB
  const verifiedPharm = await prisma.pharmacy.findFirst({ where: { ownerUserId: approved.userId } });
  assert(verifiedPharm?.isVerified === true, "Pharmacy isVerified updated to true");

  // Test rejection flow
  const driverVerifs = await AdminService.listVerifications({ role: "DELIVERY_PARTNER", page: 1, limit: 10 });
  const rejected = await VerificationService.rejectVerification(
    driverVerifs.items[0].id,
    admin.id,
    "Incomplete vehicle registration documents"
  );
  assert(rejected.status === VerificationStatus.REJECTED, "Verification status successfully updated to REJECTED");
  assert(rejected.rejectionReason === "Incomplete vehicle registration documents", "Rejection reason saved");

  // -------------------------------------------------------------
  // 3. USER MANAGEMENT & SECURITY
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 3] User Management & Data Protection");
  const usersList = await AdminService.listUsers({ page: 1, limit: 10 });
  assert(usersList.items.length >= 5, "listUsers returns user records");

  // Password hash leakage check
  const hasPasswordHashLeak = usersList.items.some((u: any) => "passwordHash" in u);
  assert(!hasPasswordHashLeak, "CRITICAL: Zero passwordHash leak in listUsers response");

  const singleUser = await AdminService.getUserById(customer.user.id);
  assert(singleUser !== null, "getUserById returns user");
  assert(!("passwordHash" in (singleUser as any)), "CRITICAL: Zero passwordHash leak in getUserById response");
  assert(singleUser?.email === "admin.test.cust@medilink.com", "User email matches requested user");

  // Search filter check
  const searchResults = await AdminService.listUsers({ search: "admin.test.cust", page: 1, limit: 10 });
  assert(searchResults.items.some((u: any) => u.email === "admin.test.cust@medilink.com"), "Search by email returns matching user");

  // Role filter check
  const customerOnly = await AdminService.listUsers({ role: UserRole.CUSTOMER, page: 1, limit: 10 });
  assert(customerOnly.items.every((u: any) => u.role === UserRole.CUSTOMER), "Role filter returns only customers");

  // Account Status Deactivation & Activation
  const deactivated = await AdminService.updateUserStatus(deactivateTarget.user.id, false, admin.id);
  assert(deactivated.isActive === false, "User successfully deactivated");

  // Verify AuditLog for deactivation
  const deactLog = await prisma.auditLog.findFirst({
    where: { action: "USER_DEACTIVATED", entityId: deactivateTarget.user.id },
  });
  assert(deactLog !== null, "AuditLog created for USER_DEACTIVATED");

  const reactivated = await AdminService.updateUserStatus(deactivateTarget.user.id, true, admin.id);
  assert(reactivated.isActive === true, "User successfully reactivated");

  // Verify AuditLog for activation
  const actLog = await prisma.auditLog.findFirst({
    where: { action: "USER_ACTIVATED", entityId: deactivateTarget.user.id },
  });
  assert(actLog !== null, "AuditLog created for USER_ACTIVATED");

  // Self-Deactivation Guard (Admin cannot deactivate self)
  let selfDeactBlocked = false;
  try {
    await AdminService.updateUserStatus(admin.id, false, admin.id);
  } catch (err: any) {
    if (err.statusCode === 400) {
      selfDeactBlocked = true;
    }
  }
  assert(selfDeactBlocked, "CRITICAL: Self-deactivation guard prevented Admin from deactivating self (400 Bad Request)");

  // -------------------------------------------------------------
  // 4. PHARMACY DIRECTORY
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 4] Pharmacy Directory");
  const pharmacyList = await AdminService.listPharmacies({ page: 1, limit: 10 });
  assert(pharmacyList.items.length >= 1, "listPharmacies returns pharmacies");
  assert(pharmacyList.items.some((p: any) => p.licenseNumber === "LIC-ADM-TEST-999"), "Registered pharmacy found in directory");

  const singlePharmacy = await AdminService.getPharmacyById(pharmacy.user.pharmacy!.id);
  assert(singlePharmacy !== null, "getPharmacyById returns full pharmacy details");
  assert(singlePharmacy?.city === "Bangalore", "Pharmacy city returned accurately");
  assert(singlePharmacy?.licenseNumber === "LIC-ADM-TEST-999", "Pharmacy license number returned accurately");

  // -------------------------------------------------------------
  // 5. DELIVERY PARTNER DIRECTORY
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 5] Delivery Partner Directory");
  const driverList = await AdminService.listDeliveryPartners({ page: 1, limit: 10 });
  assert(driverList.items.length >= 1, "listDeliveryPartners returns drivers");
  assert(driverList.items.some((d: any) => d.phone === "9188770003"), "Registered driver found in directory");

  const singleDriver = await AdminService.getDeliveryPartnerById(driver.user.deliveryPartner!.id);
  assert(singleDriver !== null, "getDeliveryPartnerById returns full driver details");
  assert(singleDriver?.phone === "9188770003", "Driver phone returned accurately");

  // -------------------------------------------------------------
  // 6. AUDIT LOGS VIEWER
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 6] Audit Logs Viewer");
  const auditLogs = await AdminService.listAuditLogs({ page: 1, limit: 10 });
  assert(auditLogs.items.length >= 1, "listAuditLogs returns audit log items");
  assert(auditLogs.pagination.total >= 1, "listAuditLogs includes pagination metadata");

  const filteredLogs = await AdminService.listAuditLogs({ action: "USER_DEACTIVATED", page: 1, limit: 10 });
  assert(filteredLogs.items.every((l: any) => l.action === "USER_DEACTIVATED"), "Filter by action returns matching logs");

  // -------------------------------------------------------------
  // 7. ADMIN PROFILE
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 7] Admin Profile");
  const adminProfile = await AdminService.getAdminProfile(admin.id);
  assert(adminProfile.id === admin.id, "getAdminProfile returns correct admin ID");
  assert(adminProfile.email === admin.email, "getAdminProfile returns correct admin email");
  assert(adminProfile.role === UserRole.ADMIN, "Admin role is ADMIN");
  assert(!("passwordHash" in (adminProfile as any)), "CRITICAL: Admin profile does not leak passwordHash");

  // -------------------------------------------------------------
  // 8. LIVE HTTP RBAC & ENDPOINT VERIFICATION
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 8] Live HTTP RBAC & Security Verification");
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  try {
    // A. Unauthenticated request rejected
    const unauthRes = await fetch(`${baseUrl}/admin/dashboard`);
    assert(unauthRes.status === 401, "HTTP 401: Unauthenticated request to /admin/dashboard blocked");

    // B. Customer token rejected with 403
    const custRes = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${customer.token}` },
    });
    assert(custRes.status === 403, "HTTP 403: Customer role blocked from /admin/dashboard");

    // C. Pharmacy token rejected with 403
    const pharmRes = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${pharmacy.token}` },
    });
    assert(pharmRes.status === 403, "HTTP 403: Pharmacy role blocked from /admin/dashboard");

    // D. Delivery partner token rejected with 403
    const driverRes = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${driver.token}` },
    });
    assert(driverRes.status === 403, "HTTP 403: Delivery Partner role blocked from /admin/dashboard");

    // E. Admin token authorized with 200 OK
    const adminRes = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminRes.status === 200, "HTTP 200: Admin authorized to /admin/dashboard");
    const adminJson: any = await adminRes.json();
    assert(typeof adminJson.data?.metrics?.totalUsers === "number", "HTTP /admin/dashboard returns valid metrics payload");

    // F. Admin can access all admin sub-routes via HTTP
    const verifsHttp = await fetch(`${baseUrl}/admin/verifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(verifsHttp.status === 200, "HTTP 200: GET /admin/verifications accessible to Admin");

    const usersHttp = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(usersHttp.status === 200, "HTTP 200: GET /admin/users accessible to Admin");

    const pharmHttp = await fetch(`${baseUrl}/admin/pharmacies`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(pharmHttp.status === 200, "HTTP 200: GET /admin/pharmacies accessible to Admin");

    const delivHttp = await fetch(`${baseUrl}/admin/delivery-partners`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(delivHttp.status === 200, "HTTP 200: GET /admin/delivery-partners accessible to Admin");

    const logsHttp = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(logsHttp.status === 200, "HTTP 200: GET /admin/audit-logs accessible to Admin");

    const profileHttp = await fetch(`${baseUrl}/admin/profile`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(profileHttp.status === 200, "HTTP 200: GET /admin/profile accessible to Admin");

    // G. Self-deactivation guard via HTTP returns 400 Bad Request
    const selfDeactHttp = await fetch(`${baseUrl}/admin/users/${admin.id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isActive: false }),
    });
    assert(selfDeactHttp.status === 400, "HTTP 400: Self-deactivation blocked via API with 400 Bad Request");
  } finally {
    server.close();
  }

  console.log("\n==================================================");
  console.log(`  ALL ${passedCount}/${totalCount} PHASE 4 ADMIN TESTS PASSED!`);
  console.log("==================================================");

  await cleanup();
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
