import { UserRole, VerificationStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthService } from "../modules/auth/auth.service";
import { TokenService } from "../modules/auth/token.service";
import { PharmacyService } from "../modules/pharmacy/pharmacy.service";
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
    "pharm.test.cust@medilink.com",
    "pharm.test.driver@medilink.com",
    "pharm.test.pending@medilink.com",
    "pharm.test.rejected@medilink.com",
    "pharm.test.verified.a@medilink.com",
    "pharm.test.verified.b@medilink.com",
    "pharm.test.admin@medilink.com",
  ];

  await prisma.review.deleteMany({ where: { customer: { email: { in: testEmails } } } });
  await prisma.orderItem.deleteMany({ where: { order: { customer: { email: { in: testEmails } } } } });
  await prisma.delivery.deleteMany({ where: { order: { customer: { email: { in: testEmails } } } } });
  await prisma.payment.deleteMany({ where: { order: { customer: { email: { in: testEmails } } } } });
  await prisma.settlement.deleteMany({ where: { order: { customer: { email: { in: testEmails } } } } });
  await prisma.order.deleteMany({ where: { customer: { email: { in: testEmails } } } });
  await prisma.address.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.inventoryBatch.deleteMany({
    where: { pharmacyMedicine: { pharmacy: { email: { in: testEmails } } } },
  });
  await prisma.pharmacyMedicine.deleteMany({
    where: { pharmacy: { email: { in: testEmails } } },
  });
  await prisma.pharmacyStaff.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.pharmacy.deleteMany({ where: { email: { in: testEmails } } });
  await prisma.deliveryPartner.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.customerProfile.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.notification.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.verificationRequest.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.auditLog.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });

  // Clean test medicine catalog entries created by tests
  await prisma.medicine.deleteMany({
    where: { name: { startsWith: "TestMed-" } },
  });
  await prisma.medicineCategory.deleteMany({
    where: { name: { startsWith: "TestCat-" } },
  });
}

async function runTests() {
  console.log("==================================================");
  console.log("   MediLink Phase 5: Pharmacy Portal Test Suite   ");
  console.log("==================================================");

  await cleanup();

  // 0. Setup Seed Catalog Category & Medicine
  const category = await prisma.medicineCategory.create({
    data: {
      name: `TestCat-Cardio-${Date.now()}`,
      description: "Heart and blood pressure care",
    },
  });

  const medicineA = await prisma.medicine.create({
    data: {
      name: `TestMed-Amlodipine-5mg-${Date.now()}`,
      genericName: "Amlodipine Besylate",
      composition: "Amlodipine 5mg",
      manufacturer: "Sun Pharma",
      categoryId: category.id,
      prescriptionRequired: true,
    },
  });

  const medicineB = await prisma.medicine.create({
    data: {
      name: `TestMed-Paracetamol-650mg-${Date.now()}`,
      genericName: "Paracetamol",
      composition: "Paracetamol 650mg",
      manufacturer: "Cipla",
      categoryId: category.id,
      prescriptionRequired: false,
    },
  });

  // 1. Setup Actors
  // Customer
  const customer = await AuthService.registerCustomer({
    fullName: "Customer Tester",
    email: "pharm.test.cust@medilink.com",
    phone: "9199880001",
    password: "Password@123",
  });

  // Delivery Partner
  const driver = await AuthService.registerDeliveryPartner({
    fullName: "Driver Tester",
    email: "pharm.test.driver@medilink.com",
    phone: "9199880002",
    password: "Password@123",
    address: "Courier St",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
  });

  // Pending Pharmacy
  const pendingPharm = await AuthService.registerPharmacy({
    pharmacyName: "Pending Pharmacy Store",
    ownerName: "Dr. Pending",
    email: "pharm.test.pending@medilink.com",
    phone: "9199880003",
    password: "Password@123",
    licenseNumber: "LIC-TEST-PEND-901",
    address: "100 Pending Road",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400002",
  });

  // Rejected Pharmacy
  const rejectedPharm = await AuthService.registerPharmacy({
    pharmacyName: "Rejected Pharmacy Store",
    ownerName: "Dr. Rejected",
    email: "pharm.test.rejected@medilink.com",
    phone: "9199880004",
    password: "Password@123",
    licenseNumber: "LIC-TEST-REJ-902",
    address: "200 Rejection Road",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400003",
  });

  // Admin user to reject and approve
  const adminHash = "$2b$10$dummyhashedpasswordforadminverification";
  const admin = await prisma.user.create({
    data: {
      email: "pharm.test.admin@medilink.com",
      passwordHash: adminHash,
      phone: "9199880099",
      role: UserRole.ADMIN,
      isActive: true,
      verificationStatus: VerificationStatus.NOT_REQUIRED,
    },
  });

  // Reject the second pharmacy with reason
  const rejReq = await prisma.verificationRequest.findFirst({
    where: { userId: rejectedPharm.user.id },
  });
  if (rejReq) {
    await VerificationService.rejectVerification(
      rejReq.id,
      admin.id,
      "Drug license expired on 2025-12-31"
    );
  }

  // Verified Pharmacy A
  const verifiedPharmA = await AuthService.registerPharmacy({
    pharmacyName: "Verified Pharmacy Alpha",
    ownerName: "Dr. Alpha",
    email: "pharm.test.verified.a@medilink.com",
    phone: "9199880005",
    password: "Password@123",
    licenseNumber: "LIC-TEST-VER-ALPHA",
    address: "500 Alpha Expressway",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
  });
  const verReqA = await prisma.verificationRequest.findFirst({
    where: { userId: verifiedPharmA.user.id },
  });
  if (verReqA) {
    await VerificationService.approveVerification(verReqA.id, admin.id);
  }

  // Verified Pharmacy B (for isolation testing)
  const verifiedPharmB = await AuthService.registerPharmacy({
    pharmacyName: "Verified Pharmacy Beta",
    ownerName: "Dr. Beta",
    email: "pharm.test.verified.b@medilink.com",
    phone: "9199880006",
    password: "Password@123",
    licenseNumber: "LIC-TEST-VER-BETA",
    address: "600 Beta Boulevard",
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440001",
  });
  const verReqB = await prisma.verificationRequest.findFirst({
    where: { userId: verifiedPharmB.user.id },
  });
  if (verReqB) {
    await VerificationService.approveVerification(verReqB.id, admin.id);
  }

  // Fetch updated tokens with latest verified claims
  const verifiedAToken = TokenService.signToken({
    sub: verifiedPharmA.user.id,
    email: verifiedPharmA.user.email,
    role: UserRole.PHARMACY,
  });

  const verifiedBToken = TokenService.signToken({
    sub: verifiedPharmB.user.id,
    email: verifiedPharmB.user.email,
    role: UserRole.PHARMACY,
  });

  // Start ephemeral HTTP server for live API tests
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  try {
    // -------------------------------------------------------------
    // 1. RBAC & ROLE RESTRICTIONS
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 1] RBAC & Role Restrictions");

    // Unauthenticated
    const unauthRes = await fetch(`${baseUrl}/pharmacy/dashboard`);
    assert(unauthRes.status === 401, "HTTP 401: Unauthenticated request to /pharmacy/* blocked");

    // Customer role
    const custRes = await fetch(`${baseUrl}/pharmacy/dashboard`, {
      headers: { Authorization: `Bearer ${customer.token}` },
    });
    assert(custRes.status === 403, "HTTP 403: Customer role blocked from /pharmacy/*");

    // Delivery Partner role
    const driverRes = await fetch(`${baseUrl}/pharmacy/dashboard`, {
      headers: { Authorization: `Bearer ${driver.token}` },
    });
    assert(driverRes.status === 403, "HTTP 403: Delivery Partner role blocked from /pharmacy/*");

    // -------------------------------------------------------------
    // 2. VERIFICATION GATING (LOGIN ACCESS != BUSINESS ACCESS)
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 2] Verification Gating (LOGIN != BUSINESS ACCESS)");

    // A. Pending Pharmacy: Dashboard & Profile allowed
    const pendDashRes = await fetch(`${baseUrl}/pharmacy/dashboard`, {
      headers: { Authorization: `Bearer ${pendingPharm.token}` },
    });
    assert(pendDashRes.status === 200, "HTTP 200: Pending pharmacy can access /pharmacy/dashboard");
    const pendDashJson: any = await pendDashRes.json();
    assert(
      pendDashJson.data?.pharmacy?.verificationStatus === VerificationStatus.PENDING,
      "Pending pharmacy sees PENDING verificationStatus in dashboard"
    );

    const pendProfRes = await fetch(`${baseUrl}/pharmacy/profile`, {
      headers: { Authorization: `Bearer ${pendingPharm.token}` },
    });
    assert(pendProfRes.status === 200, "HTTP 200: Pending pharmacy can access /pharmacy/profile");

    // B. Pending Pharmacy: Business operations strictly BLOCKED with 403
    const pendMedRes = await fetch(`${baseUrl}/pharmacy/medicines`, {
      headers: { Authorization: `Bearer ${pendingPharm.token}` },
    });
    assert(pendMedRes.status === 403, "HTTP 403: Pending pharmacy blocked from /pharmacy/medicines");

    const pendInvRes = await fetch(`${baseUrl}/pharmacy/inventory`, {
      headers: { Authorization: `Bearer ${pendingPharm.token}` },
    });
    assert(pendInvRes.status === 403, "HTTP 403: Pending pharmacy blocked from /pharmacy/inventory");

    const pendProfPatch = await fetch(`${baseUrl}/pharmacy/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${pendingPharm.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone: "9199889988" }),
    });
    assert(pendProfPatch.status === 403, "HTTP 403: Pending pharmacy blocked from updating profile");

    // C. Rejected Pharmacy: Dashboard allowed with rejection reason, business blocked
    const rejDashRes = await fetch(`${baseUrl}/pharmacy/dashboard`, {
      headers: { Authorization: `Bearer ${rejectedPharm.token}` },
    });
    assert(rejDashRes.status === 200, "HTTP 200: Rejected pharmacy can access /pharmacy/dashboard");
    const rejDashJson: any = await rejDashRes.json();
    assert(
      rejDashJson.data?.pharmacy?.verificationStatus === VerificationStatus.REJECTED,
      "Rejected pharmacy sees REJECTED status in dashboard"
    );
    assert(
      rejDashJson.data?.pharmacy?.rejectionReason === "Drug license expired on 2025-12-31",
      "Rejected pharmacy sees exact backend rejection reason"
    );

    const rejMedRes = await fetch(`${baseUrl}/pharmacy/medicines`, {
      headers: { Authorization: `Bearer ${rejectedPharm.token}` },
    });
    assert(rejMedRes.status === 403, "HTTP 403: Rejected pharmacy blocked from /pharmacy/medicines");

    // -------------------------------------------------------------
    // 3. MASTER MEDICINE CATALOG SEARCH & MEDICINE LISTINGS
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 3] Master Catalog & Medicine Listings");

    // Search catalog
    const catRes = await fetch(`${baseUrl}/pharmacy/medicines/catalog?search=Amlodipine`, {
      headers: { Authorization: `Bearer ${verifiedAToken}` },
    });
    assert(catRes.status === 200, "HTTP 200: Verified pharmacy can search master medicine catalog");
    const catJson: any = await catRes.json();
    assert(catJson.data.some((m: any) => m.id === medicineA.id), "Catalog search returns created test medicine");

    // Add medicine to Pharmacy A
    const addMedRes = await fetch(`${baseUrl}/pharmacy/medicines`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${verifiedAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        medicineId: medicineA.id,
        sellingPrice: 45.5,
        isAvailable: true,
      }),
    });
    assert(addMedRes.status === 201, "HTTP 201: Verified pharmacy adds medicine listing");
    const addMedJson: any = await addMedRes.json();
    const listingA = addMedJson.data.medicine;
    assert(listingA.sellingPrice === 45.5, "Medicine sellingPrice stored accurately as Decimal/Number");

    // Verify AuditLog for PHARMACY_MEDICINE_CREATED
    const medLog = await prisma.auditLog.findFirst({
      where: { action: "PHARMACY_MEDICINE_CREATED", entityId: listingA.id },
    });
    assert(medLog !== null, "AuditLog created for PHARMACY_MEDICINE_CREATED");

    // Duplicate listing prevention
    const dupRes = await fetch(`${baseUrl}/pharmacy/medicines`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${verifiedAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        medicineId: medicineA.id,
        sellingPrice: 50.0,
      }),
    });
    assert(dupRes.status === 400, "HTTP 400: Duplicate medicine listing for same pharmacy rejected");

    // Price validation: price <= 0 rejected
    const invalidPriceRes = await fetch(`${baseUrl}/pharmacy/medicines`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${verifiedAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        medicineId: medicineB.id,
        sellingPrice: -10,
      }),
    });
    assert(invalidPriceRes.status === 400, "HTTP 400: Negative selling price rejected");

    // Update listing price and availability
    const updateMedRes = await fetch(`${baseUrl}/pharmacy/medicines/${listingA.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${verifiedAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sellingPrice: 48.0,
        isAvailable: false,
      }),
    });
    assert(updateMedRes.status === 200, "HTTP 200: Pharmacy medicine price & availability updated");
    const updateMedJson: any = await updateMedRes.json();
    assert(updateMedJson.data.medicine.sellingPrice === 48.0, "Updated price confirmed");
    assert(updateMedJson.data.medicine.isAvailable === false, "Updated isAvailable confirmed");

    // Verify AuditLog for PHARMACY_MEDICINE_UPDATED
    const medUpdateLog = await prisma.auditLog.findFirst({
      where: { action: "PHARMACY_MEDICINE_UPDATED", entityId: listingA.id },
    });
    assert(medUpdateLog !== null, "AuditLog created for PHARMACY_MEDICINE_UPDATED");

    // Reset availability to true for batch tests
    await fetch(`${baseUrl}/pharmacy/medicines/${listingA.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${verifiedAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isAvailable: true }),
    });

    // -------------------------------------------------------------
    // 4. INVENTORY BATCH MANAGEMENT & STOCK INTEGRITY
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 4] Inventory Batch Management & Stock Integrity");

    const mfgDate = new Date("2026-01-01").toISOString();
    const expDate = new Date("2027-01-01").toISOString();

    // Valid batch creation
    const addBatchRes = await fetch(`${baseUrl}/pharmacy/inventory`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${verifiedAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pharmacyMedicineId: listingA.id,
        batchNumber: "BATCH-ALPHA-001",
        manufacturingDate: mfgDate,
        expiryDate: expDate,
        quantity: 100,
      }),
    });
    assert(addBatchRes.status === 201, "HTTP 201: Inventory batch created successfully");
    const addBatchJson: any = await addBatchRes.json();
    const batchA = addBatchJson.data.batch;
    assert(batchA.quantity === 100, "Batch total quantity is 100");
    assert(batchA.reservedQuantity === 0, "Batch reservedQuantity initialized to 0");
    assert(batchA.availableQuantity === 100, "availableQuantity computed as quantity - reservedQuantity");

    // Verify AuditLog for INVENTORY_BATCH_CREATED
    const batchLog = await prisma.auditLog.findFirst({
      where: { action: "INVENTORY_BATCH_CREATED", entityId: batchA.id },
    });
    assert(batchLog !== null, "AuditLog created for INVENTORY_BATCH_CREATED");

    // Duplicate batchNumber for same medicine listing rejected
    const dupBatchRes = await fetch(`${baseUrl}/pharmacy/inventory`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${verifiedAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pharmacyMedicineId: listingA.id,
        batchNumber: "BATCH-ALPHA-001",
        manufacturingDate: mfgDate,
        expiryDate: expDate,
        quantity: 50,
      }),
    });
    assert(dupBatchRes.status === 400, "HTTP 400: Duplicate batch number for same medicine rejected");

    // Invalid date validation: expiry <= manufacturing rejected
    const invalidDateRes = await fetch(`${baseUrl}/pharmacy/inventory`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${verifiedAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pharmacyMedicineId: listingA.id,
        batchNumber: "BATCH-ALPHA-INVALID-DATE",
        manufacturingDate: "2026-05-01",
        expiryDate: "2026-04-01", // earlier than mfg!
        quantity: 20,
      }),
    });
    assert(invalidDateRes.status === 400, "HTTP 400: Expiry date <= manufacturing date rejected");

    // Negative quantity rejected
    const negQtyRes = await fetch(`${baseUrl}/pharmacy/inventory`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${verifiedAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pharmacyMedicineId: listingA.id,
        batchNumber: "BATCH-NEG-QTY",
        expiryDate: expDate,
        quantity: -5,
      }),
    });
    assert(negQtyRes.status === 400, "HTTP 400: Negative batch quantity rejected");

    // Simulate reservation and test stock integrity on update
    await prisma.inventoryBatch.update({
      where: { id: batchA.id },
      data: { reservedQuantity: 25 },
    });

    // Verify stock computation
    const getBatchRes = await fetch(`${baseUrl}/pharmacy/inventory/${batchA.id}`, {
      headers: { Authorization: `Bearer ${verifiedAToken}` },
    });
    const getBatchJson: any = await getBatchRes.json();
    assert(getBatchJson.data.batch.quantity === 100, "Batch total quantity is 100");
    assert(getBatchJson.data.batch.reservedQuantity === 25, "Batch reserved quantity is 25");
    assert(getBatchJson.data.batch.availableQuantity === 75, "availableQuantity computed as 100 - 25 = 75");

    // Cannot reduce stock below reserved quantity
    const reduceBelowReserved = await fetch(`${baseUrl}/pharmacy/inventory/${batchA.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${verifiedAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity: 20 }), // below 25!
    });
    assert(reduceBelowReserved.status === 400, "HTTP 400: Cannot reduce quantity below reserved count");

    // Valid stock adjustment
    const validAdjust = await fetch(`${baseUrl}/pharmacy/inventory/${batchA.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${verifiedAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity: 150 }),
    });
    assert(validAdjust.status === 200, "HTTP 200: Valid quantity update accepted");
    const adjustJson: any = await validAdjust.json();
    assert(adjustJson.data.batch.availableQuantity === 125, "availableQuantity updated to 150 - 25 = 125");

    // -------------------------------------------------------------
    // 5. CROSS-PHARMACY ISOLATION
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 5] Cross-Pharmacy Isolation");

    // Pharmacy B tries to access Pharmacy A's medicine listing
    const crossMedGet = await fetch(`${baseUrl}/pharmacy/medicines/${listingA.id}`, {
      headers: { Authorization: `Bearer ${verifiedBToken}` },
    });
    assert(crossMedGet.status === 404, "HTTP 404: Pharmacy B cannot view Pharmacy A's medicine listing");

    // Pharmacy B tries to update Pharmacy A's medicine listing
    const crossMedPatch = await fetch(`${baseUrl}/pharmacy/medicines/${listingA.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${verifiedBToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sellingPrice: 99.9 }),
    });
    assert(crossMedPatch.status === 404, "HTTP 404: Pharmacy B cannot update Pharmacy A's medicine listing");

    // Pharmacy B tries to delete Pharmacy A's medicine listing
    const crossMedDel = await fetch(`${baseUrl}/pharmacy/medicines/${listingA.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${verifiedBToken}` },
    });
    assert(crossMedDel.status === 404, "HTTP 404: Pharmacy B cannot delete Pharmacy A's medicine listing");

    // Pharmacy B tries to view Pharmacy A's inventory batch
    const crossBatchGet = await fetch(`${baseUrl}/pharmacy/inventory/${batchA.id}`, {
      headers: { Authorization: `Bearer ${verifiedBToken}` },
    });
    assert(crossBatchGet.status === 404, "HTTP 404: Pharmacy B cannot view Pharmacy A's inventory batch");

    // Pharmacy B tries to update Pharmacy A's inventory batch
    const crossBatchPatch = await fetch(`${baseUrl}/pharmacy/inventory/${batchA.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${verifiedBToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity: 0 }),
    });
    assert(crossBatchPatch.status === 404, "HTTP 404: Pharmacy B cannot update Pharmacy A's inventory batch");

    // -------------------------------------------------------------
    // 6. PROFILE MANAGEMENT & IMMUTABILITY
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 6] Profile Management & Immutability");

    const profRes = await fetch(`${baseUrl}/pharmacy/profile`, {
      headers: { Authorization: `Bearer ${verifiedAToken}` },
    });
    assert(profRes.status === 200, "HTTP 200: Pharmacy can read profile");
    const profJson: any = await profRes.json();
    assert(profJson.data.pharmacy.licenseNumber === "LIC-TEST-VER-ALPHA", "License number returned");
    assert(!("passwordHash" in (profJson.data.pharmacy.owner as any)), "Zero passwordHash leak in profile");

    // Update editable fields
    const updateProfRes = await fetch(`${baseUrl}/pharmacy/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${verifiedAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: "9199881122",
        address: "555 Updated Alpha Street",
        city: "Pune Updated",
        licenseNumber: "LIC-ATTEMPT-HACK", // Attempt to change immutable field
        isVerified: false, // Attempt to manipulate verification
      }),
    });
    assert(updateProfRes.status === 200, "HTTP 200: Profile update succeeded");
    const updateProfJson: any = await updateProfRes.json();
    assert(updateProfJson.data.pharmacy.phone === "9199881122", "Phone updated");
    assert(updateProfJson.data.pharmacy.address === "555 Updated Alpha Street", "Address updated");
    assert(updateProfJson.data.pharmacy.licenseNumber === "LIC-TEST-VER-ALPHA", "Immutable licenseNumber remained UNCHANGED");
    assert(updateProfJson.data.pharmacy.isVerified === true, "Immutable isVerified remained UNCHANGED");

    // Verify AuditLog for PHARMACY_PROFILE_UPDATED
    const profLog = await prisma.auditLog.findFirst({
      where: {
        action: "PHARMACY_PROFILE_UPDATED",
        entityId: verifiedPharmA.user.pharmacy!.id,
      },
    });
    assert(profLog !== null, "AuditLog created for PHARMACY_PROFILE_UPDATED");

    // -------------------------------------------------------------
    // 7. REAL-TIME DASHBOARD METRICS
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 7] Dynamic Dashboard Metrics");

    const dashRes = await fetch(`${baseUrl}/pharmacy/dashboard`, {
      headers: { Authorization: `Bearer ${verifiedAToken}` },
    });
    assert(dashRes.status === 200, "HTTP 200: Verified pharmacy accesses dashboard");
    const dashJson: any = await dashRes.json();
    const metrics = dashJson.data.metrics;
    assert(metrics.totalMedicines === 1, "totalMedicines count is 1");
    assert(metrics.activeMedicines === 1, "activeMedicines count is 1");
    assert(metrics.totalInventoryUnits === 125, "totalInventoryUnits matches available batch units (125)");
    assert(metrics.outOfStockMedicines === 0, "outOfStockMedicines is 0 because stock > 0");
    assert(Array.isArray(dashJson.data.recentBatches), "recentBatches returns an array");
    assert(dashJson.data.recentBatches.length >= 1, "recentBatches contains created batch");

    console.log("\n==================================================");
    console.log(`  ALL ${passedCount}/${totalCount} PHASE 5 PHARMACY TESTS PASSED!`);
    console.log("==================================================");
  } finally {
    server.close();
    await cleanup();
  }
}

runTests()
  .catch((err) => {
    console.error("Pharmacy test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
