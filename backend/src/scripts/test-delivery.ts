import app from "../app";
import { prisma } from "../lib/prisma";
import { AuthService } from "../modules/auth/auth.service";
import { TokenService } from "../modules/auth/token.service";
import { VerificationService } from "../modules/verification/verification.service";
import { OrderService } from "../modules/order/order.service";
import {
  UserRole,
  VerificationStatus,
  FulfillmentType,
  OrderStatus,
  DeliveryStatus,
  Prisma,
} from "@prisma/client";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

const testEmails = [
  "deliv.test.admin@medilink.com",
  "deliv.test.customer.a@medilink.com",
  "deliv.test.customer.b@medilink.com",
  "deliv.test.pharmacy.a@medilink.com",
  "deliv.test.partner.1@medilink.com",
  "deliv.test.partner.2@medilink.com",
  "deliv.test.partner.pending@medilink.com",
  "deliv.test.partner.rejected@medilink.com",
];

async function cleanup() {
  await prisma.notification.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.auditLog.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.deliveryEvent.deleteMany({
    where: {
      delivery: {
        order: { customer: { email: { in: testEmails } } },
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
  await prisma.order.deleteMany({
    where: {
      OR: [
        { customer: { email: { in: testEmails } } },
        { pharmacy: { email: { in: testEmails } } },
      ],
    },
  });
  await prisma.address.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.inventoryBatch.deleteMany({
    where: { pharmacyMedicine: { pharmacy: { email: { in: testEmails } } } },
  });
  await prisma.pharmacyMedicine.deleteMany({
    where: { pharmacy: { email: { in: testEmails } } },
  });
  await prisma.medicine.deleteMany({
    where: { name: { startsWith: "DelivTestMed" } },
  });
  await prisma.medicineCategory.deleteMany({
    where: { name: { startsWith: "DelivTestCat" } },
  });
  await prisma.verificationRequest.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.deliveryPartner.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.pharmacy.deleteMany({
    where: { owner: { email: { in: testEmails } } },
  });
  await prisma.customerProfile.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });
}

async function runTests() {
  console.log("==================================================");
  console.log("   MediLink Phase 8: Delivery Lifecycle Tests     ");
  console.log("==================================================");

  await cleanup();

  // 1. Setup Admin
  const admin = await prisma.user.create({
    data: {
      email: "deliv.test.admin@medilink.com",
      passwordHash: "$2b$10$dummyhashedpasswordforadmintesting",
      role: UserRole.ADMIN,
      isActive: true,
      verificationStatus: VerificationStatus.NOT_REQUIRED,
    },
  });
  const tokenAdmin = TokenService.signToken({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
  });

  // 2. Setup Customer A & B
  const customerA = await AuthService.registerCustomer({
    fullName: "Alice DelivCustomer",
    email: "deliv.test.customer.a@medilink.com",
    password: "Password@123",
    phone: "9198330001",
  });
  const customerB = await AuthService.registerCustomer({
    fullName: "Bob DelivCustomer",
    email: "deliv.test.customer.b@medilink.com",
    password: "Password@123",
    phone: "9198330002",
  });
  const tokenCustomerA = customerA.token;
  const tokenCustomerB = customerB.token;

  // Address for Customer A
  const addressA = await prisma.address.create({
    data: {
      userId: customerA.user.id,
      label: "Home",
      addressLine1: "402 Sunrise Heights",
      city: "Kalyan",
      state: "Maharashtra",
      pincode: "421301",
      isDefault: true,
    },
  });

  // 3. Setup Verified Pharmacy
  const regPharmA = await AuthService.registerPharmacy({
    pharmacyName: "HealthFirst Deliv Pharmacy",
    ownerName: "Dr. Health",
    email: "deliv.test.pharmacy.a@medilink.com",
    phone: "9198330010",
    password: "Password@123",
    licenseNumber: `LIC-DELIV-${Date.now()}`,
    address: "Shop 12 Station Road",
    city: "Kalyan",
    state: "Maharashtra",
    pincode: "421301",
  });
  const pharmAApp = await prisma.verificationRequest.findFirst({
    where: { userId: regPharmA.user.id },
  });
  if (pharmAApp) {
    await VerificationService.approveVerification(pharmAApp.id, admin.id);
  }
  const pharmacyA = await prisma.pharmacy.findFirst({
    where: { ownerUserId: regPharmA.user.id },
  });

  // 4. Setup Delivery Partners
  // Partner 1: Verified, Active, Available
  const regPartner1 = await AuthService.registerDeliveryPartner({
    fullName: "Dave Partner One",
    email: "deliv.test.partner.1@medilink.com",
    phone: "9198330021",
    password: "Password@123",
    address: "Kalyan West",
    city: "Kalyan",
    state: "Maharashtra",
    pincode: "421301",
  });
  const p1App = await prisma.verificationRequest.findFirst({
    where: { userId: regPartner1.user.id },
  });
  if (p1App) {
    await VerificationService.approveVerification(p1App.id, admin.id);
  }
  const partner1 = await prisma.deliveryPartner.findFirst({
    where: { userId: regPartner1.user.id },
  });
  await prisma.deliveryPartner.update({
    where: { id: partner1!.id },
    data: { isAvailable: true },
  });
  const tokenPartner1 = TokenService.signToken({
    sub: regPartner1.user.id,
    email: regPartner1.user.email,
    role: UserRole.DELIVERY_PARTNER,
  });

  // Partner 2: Verified, Active, Available
  const regPartner2 = await AuthService.registerDeliveryPartner({
    fullName: "Elena Partner Two",
    email: "deliv.test.partner.2@medilink.com",
    phone: "9198330022",
    password: "Password@123",
    address: "Kalyan East",
    city: "Kalyan",
    state: "Maharashtra",
    pincode: "421301",
  });
  const p2App = await prisma.verificationRequest.findFirst({
    where: { userId: regPartner2.user.id },
  });
  if (p2App) {
    await VerificationService.approveVerification(p2App.id, admin.id);
  }
  const partner2 = await prisma.deliveryPartner.findFirst({
    where: { userId: regPartner2.user.id },
  });
  await prisma.deliveryPartner.update({
    where: { id: partner2!.id },
    data: { isAvailable: true },
  });
  const tokenPartner2 = TokenService.signToken({
    sub: regPartner2.user.id,
    email: regPartner2.user.email,
    role: UserRole.DELIVERY_PARTNER,
  });

  // Partner 3: Pending verification
  const regPartnerPending = await AuthService.registerDeliveryPartner({
    fullName: "Frank Partner Pending",
    email: "deliv.test.partner.pending@medilink.com",
    phone: "9198330023",
    password: "Password@123",
    address: "Kalyan West",
    city: "Kalyan",
    state: "Maharashtra",
    pincode: "421301",
  });
  const partnerPending = await prisma.deliveryPartner.findFirst({
    where: { userId: regPartnerPending.user.id },
  });
  const tokenPartnerPending = TokenService.signToken({
    sub: regPartnerPending.user.id,
    email: regPartnerPending.user.email,
    role: UserRole.DELIVERY_PARTNER,
  });

  // Partner 4: Rejected verification
  const regPartnerRejected = await AuthService.registerDeliveryPartner({
    fullName: "Grace Partner Rejected",
    email: "deliv.test.partner.rejected@medilink.com",
    phone: "9198330024",
    password: "Password@123",
    address: "Kalyan East",
    city: "Kalyan",
    state: "Maharashtra",
    pincode: "421301",
  });
  const p4App = await prisma.verificationRequest.findFirst({
    where: { userId: regPartnerRejected.user.id },
  });
  if (p4App) {
    await VerificationService.rejectVerification(
      p4App.id,
      admin.id,
      "Incomplete KYC document submissions"
    );
  }
  const partnerRejected = await prisma.deliveryPartner.findFirst({
    where: { userId: regPartnerRejected.user.id },
  });
  const tokenPartnerRejected = TokenService.signToken({
    sub: regPartnerRejected.user.id,
    email: regPartnerRejected.user.email,
    role: UserRole.DELIVERY_PARTNER,
  });

  // 5. Setup Master Medicine & Inventory
  const cat = await prisma.medicineCategory.create({
    data: { name: "DelivTestCat-Antibiotics" },
  });
  const med = await prisma.medicine.create({
    data: {
      name: "DelivTestMed-Azithromycin-500",
      genericName: "Azithromycin",
      composition: "Azithromycin 500mg",
      manufacturer: "Sun Pharma",
      categoryId: cat.id,
    },
  });
  const pmA = await prisma.pharmacyMedicine.create({
    data: {
      pharmacyId: pharmacyA!.id,
      medicineId: med.id,
      sellingPrice: new Prisma.Decimal(120.0),
      isAvailable: true,
    },
  });
  await prisma.inventoryBatch.create({
    data: {
      pharmacyMedicineId: pmA.id,
      batchNumber: "DELIV-BATCH-001",
      quantity: 100,
      reservedQuantity: 0,
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    },
  });

  // 6. Setup Orders
  // Order 1: HOME_DELIVERY -> READY_FOR_PICKUP
  const order1Created = await OrderService.createOrder(customerA.user.id, {
    pharmacyId: pharmacyA!.id,
    fulfillmentType: FulfillmentType.HOME_DELIVERY,
    deliveryAddressId: addressA.id,
    items: [{ pharmacyMedicineId: pmA.id, quantity: 2 }],
  });
  await OrderService.acceptOrder(pharmacyA!.id, order1Created.id, regPharmA.user.id);
  await OrderService.markPreparing(pharmacyA!.id, order1Created.id, regPharmA.user.id);
  const order1Ready = await OrderService.markReady(pharmacyA!.id, order1Created.id, regPharmA.user.id);

  // Order 2: HOME_DELIVERY -> READY_FOR_PICKUP
  const order2Created = await OrderService.createOrder(customerA.user.id, {
    pharmacyId: pharmacyA!.id,
    fulfillmentType: FulfillmentType.HOME_DELIVERY,
    deliveryAddressId: addressA.id,
    items: [{ pharmacyMedicineId: pmA.id, quantity: 1 }],
  });
  await OrderService.acceptOrder(pharmacyA!.id, order2Created.id, regPharmA.user.id);
  await OrderService.markPreparing(pharmacyA!.id, order2Created.id, regPharmA.user.id);
  const order2Ready = await OrderService.markReady(pharmacyA!.id, order2Created.id, regPharmA.user.id);

  // Order 3: PICKUP -> READY_FOR_PICKUP
  const order3Created = await OrderService.createOrder(customerA.user.id, {
    pharmacyId: pharmacyA!.id,
    fulfillmentType: FulfillmentType.PICKUP,
    items: [{ pharmacyMedicineId: pmA.id, quantity: 1 }],
  });
  await OrderService.acceptOrder(pharmacyA!.id, order3Created.id, regPharmA.user.id);
  await OrderService.markPreparing(pharmacyA!.id, order3Created.id, regPharmA.user.id);
  await OrderService.markReady(pharmacyA!.id, order3Created.id, regPharmA.user.id);

  // Start ephemeral test server
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  try {
    // -------------------------------------------------------------
    // GROUP 1: PARTNER AVAILABILITY & VERIFICATION GATES (Tests 1-3)
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 1] Partner Availability & Verification Enforcement");

    // Test 1: Pending partner cannot become available
    const pendingAvailRes = await fetch(`${baseUrl}/delivery/availability`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenPartnerPending}`,
      },
      body: JSON.stringify({ isAvailable: true }),
    });
    assert(
      pendingAvailRes.status === 403,
      "HTTP 403: Pending delivery partner cannot become available"
    );

    // Test 2: Rejected partner cannot become available
    const rejectedAvailRes = await fetch(`${baseUrl}/delivery/availability`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenPartnerRejected}`,
      },
      body: JSON.stringify({ isAvailable: true }),
    });
    assert(
      rejectedAvailRes.status === 403,
      "HTTP 403: Rejected delivery partner cannot become available"
    );

    // Test 3: Verified partner can toggle availability
    const verifiedAvailRes = await fetch(`${baseUrl}/delivery/availability`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenPartner1}`,
      },
      body: JSON.stringify({ isAvailable: true }),
    });
    const verifiedAvailData = await verifiedAvailRes.json();
    assert(verifiedAvailRes.status === 200, "HTTP 200: Verified delivery partner toggles availability");
    assert(verifiedAvailData.data.isAvailable === true, "Partner availability set to true on server");

    // -------------------------------------------------------------
    // GROUP 2: ADMIN DELIVERY ASSIGNMENT (Tests 4-10)
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 2] Admin Delivery Assignment & Validations");

    // Test 4: Admin views eligible delivery partners
    const eligiblePartnersRes = await fetch(`${baseUrl}/admin/delivery-partners/eligible`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const eligiblePartnersData = await eligiblePartnersRes.json();
    assert(eligiblePartnersRes.status === 200, "HTTP 200: Admin retrieves eligible delivery partners");
    assert(
      eligiblePartnersData.data.some((p: any) => p.id === partner1!.id),
      "Verified available Partner 1 listed as eligible"
    );

    // Test 5: Non-admin cannot assign delivery
    const nonAdminAssignRes = await fetch(
      `${baseUrl}/admin/orders/${order1Ready.id}/assign-delivery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerA}`,
        },
        body: JSON.stringify({ deliveryPartnerId: partner1!.id }),
      }
    );
    assert(nonAdminAssignRes.status === 403, "HTTP 403: Non-admin cannot assign delivery");

    // Test 6: Admin cannot assign unverified partner
    const assignUnverifiedRes = await fetch(
      `${baseUrl}/admin/orders/${order1Ready.id}/assign-delivery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenAdmin}`,
        },
        body: JSON.stringify({ deliveryPartnerId: partnerPending!.id }),
      }
    );
    assert(
      assignUnverifiedRes.status === 400,
      "HTTP 400: Assignment of unverified delivery partner rejected"
    );

    // Test 7: Admin cannot assign unavailable partner
    await prisma.deliveryPartner.update({
      where: { id: partner2!.id },
      data: { isAvailable: false },
    });
    const assignUnavailableRes = await fetch(
      `${baseUrl}/admin/orders/${order1Ready.id}/assign-delivery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenAdmin}`,
        },
        body: JSON.stringify({ deliveryPartnerId: partner2!.id }),
      }
    );
    assert(
      assignUnavailableRes.status === 400,
      "HTTP 400: Assignment of unavailable/offline delivery partner rejected"
    );
    // Restore partner 2 availability
    await prisma.deliveryPartner.update({
      where: { id: partner2!.id },
      data: { isAvailable: true },
    });

    // Test 8: Admin cannot assign order that is not READY_FOR_PICKUP
    const unreadyOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-UNREADY-${Date.now()}`,
        customerId: customerA.user.id,
        pharmacyId: pharmacyA!.id,
        deliveryAddressId: addressA.id,
        orderStatus: OrderStatus.PREPARING,
        fulfillmentType: FulfillmentType.HOME_DELIVERY,
        subtotal: new Prisma.Decimal(120),
        totalAmount: new Prisma.Decimal(150),
      },
    });
    const assignUnreadyRes = await fetch(
      `${baseUrl}/admin/orders/${unreadyOrder.id}/assign-delivery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenAdmin}`,
        },
        body: JSON.stringify({ deliveryPartnerId: partner1!.id }),
      }
    );
    assert(
      assignUnreadyRes.status === 400,
      "HTTP 400: Assignment rejected for order not in READY_FOR_PICKUP status"
    );

    // Test 9: Admin cannot assign delivery for PICKUP order
    const assignPickupRes = await fetch(
      `${baseUrl}/admin/orders/${order3Created.id}/assign-delivery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenAdmin}`,
        },
        body: JSON.stringify({ deliveryPartnerId: partner1!.id }),
      }
    );
    assert(
      assignPickupRes.status === 400,
      "HTTP 400: Assignment rejected for PICKUP fulfillment order"
    );

    // Test 10: Admin successfully assigns verified available partner to eligible order
    const assignSuccessRes = await fetch(
      `${baseUrl}/admin/orders/${order1Ready.id}/assign-delivery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenAdmin}`,
        },
        body: JSON.stringify({ deliveryPartnerId: partner1!.id }),
      }
    );
    const assignSuccessData = await assignSuccessRes.json();
    assert(assignSuccessRes.status === 200, "HTTP 200: Admin assigns delivery partner to eligible order");
    assert(assignSuccessData.data.deliveryStatus === DeliveryStatus.ASSIGNED, "Delivery status is ASSIGNED");

    const order1AfterAssign = await prisma.order.findUnique({ where: { id: order1Ready.id } });
    assert(order1AfterAssign?.orderStatus === OrderStatus.ASSIGNED, "Order status synchronized to ASSIGNED");

    // -------------------------------------------------------------
    // GROUP 3: PARTNER ASSIGNMENT ACCESS & ISOLATION (Tests 11-13)
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 3] Partner Assignment Access & Strict Isolation");

    // Test 11: Assigned Partner 1 retrieves assignments
    const partner1AssignmentsRes = await fetch(`${baseUrl}/delivery/assignments`, {
      headers: { Authorization: `Bearer ${tokenPartner1}` },
    });
    const partner1AssignmentsData = await partner1AssignmentsRes.json();
    assert(partner1AssignmentsRes.status === 200, "HTTP 200: Partner 1 queries assignments");
    assert(
      partner1AssignmentsData.data.some((a: any) => a.orderId === order1Ready.id),
      "Partner 1 sees assigned Order 1"
    );
    const deliveryRecordId = partner1AssignmentsData.data.find(
      (a: any) => a.orderId === order1Ready.id
    ).id;

    // Test 12: Partner 2 sees 0 assignments for Order 1
    const partner2AssignmentsRes = await fetch(`${baseUrl}/delivery/assignments`, {
      headers: { Authorization: `Bearer ${tokenPartner2}` },
    });
    const partner2AssignmentsData = await partner2AssignmentsRes.json();
    assert(partner2AssignmentsRes.status === 200, "HTTP 200: Partner 2 queries assignments");
    assert(
      !partner2AssignmentsData.data.some((a: any) => a.orderId === order1Ready.id),
      "Partner 2 cannot see Partner 1's assignment (strict tenant isolation)"
    );

    // Test 13: Partner 2 cannot access Partner 1 assignment details
    const partner2AccessOtherRes = await fetch(
      `${baseUrl}/delivery/assignments/${deliveryRecordId}`,
      {
        headers: { Authorization: `Bearer ${tokenPartner2}` },
      }
    );
    assert(
      partner2AccessOtherRes.status === 404,
      "HTTP 404: Partner 2 cannot access Partner 1's assignment details"
    );

    // -------------------------------------------------------------
    // GROUP 4: PARTNER LIFECYCLE: ACCEPT, PICKUP, OUT-FOR-DELIVERY (Tests 14-17)
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 4] Delivery Partner Lifecycle: Accept, Pickup & Out-For-Delivery");

    // Test 14: Partner 1 accepts assignment
    const acceptRes = await fetch(`${baseUrl}/delivery/assignments/${deliveryRecordId}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenPartner1}` },
    });
    assert(acceptRes.status === 200, "HTTP 200: Partner 1 accepts delivery assignment");

    // Test 15: Partner 1 marks pickup (ASSIGNED -> PICKED_UP)
    const pickupRes = await fetch(`${baseUrl}/delivery/assignments/${deliveryRecordId}/pickup`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenPartner1}` },
    });
    const pickupData = await pickupRes.json();
    assert(pickupRes.status === 200, "HTTP 200: Partner 1 marks package picked up");
    assert(pickupData.data.deliveryStatus === DeliveryStatus.PICKED_UP, "Delivery status is PICKED_UP");
    assert(pickupData.data.orderStatus === OrderStatus.PICKED_UP, "Order status synchronized to PICKED_UP");
    assert(pickupData.data.timestamps.pickedUpAt !== null, "pickedUpAt timestamp recorded");

    // Test 16: Invalid state skip: cannot complete before OUT_FOR_DELIVERY
    const earlyCompleteRes = await fetch(
      `${baseUrl}/delivery/assignments/${deliveryRecordId}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenPartner1}`,
        },
        body: JSON.stringify({ otp: "123456" }),
      }
    );
    assert(
      earlyCompleteRes.status === 400,
      "HTTP 400: Delivery completion rejected before reaching OUT_FOR_DELIVERY"
    );

    // Test 17: Partner 1 marks out-for-delivery (PICKED_UP -> OUT_FOR_DELIVERY)
    const outForDeliveryRes = await fetch(
      `${baseUrl}/delivery/assignments/${deliveryRecordId}/out-for-delivery`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenPartner1}` },
      }
    );
    const outForDeliveryData = await outForDeliveryRes.json();
    assert(outForDeliveryRes.status === 200, "HTTP 200: Partner 1 marks order out for delivery");
    assert(
      outForDeliveryData.data.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY,
      "Delivery status is OUT_FOR_DELIVERY"
    );
    assert(
      outForDeliveryData.data.orderStatus === OrderStatus.OUT_FOR_DELIVERY,
      "Order status synchronized to OUT_FOR_DELIVERY"
    );

    // -------------------------------------------------------------
    // GROUP 5: DELIVERY OTP VERIFICATION & SECURITY (Tests 18-23)
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 5] Delivery OTP Generation, Verification & Security");

    // Test 18: Plaintext OTP is NOT exposed in partner assignment API response
    assert(
      (outForDeliveryData.data as any).otp === undefined &&
        (outForDeliveryData.data as any).deliveryOtp === undefined &&
        (outForDeliveryData.data as any).deliveryOtpHash === undefined,
      "Security: Plaintext OTP and hash omitted from partner API response"
    );

    // Test 19: Plaintext OTP is NOT exposed in admin delivery detail API response
    const adminDetailRes = await fetch(`${baseUrl}/admin/deliveries/${deliveryRecordId}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const adminDetailData = await adminDetailRes.json();
    assert(
      (adminDetailData.data as any).otp === undefined &&
        (adminDetailData.data as any).deliveryOtp === undefined &&
        (adminDetailData.data as any).deliveryOtpHash === undefined,
      "Security: Plaintext OTP and hash omitted from admin API response"
    );

    // Test 20: Customer retrieves valid OTP from customer order tracking
    const customerOrderRes = await fetch(`${baseUrl}/orders/${order1Ready.id}`, {
      headers: { Authorization: `Bearer ${tokenCustomerA}` },
    });
    const customerOrderData = await customerOrderRes.json();
    const orderObj = customerOrderData.data.order || customerOrderData.data;
    assert(customerOrderRes.status === 200, "HTTP 200: Customer retrieves own order details");
    assert(
      typeof orderObj.deliveryOtp === "string" &&
        orderObj.deliveryOtp.length === 6,
      `Customer receives 6-digit delivery OTP (${orderObj.deliveryOtp})`
    );
    const customerOtp = orderObj.deliveryOtp;

    // Test 21: Incorrect OTP rejected with HTTP 400
    const wrongOtpRes = await fetch(
      `${baseUrl}/delivery/assignments/${deliveryRecordId}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenPartner1}`,
        },
        body: JSON.stringify({ otp: "000000" }),
      }
    );
    assert(wrongOtpRes.status === 400, "HTTP 400: Incorrect delivery OTP rejected");

    // Test 22: Correct OTP completes delivery
    const correctOtpRes = await fetch(
      `${baseUrl}/delivery/assignments/${deliveryRecordId}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenPartner1}`,
        },
        body: JSON.stringify({ otp: customerOtp }),
      }
    );
    const correctOtpData = await correctOtpRes.json();
    assert(correctOtpRes.status === 200, "HTTP 200: Correct OTP completes delivery");
    assert(correctOtpData.data.deliveryStatus === DeliveryStatus.DELIVERED, "Delivery status is DELIVERED");
    assert(correctOtpData.data.orderStatus === OrderStatus.DELIVERED, "Order status is DELIVERED");
    assert(correctOtpData.data.timestamps.deliveredAt !== null, "deliveredAt timestamp recorded");

    // Verify OTP hash is cleared to prevent reuse
    const dbDeliveryAfterComplete = await prisma.delivery.findUnique({
      where: { id: deliveryRecordId },
    });
    assert(dbDeliveryAfterComplete?.deliveryOtpHash === null, "deliveryOtpHash cleared in database");

    // Test 23: Reusing OTP on completed delivery is rejected
    const reuseOtpRes = await fetch(
      `${baseUrl}/delivery/assignments/${deliveryRecordId}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenPartner1}`,
        },
        body: JSON.stringify({ otp: customerOtp }),
      }
    );
    assert(reuseOtpRes.status === 400, "HTTP 400: Replay/reuse of delivery OTP rejected");

    // -------------------------------------------------------------
    // GROUP 6: LIVE LOCATION UPDATES & VALIDATIONS (Tests 24-28)
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 6] Live GPS Location Updates & Security");

    // Setup Order 2 assigned to Partner 2 for active location tests
    await fetch(`${baseUrl}/admin/orders/${order2Ready.id}/assign-delivery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ deliveryPartnerId: partner2!.id }),
    });
    const p2AssignmentsRes = await fetch(`${baseUrl}/delivery/assignments`, {
      headers: { Authorization: `Bearer ${tokenPartner2}` },
    });
    const p2AssignmentsData = await p2AssignmentsRes.json();
    const delivery2Id = p2AssignmentsData.data[0].id;

    // Test 24: Assigned partner updates GPS location
    const validLocationRes = await fetch(
      `${baseUrl}/delivery/assignments/${delivery2Id}/location`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenPartner2}`,
        },
        body: JSON.stringify({ latitude: 19.2437, longitude: 73.1355 }),
      }
    );
    const validLocationData = await validLocationRes.json();
    assert(validLocationRes.status === 200, "HTTP 200: Assigned partner updates GPS location");
    assert(
      validLocationData.data.currentLatitude === 19.2437 &&
        validLocationData.data.currentLongitude === 73.1355,
      "Coordinates persisted accurately"
    );

    // Test 25: Unassigned partner cannot update location
    const unassignedLocationRes = await fetch(
      `${baseUrl}/delivery/assignments/${delivery2Id}/location`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenPartner1}`,
        },
        body: JSON.stringify({ latitude: 19.244, longitude: 73.136 }),
      }
    );
    assert(
      unassignedLocationRes.status === 404,
      "HTTP 404: Unassigned partner cannot update delivery location"
    );

    // Test 26: Customer cannot update delivery location
    const customerLocationRes = await fetch(
      `${baseUrl}/delivery/assignments/${delivery2Id}/location`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerA}`,
        },
        body: JSON.stringify({ latitude: 19.244, longitude: 73.136 }),
      }
    );
    assert(
      customerLocationRes.status === 403,
      "HTTP 403: Customer forbidden from updating delivery location"
    );

    // Test 27: Invalid latitude (> 90) rejected
    const invalidLatRes = await fetch(
      `${baseUrl}/delivery/assignments/${delivery2Id}/location`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenPartner2}`,
        },
        body: JSON.stringify({ latitude: 95.0, longitude: 73.1355 }),
      }
    );
    assert(invalidLatRes.status === 400, "HTTP 400: Out-of-bounds latitude rejected");

    // Test 28: Invalid longitude (> 180) rejected
    const invalidLngRes = await fetch(
      `${baseUrl}/delivery/assignments/${delivery2Id}/location`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenPartner2}`,
        },
        body: JSON.stringify({ latitude: 19.2437, longitude: 195.0 }),
      }
    );
    assert(invalidLngRes.status === 400, "HTTP 400: Out-of-bounds longitude rejected");

    // -------------------------------------------------------------
    // GROUP 7: CUSTOMER DELIVERY VISIBILITY & ISOLATION (Tests 29-32)
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 7] Customer Delivery Visibility & Isolation");

    // Test 29: Customer A views delivery details for own order
    const custViewRes = await fetch(`${baseUrl}/orders/${order1Ready.id}`, {
      headers: { Authorization: `Bearer ${tokenCustomerA}` },
    });
    const custViewData = await custViewRes.json();
    const deliveredObj = custViewData.data.order || custViewData.data;
    assert(custViewRes.status === 200, "HTTP 200: Customer A views own delivered order");
    assert(deliveredObj.delivery !== null, "Delivery object attached to customer order response");
    assert(
      deliveredObj.delivery.status === DeliveryStatus.DELIVERED,
      "Customer sees deliveryStatus DELIVERED"
    );

    // Test 30: Customer B cannot view Customer A's order or delivery
    const custBCrossRes = await fetch(`${baseUrl}/orders/${order1Ready.id}`, {
      headers: { Authorization: `Bearer ${tokenCustomerB}` },
    });
    assert(
      custBCrossRes.status === 404,
      "HTTP 404: Customer B cannot access Customer A's order or delivery"
    );

    // Test 31: Customer cannot change delivery status
    const custChangeStatusRes = await fetch(
      `${baseUrl}/delivery/assignments/${delivery2Id}/pickup`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenCustomerA}` },
      }
    );
    assert(
      custChangeStatusRes.status === 403,
      "HTTP 403: Customer cannot change delivery status"
    );

    // Test 32: Customer cannot assign delivery
    const custAssignRes = await fetch(
      `${baseUrl}/admin/orders/${order2Ready.id}/assign-delivery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerA}`,
        },
        body: JSON.stringify({ deliveryPartnerId: partner2!.id }),
      }
    );
    assert(custAssignRes.status === 403, "HTTP 403: Customer cannot assign delivery");

    // -------------------------------------------------------------
    // GROUP 8: SAFE DELIVERY FAILURE (Test 33)
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 8] Safe Delivery Failure Mechanism");

    // Test 33: Delivery failure sets status to FAILED and does NOT cancel order
    const failRes = await fetch(`${baseUrl}/delivery/assignments/${delivery2Id}/fail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenPartner2}`,
      },
      body: JSON.stringify({ reason: "Customer address unreachable / phone switched off" }),
    });
    const failData = await failRes.json();
    assert(failRes.status === 200, "HTTP 200: Delivery failure recorded");
    assert(failData.data.deliveryStatus === DeliveryStatus.FAILED, "Delivery status is FAILED");
    assert(failData.data.attemptCount === 1, "attemptCount incremented to 1");

    const order2AfterFail = await prisma.order.findUnique({ where: { id: order2Ready.id } });
    assert(
      order2AfterFail?.orderStatus !== OrderStatus.CANCELLED,
      "Business Rule Verified: Order was NOT automatically cancelled upon delivery failure"
    );

    console.log("\n==================================================");
    console.log("  ALL 33/33 PHASE 8 DELIVERY TESTS PASSED!");
    console.log("==================================================");
  } finally {
    server.close();
    await cleanup();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("\n[TEST RUNNER FATAL ERROR]", err);
  process.exit(1);
});
