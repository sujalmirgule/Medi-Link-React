import app from "../app";
import { prisma } from "../lib/prisma";
import { AuthService } from "../modules/auth/auth.service";
import { TokenService } from "../modules/auth/token.service";
import { VerificationService } from "../modules/verification/verification.service";
import { UserRole, VerificationStatus, FulfillmentType, OrderStatus, Prisma } from "@prisma/client";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function cleanup() {
  const testEmails = [
    "order.test.customer.a@medilink.com",
    "order.test.customer.b@medilink.com",
    "order.test.pharmacy.a@medilink.com",
    "order.test.pharmacy.b@medilink.com",
    "order.test.pharmacy.unverified@medilink.com",
    "order.test.admin@medilink.com",
  ];

  await prisma.review.deleteMany({ where: { customer: { email: { in: testEmails } } } });
  await prisma.orderItem.deleteMany({
    where: {
      order: {
        OR: [
          { customer: { email: { in: testEmails } } },
          { pharmacy: { email: { in: testEmails } } },
        ],
      },
    },
  });
  await prisma.delivery.deleteMany({
    where: {
      order: {
        OR: [
          { customer: { email: { in: testEmails } } },
          { pharmacy: { email: { in: testEmails } } },
        ],
      },
    },
  });
  await prisma.order.deleteMany({
    where: {
      OR: [
        { customer: { email: { in: testEmails } } },
        { pharmacy: { email: { in: testEmails } } },
      ],
    },
  });
  await prisma.address.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.inventoryBatch.deleteMany({
    where: { pharmacyMedicine: { pharmacy: { email: { in: testEmails } } } },
  });
  await prisma.pharmacyMedicine.deleteMany({
    where: { pharmacy: { email: { in: testEmails } } },
  });
  await prisma.pharmacyStaff.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.pharmacy.deleteMany({ where: { email: { in: testEmails } } });
  await prisma.customerProfile.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.verificationRequest.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.auditLog.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });

  await prisma.medicine.deleteMany({
    where: { name: { startsWith: "OrderTestMed-" } },
  });
  await prisma.medicineCategory.deleteMany({
    where: { name: { startsWith: "OrderTestCat-" } },
  });
}

async function runTests() {
  console.log("==================================================");
  console.log("   MediLink Phase 7: Order Management & Stock     ");
  console.log("==================================================");

  await cleanup();

  // 1. Setup Admin
  const admin = await prisma.user.create({
    data: {
      email: "order.test.admin@medilink.com",
      passwordHash: "$2b$10$dummyhashedpasswordforadmintesting",
      role: UserRole.ADMIN,
      isActive: true,
      verificationStatus: VerificationStatus.NOT_REQUIRED,
    },
  });

  // 2. Setup Customer A & B
  const customerA = await AuthService.registerCustomer({
    fullName: "Alice Customer",
    email: "order.test.customer.a@medilink.com",
    password: "Password@123",
    phone: "9198110001",
  });

  const customerB = await AuthService.registerCustomer({
    fullName: "Bob Customer",
    email: "order.test.customer.b@medilink.com",
    password: "Password@123",
    phone: "9198110002",
  });

  const tokenCustomerA = customerA.token;
  const tokenCustomerB = customerB.token;

  // 3. Setup Customer A delivery address
  const addressA = await prisma.address.create({
    data: {
      userId: customerA.user.id,
      label: "Home",
      addressLine1: "101 Lotus Residency",
      city: "Kalyan",
      state: "Maharashtra",
      pincode: "421301",
      isDefault: true,
    },
  });

  // 4. Setup Verified Pharmacy A & B
  const registeredPharmA = await AuthService.registerPharmacy({
    pharmacyName: "LifeCare Apex Pharmacy",
    ownerName: "Dr. Apex",
    email: "order.test.pharmacy.a@medilink.com",
    phone: "9198220001",
    password: "Password@123",
    licenseNumber: "LIC-ORDER-APEX-01",
    address: "100 Medical Square",
    city: "Kalyan",
    state: "Maharashtra",
    pincode: "421301",
  });
  const verReqA = await prisma.verificationRequest.findFirst({
    where: { userId: registeredPharmA.user.id },
  });
  if (verReqA) {
    await VerificationService.approveVerification(verReqA.id, admin.id);
  }

  const registeredPharmB = await AuthService.registerPharmacy({
    pharmacyName: "HealthHub Boulevard",
    ownerName: "Dr. Boulevard",
    email: "order.test.pharmacy.b@medilink.com",
    phone: "9198220002",
    password: "Password@123",
    licenseNumber: "LIC-ORDER-BOULEVARD-02",
    address: "200 Health Way",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
  });
  const verReqB = await prisma.verificationRequest.findFirst({
    where: { userId: registeredPharmB.user.id },
  });
  if (verReqB) {
    await VerificationService.approveVerification(verReqB.id, admin.id);
  }

  // 5. Setup Unverified Pharmacy
  const registeredPharmUnver = await AuthService.registerPharmacy({
    pharmacyName: "Unverified MediStore",
    ownerName: "Dr. Pending",
    email: "order.test.pharmacy.unverified@medilink.com",
    phone: "9198220003",
    password: "Password@123",
    licenseNumber: "LIC-ORDER-UNVER-03",
    address: "300 Pending Lane",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
  });

  // Tokens for pharmacies
  const tokenPharmA = TokenService.signToken({
    sub: registeredPharmA.user.id,
    email: registeredPharmA.user.email,
    role: UserRole.PHARMACY,
  });

  const tokenPharmB = TokenService.signToken({
    sub: registeredPharmB.user.id,
    email: registeredPharmB.user.email,
    role: UserRole.PHARMACY,
  });

  const tokenPharmUnver = TokenService.signToken({
    sub: registeredPharmUnver.user.id,
    email: registeredPharmUnver.user.email,
    role: UserRole.PHARMACY,
  });

  // Fetch created pharmacy records
  const pharmacyA = await prisma.pharmacy.findFirst({
    where: { ownerUserId: registeredPharmA.user.id },
  });
  const pharmacyB = await prisma.pharmacy.findFirst({
    where: { ownerUserId: registeredPharmB.user.id },
  });
  const pharmacyUnver = await prisma.pharmacy.findFirst({
    where: { ownerUserId: registeredPharmUnver.user.id },
  });

  // 6. Setup Category & Master Medicines
  const category = await prisma.medicineCategory.create({
    data: {
      name: "OrderTestCat-PainRelief",
      description: "Analgesics and antipyretics",
    },
  });

  const med1 = await prisma.medicine.create({
    data: {
      name: "OrderTestMed-Paracetamol-650",
      genericName: "Paracetamol",
      composition: "Paracetamol IP 650mg",
      manufacturer: "Cipla Ltd.",
      categoryId: category.id,
    },
  });

  const med2 = await prisma.medicine.create({
    data: {
      name: "OrderTestMed-Ibuprofen-400",
      genericName: "Ibuprofen",
      composition: "Ibuprofen IP 400mg",
      manufacturer: "Abbott",
      categoryId: category.id,
    },
  });

  // 7. Setup Pharmacy A listings & inventory batches
  const pmA1 = await prisma.pharmacyMedicine.create({
    data: {
      pharmacyId: pharmacyA!.id,
      medicineId: med1.id,
      sellingPrice: new Prisma.Decimal(32.5),
      isAvailable: true,
    },
  });

  // Valid batch with 50 units (0 reserved)
  const batchA1 = await prisma.inventoryBatch.create({
    data: {
      pharmacyMedicineId: pmA1.id,
      batchNumber: "BATCH-A1-VALID",
      quantity: 50,
      reservedQuantity: 0,
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months in future
    },
  });

  // Second medicine for Pharmacy A (limited stock = 2 units)
  const pmA2 = await prisma.pharmacyMedicine.create({
    data: {
      pharmacyId: pharmacyA!.id,
      medicineId: med2.id,
      sellingPrice: new Prisma.Decimal(45.0),
      isAvailable: true,
    },
  });

  const batchA2 = await prisma.inventoryBatch.create({
    data: {
      pharmacyMedicineId: pmA2.id,
      batchNumber: "BATCH-A2-LIMITED",
      quantity: 2,
      reservedQuantity: 0,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  // Pharmacy B listing
  const pmB1 = await prisma.pharmacyMedicine.create({
    data: {
      pharmacyId: pharmacyB!.id,
      medicineId: med1.id,
      sellingPrice: new Prisma.Decimal(30.0),
      isAvailable: true,
    },
  });

  await prisma.inventoryBatch.create({
    data: {
      pharmacyMedicineId: pmB1.id,
      batchNumber: "BATCH-B1-VALID",
      quantity: 20,
      reservedQuantity: 0,
      expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
    },
  });

  // Start ephemeral server
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  try {
    // -------------------------------------------------------------
    // 1. ORDER CREATION VALIDATIONS
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 1] Order Creation Validations & Guards");

    // Test 1: Unauthenticated request rejected
    const unauthRes = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pharmacyId: pharmacyA!.id,
        fulfillmentType: "PICKUP",
        items: [{ pharmacyMedicineId: pmA1.id, quantity: 2 }],
      }),
    });
    assert(unauthRes.status === 401, "HTTP 401: Unauthenticated order placement rejected");

    // Test 2: Pharmacy cannot place customer order
    const pharmAsCustRes = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenPharmA}`,
      },
      body: JSON.stringify({
        pharmacyId: pharmacyA!.id,
        fulfillmentType: "PICKUP",
        items: [{ pharmacyMedicineId: pmA1.id, quantity: 2 }],
      }),
    });
    assert(pharmAsCustRes.status === 403, "HTTP 403: Pharmacy role forbidden from customer order placement");

    // Test 3: Home delivery requires address
    const missingAddrRes = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenCustomerA}`,
      },
      body: JSON.stringify({
        pharmacyId: pharmacyA!.id,
        fulfillmentType: "HOME_DELIVERY",
        deliveryAddressId: null,
        items: [{ pharmacyMedicineId: pmA1.id, quantity: 2 }],
      }),
    });
    assert(missingAddrRes.status === 400, "HTTP 400: Home delivery without address rejected");

    // Test 4: Home delivery with another customer's address rejected
    const foreignAddrRes = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenCustomerB}`, // Customer B using Customer A's address
      },
      body: JSON.stringify({
        pharmacyId: pharmacyA!.id,
        fulfillmentType: "HOME_DELIVERY",
        deliveryAddressId: addressA.id,
        items: [{ pharmacyMedicineId: pmA1.id, quantity: 2 }],
      }),
    });
    assert(foreignAddrRes.status === 400, "HTTP 400: Cross-customer address manipulation rejected");

    // Test 5: Order for unverified pharmacy rejected
    const unverPharmOrderRes = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenCustomerA}`,
      },
      body: JSON.stringify({
        pharmacyId: pharmacyUnver!.id,
        fulfillmentType: "PICKUP",
        items: [{ pharmacyMedicineId: pmA1.id, quantity: 2 }],
      }),
    });
    assert(unverPharmOrderRes.status === 400, "HTTP 400: Order to unverified pharmacy rejected");

    // Test 6: Items belonging to wrong pharmacy rejected
    const wrongPharmItemRes = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenCustomerA}`,
      },
      body: JSON.stringify({
        pharmacyId: pharmacyA!.id,
        fulfillmentType: "PICKUP",
        items: [
          { pharmacyMedicineId: pmA1.id, quantity: 2 },
          { pharmacyMedicineId: pmB1.id, quantity: 1 }, // Belongs to Pharmacy B!
        ],
      }),
    });
    assert(wrongPharmItemRes.status === 400, "HTTP 400: Cross-pharmacy items in single order rejected");

    // Test 7: Insufficient stock rejected
    const exceedStockRes = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenCustomerA}`,
      },
      body: JSON.stringify({
        pharmacyId: pharmacyA!.id,
        fulfillmentType: "PICKUP",
        items: [{ pharmacyMedicineId: pmA2.id, quantity: 10 }], // Only 2 available!
      }),
    });
    assert(exceedStockRes.status === 400, "HTTP 400: Requested quantity exceeding available stock rejected");

    // -------------------------------------------------------------
    // 2. SUCCESSFUL ORDER CREATION & ATOMIC STOCK RESERVATION
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 2] Successful Order Creation & Atomic Stock Reservation");

    // Test 8: Valid PICKUP order
    const order1Res = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenCustomerA}`,
      },
      body: JSON.stringify({
        pharmacyId: pharmacyA!.id,
        fulfillmentType: "PICKUP",
        items: [{ pharmacyMedicineId: pmA1.id, quantity: 3 }],
      }),
    });
    assert(order1Res.status === 201, "HTTP 201: Customer A places valid PICKUP order");
    const order1Data = await order1Res.json();
    const order1 = order1Data.data.order;

    assert(order1.orderStatus === "PENDING", "Order status is PENDING");
    assert(order1.fulfillmentType === "PICKUP", "Fulfillment type is PICKUP");
    assert(order1.deliveryFee === 0, "Delivery fee for PICKUP is ₹0");
    assert(order1.subtotal === 32.5 * 3, "Subtotal calculated server-side from PharmacyMedicine price (97.5)");
    assert(order1.totalAmount === 97.5, "Total amount matches subtotal");

    // Test 9: Batch reservedQuantity incremented atomically
    const batchA1AfterOrder = await prisma.inventoryBatch.findUnique({
      where: { id: batchA1.id },
    });
    assert(batchA1AfterOrder!.reservedQuantity === 3, "Batch reservedQuantity incremented to 3");
    assert(
      batchA1AfterOrder!.quantity - batchA1AfterOrder!.reservedQuantity === 47,
      "Available quantity decreased to 47 (50 - 3)"
    );

    // Test 10: Valid HOME_DELIVERY order with address
    const order2Res = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenCustomerA}`,
      },
      body: JSON.stringify({
        pharmacyId: pharmacyA!.id,
        fulfillmentType: "HOME_DELIVERY",
        deliveryAddressId: addressA.id,
        items: [{ pharmacyMedicineId: pmA1.id, quantity: 2 }],
      }),
    });
    assert(order2Res.status === 201, "HTTP 201: Customer A places valid HOME_DELIVERY order");
    const order2Data = await order2Res.json();
    const order2 = order2Data.data.order;

    assert(order2.fulfillmentType === "HOME_DELIVERY", "Fulfillment type is HOME_DELIVERY");
    assert(order2.deliveryFee === 30, "Delivery fee is ₹30 for HOME_DELIVERY");
    assert(order2.totalAmount === 32.5 * 2 + 30, "Total amount includes subtotal + delivery fee (95.00)");
    assert(order2.deliveryAddress.pincode === "421301", "Delivery address details preserved");

    const batchA1AfterOrder2 = await prisma.inventoryBatch.findUnique({
      where: { id: batchA1.id },
    });
    assert(batchA1AfterOrder2!.reservedQuantity === 5, "Batch reservedQuantity increased to 5 (3 + 2)");

    // -------------------------------------------------------------
    // 3. CONCURRENCY & RACE CONDITIONS
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 3] Concurrency & Race Condition Protection");

    // pmA2 has batchA2 with quantity = 2, reserved = 0. Available = 2.
    // Two simultaneous requests each ordering 2 units.
    // Exactly one should succeed, and one should fail.
    const [concurrent1, concurrent2] = await Promise.all([
      fetch(`${baseUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerA}`,
        },
        body: JSON.stringify({
          pharmacyId: pharmacyA!.id,
          fulfillmentType: "PICKUP",
          items: [{ pharmacyMedicineId: pmA2.id, quantity: 2 }],
        }),
      }),
      fetch(`${baseUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerB}`,
        },
        body: JSON.stringify({
          pharmacyId: pharmacyA!.id,
          fulfillmentType: "PICKUP",
          items: [{ pharmacyMedicineId: pmA2.id, quantity: 2 }],
        }),
      }),
    ]);

    const statuses = [concurrent1.status, concurrent2.status];
    const successCount = statuses.filter((s) => s === 201).length;
    const failCount = statuses.filter((s) => s === 400).length;

    assert(successCount === 1, "Exactly one concurrent order succeeded with HTTP 201");
    assert(failCount === 1, "The competing concurrent order was rejected with HTTP 400");

    const batchA2AfterRace = await prisma.inventoryBatch.findUnique({
      where: { id: batchA2.id },
    });
    assert(batchA2AfterRace!.reservedQuantity === 2, "Batch reservedQuantity is strictly 2 (no overselling)");
    assert(batchA2AfterRace!.quantity - batchA2AfterRace!.reservedQuantity === 0, "Available stock is strictly 0");

    // -------------------------------------------------------------
    // 4. PHARMACY ORDER WORKFLOW & STATUS TRANSITIONS
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 4] Pharmacy Order Processing & State Machine");

    // Test 11: Pharmacy sees only its own orders
    const pharmAOrdersRes = await fetch(`${baseUrl}/pharmacy/orders`, {
      headers: { Authorization: `Bearer ${tokenPharmA}` },
    });
    assert(pharmAOrdersRes.status === 200, "HTTP 200: Pharmacy A queries orders");
    const pharmAOrdersData = await pharmAOrdersRes.json();
    assert(pharmAOrdersData.data.length >= 3, "Pharmacy A sees its received orders");

    const pharmBOrdersRes = await fetch(`${baseUrl}/pharmacy/orders`, {
      headers: { Authorization: `Bearer ${tokenPharmB}` },
    });
    const pharmBOrdersData = await pharmBOrdersRes.json();
    assert(pharmBOrdersData.data.length === 0, "Pharmacy B sees 0 orders (strict isolation)");

    // Test 12: Pharmacy A accepts order 1
    const acceptRes = await fetch(`${baseUrl}/pharmacy/orders/${order1.id}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenPharmA}` },
    });
    assert(acceptRes.status === 200, "HTTP 200: Pharmacy A accepts PENDING order");
    const acceptData = await acceptRes.json();
    assert(acceptData.data.order.orderStatus === "ACCEPTED", "Order transitioned to ACCEPTED");

    // Reservation remains intact after acceptance
    const batchA1AfterAccept = await prisma.inventoryBatch.findUnique({
      where: { id: batchA1.id },
    });
    assert(batchA1AfterAccept!.reservedQuantity === 5, "Reserved stock remains reserved when order is ACCEPTED");

    // Test 13: Move ACCEPTED -> PREPARING
    const prepRes = await fetch(`${baseUrl}/pharmacy/orders/${order1.id}/preparing`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenPharmA}` },
    });
    assert(prepRes.status === 200, "HTTP 200: Pharmacy A marks order as PREPARING");
    const prepData = await prepRes.json();
    assert(prepData.data.order.orderStatus === "PREPARING", "Order transitioned to PREPARING");

    // Test 14: Move PREPARING -> READY_FOR_PICKUP
    const readyRes = await fetch(`${baseUrl}/pharmacy/orders/${order1.id}/ready`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenPharmA}` },
    });
    assert(readyRes.status === 200, "HTTP 200: Pharmacy A marks order as READY_FOR_PICKUP");
    const readyData = await readyRes.json();
    assert(readyData.data.order.orderStatus === "READY_FOR_PICKUP", "Order transitioned to READY_FOR_PICKUP");

    // Test 15: Invalid transition rejected (READY_FOR_PICKUP -> PREPARING)
    const invalidTransRes = await fetch(`${baseUrl}/pharmacy/orders/${order1.id}/preparing`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenPharmA}` },
    });
    assert(invalidTransRes.status === 400, "HTTP 400: Invalid state machine backward transition rejected");

    // -------------------------------------------------------------
    // 5. ORDER REJECTION & ATOMIC STOCK RELEASE
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 5] Order Rejection & Atomic Stock Release");

    // Test 16: Rejecting without reason rejected
    const rejNoReasonRes = await fetch(`${baseUrl}/pharmacy/orders/${order2.id}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenPharmA}`,
      },
      body: JSON.stringify({ reason: "" }),
    });
    assert(rejNoReasonRes.status === 400, "HTTP 400: Rejection without valid reason rejected");

    // Test 17: Valid rejection with reason releases reserved stock
    const preRejBatch = await prisma.inventoryBatch.findUnique({
      where: { id: batchA1.id },
    });
    const reservedBeforeRejection = preRejBatch!.reservedQuantity; // 5

    const rejectRes = await fetch(`${baseUrl}/pharmacy/orders/${order2.id}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenPharmA}`,
      },
      body: JSON.stringify({
        reason: "Medicine temporarily out of stock due to physical inventory discrepancy",
      }),
    });
    assert(rejectRes.status === 200, "HTTP 200: Pharmacy A rejects PENDING order with reason");
    const rejectData = await rejectRes.json();
    assert(rejectData.data.order.orderStatus === "REJECTED", "Order transitioned to REJECTED");
    assert(
      rejectData.data.order.cancellationReason ===
        "Medicine temporarily out of stock due to physical inventory discrepancy",
      "Rejection reason stored in cancellationReason"
    );

    // Verify reserved quantity was released by exactly order2's quantity (2 units)
    const postRejBatch = await prisma.inventoryBatch.findUnique({
      where: { id: batchA1.id },
    });
    assert(
      postRejBatch!.reservedQuantity === reservedBeforeRejection - 2,
      `Reserved stock released: was ${reservedBeforeRejection}, now ${postRejBatch!.reservedQuantity}`
    );

    // -------------------------------------------------------------
    // 6. CUSTOMER ORDER HISTORY & ISOLATION
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 6] Customer Order History & Cross-Customer Isolation");

    // Test 18: Customer A views order history
    const custAOrdersRes = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenCustomerA}` },
    });
    assert(custAOrdersRes.status === 200, "HTTP 200: Customer A retrieves order history");
    const custAOrdersData = await custAOrdersRes.json();
    assert(custAOrdersData.data.length >= 2, "Customer A sees placed orders");

    // Test 19: Customer B cannot view Customer A's order details
    const crossOrderRes = await fetch(`${baseUrl}/orders/${order1.id}`, {
      headers: { Authorization: `Bearer ${tokenCustomerB}` },
    });
    assert(crossOrderRes.status === 404, "HTTP 404: Customer B cannot access Customer A's order details");

    // Test 20: Customer A can view own order details
    const ownOrderRes = await fetch(`${baseUrl}/orders/${order1.id}`, {
      headers: { Authorization: `Bearer ${tokenCustomerA}` },
    });
    assert(ownOrderRes.status === 200, "HTTP 200: Customer A accesses own order details");
    const ownOrderData = await ownOrderRes.json();
    assert(ownOrderData.data.order.id === order1.id, "Correct order details returned");

    // -------------------------------------------------------------
    // 7. AUDIT LOG GENERATION
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 7] Audit Logging & Compliance");

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entity: "Order",
        entityId: order1.id,
      },
    });
    assert(auditLogs.length >= 3, "Audit logs created for Order Created, Accepted, Preparing, and Ready");

    console.log("\n==================================================");
    console.log("  ALL 30/30 PHASE 7 ORDER TESTS PASSED!");
    console.log("==================================================");
  } finally {
    server.close();
  }
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
