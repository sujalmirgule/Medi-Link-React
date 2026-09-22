/**
 * Phase 11 Automated Verification Script
 * Reviews, Ratings & MediLink-Controlled Discounts
 */
import { PrismaClient, UserRole, OrderStatus, FulfillmentType, PaymentStatus, DeliveryStatus, DiscountType } from "@prisma/client";
import { PasswordService } from "../modules/auth/password.service";
import { ReviewService } from "../modules/reviews/review.service";
import { DiscountService } from "../modules/discounts/discount.service";
import { OrderService } from "../modules/order/order.service";

const prisma = new PrismaClient();

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`  ✓ ${msg}`);
}

async function runTests() {
  console.log("==================================================");
  console.log("Starting Phase 11 Automated Tests");
  console.log("==================================================");

  const testSuffix = Date.now().toString(36);
  const adminEmail = `admin_p11_${testSuffix}@medilink.local`;
  const custEmail = `cust_p11_${testSuffix}@medilink.local`;
  const otherCustEmail = `other_cust_p11_${testSuffix}@medilink.local`;
  const pharmEmail = `pharm_p11_${testSuffix}@medilink.local`;
  const delivEmail = `deliv_p11_${testSuffix}@medilink.local`;

  let adminUser: any;
  let customerUser: any;
  let otherCustomerUser: any;
  let pharmacyOwner: any;
  let pharmacy: any;
  let deliveryUser: any;
  let deliveryPartner: any;
  let medicineCategory: any;
  let medicine: any;
  let pharmacyMedicine: any;
  let inventoryBatch: any;
  let customerAddress: any;
  let otherMed: any;

  try {
    // -------------------------------------------------------------------------
    // Setup Test Data
    // -------------------------------------------------------------------------
    console.log("\n1. Setting up test entities...");
    const pwdHash = await PasswordService.hashPassword("Password123!");

    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: pwdHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    customerUser = await prisma.user.create({
      data: {
        email: custEmail,
        passwordHash: pwdHash,
        role: UserRole.CUSTOMER,
        isActive: true,
        profile: {
          create: { firstName: "Test", lastName: "Customer" },
        },
      },
      include: { profile: true },
    });

    otherCustomerUser = await prisma.user.create({
      data: {
        email: otherCustEmail,
        passwordHash: pwdHash,
        role: UserRole.CUSTOMER,
        isActive: true,
        profile: {
          create: { firstName: "Other", lastName: "Customer" },
        },
      },
      include: { profile: true },
    });

    pharmacyOwner = await prisma.user.create({
      data: {
        email: pharmEmail,
        passwordHash: pwdHash,
        role: UserRole.PHARMACY,
        isActive: true,
      },
    });

    pharmacy = await prisma.pharmacy.create({
      data: {
        ownerUserId: pharmacyOwner.id,
        name: `Phase 11 Pharmacy ${testSuffix}`,
        licenseNumber: `LIC-P11-${testSuffix}`,
        phone: "9876543210",
        email: pharmEmail,
        address: "123 Phase 11 Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        isVerified: true,
        isActive: true,
      },
    });

    deliveryUser = await prisma.user.create({
      data: {
        email: delivEmail,
        passwordHash: pwdHash,
        role: UserRole.DELIVERY_PARTNER,
        isActive: true,
      },
    });

    deliveryPartner = await prisma.deliveryPartner.create({
      data: {
        userId: deliveryUser.id,
        phone: "9876543211",
        isVerified: true,
        isActive: true,
      },
    });

    medicineCategory = await prisma.medicineCategory.create({
      data: {
        name: `Category P11 ${testSuffix}`,
        description: "Test Category",
      },
    });

    medicine = await prisma.medicine.create({
      data: {
        name: `Paracetamol P11 ${testSuffix}`,
        genericName: "Paracetamol",
        composition: "500mg",
        manufacturer: "MediLabs",
        categoryId: medicineCategory.id,
        prescriptionRequired: false,
        isActive: true,
      },
    });

    pharmacyMedicine = await prisma.pharmacyMedicine.create({
      data: {
        pharmacyId: pharmacy.id,
        medicineId: medicine.id,
        sellingPrice: 50.0,
        isAvailable: true,
      },
    });

    inventoryBatch = await prisma.inventoryBatch.create({
      data: {
        pharmacyMedicineId: pharmacyMedicine.id,
        batchNumber: `BATCH-P11-${testSuffix}`,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        quantity: 100,
        reservedQuantity: 0,
      },
    });

    customerAddress = await prisma.address.create({
      data: {
        userId: customerUser.id,
        label: "Home",
        addressLine1: "Flat 101, Test Residency",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
    });

    console.log("  ✓ Setup completed successfully");

    // -------------------------------------------------------------------------
    // 2. DISCOUNT MODULE TESTS
    // -------------------------------------------------------------------------
    console.log("\n2. Testing Discount Management & Calculation...");

    // A. Admin creates percentage discount
    const pctCode = `PCT20_${testSuffix}`.toUpperCase();
    const pctDiscount = await DiscountService.adminCreateDiscount(adminUser.id, {
      code: pctCode,
      type: DiscountType.PERCENTAGE,
      value: 20, // 20%
      maxDiscount: 100, // Max cap ₹100
      minimumOrderAmount: 200, // Min ₹200
      isActive: true,
    });
    assert(pctDiscount.code === pctCode, "Admin successfully creates PERCENTAGE discount");
    assert(pctDiscount.maxDiscount === 100, "Percentage discount retains maxDiscount cap");

    // B. Admin creates fixed discount
    const fixCode = `FIX50_${testSuffix}`.toUpperCase();
    const fixDiscount = await DiscountService.adminCreateDiscount(adminUser.id, {
      code: fixCode,
      type: DiscountType.FIXED,
      value: 50,
      minimumOrderAmount: 150,
      isActive: true,
    });
    assert(fixDiscount.code === fixCode, "Admin successfully creates FIXED discount");

    // C. Duplicate coupon code rejection
    try {
      await DiscountService.adminCreateDiscount(adminUser.id, {
        code: pctCode,
        type: DiscountType.PERCENTAGE,
        value: 10,
      });
      assert(false, "Duplicate coupon creation should fail");
    } catch (err: any) {
      assert(err.status === 409, "Duplicate coupon code rejected with 409 Conflict");
    }

    // D. Validation: Minimum order amount check
    try {
      await DiscountService.validateAndCalculateDiscount(pctCode, 100); // Below 200 min
      assert(false, "Should fail when subtotal is below minimum order amount");
    } catch (err: any) {
      assert(err.status === 400, "Rejected when order subtotal is below minimum order amount");
    }

    // E. Calculation: Percentage with cap
    // Subtotal 600 * 20% = 120 -> capped at 100
    const calcCapped = await DiscountService.validateAndCalculateDiscount(pctCode, 600);
    assert(calcCapped.discountAmount === 100, "Percentage discount correctly capped at maxDiscount (100)");
    assert(calcCapped.finalSubtotal === 500, "Final subtotal correctly calculated as 500");

    // F. Calculation: Percentage below cap
    // Subtotal 300 * 20% = 60 (< 100)
    const calcUncapped = await DiscountService.validateAndCalculateDiscount(pctCode, 300);
    assert(calcUncapped.discountAmount === 60, "Percentage discount correctly calculated as 60");
    assert(calcUncapped.finalSubtotal === 240, "Final subtotal correctly calculated as 240");

    // G. Calculation: Fixed discount
    const calcFixed = await DiscountService.validateAndCalculateDiscount(fixCode, 200);
    assert(calcFixed.discountAmount === 50, "Fixed discount correctly calculated as 50");
    assert(calcFixed.finalSubtotal === 150, "Final subtotal correctly calculated as 150");

    // H. Inactive / Expired discount handling
    const inactiveCode = `INACT_${testSuffix}`.toUpperCase();
    await DiscountService.adminCreateDiscount(adminUser.id, {
      code: inactiveCode,
      type: DiscountType.FIXED,
      value: 10,
      isActive: false,
    });
    try {
      await DiscountService.validateAndCalculateDiscount(inactiveCode, 100);
      assert(false, "Inactive coupon should fail validation");
    } catch (err: any) {
      assert(err.status === 400, "Inactive coupon rejected with 400 Bad Request");
    }

    // I. Admin toggle status & update discount
    const toggled = await DiscountService.adminToggleStatus(adminUser.id, fixDiscount.id, false);
    assert(toggled.isActive === false, "Admin can deactivate a discount coupon");
    const reActivated = await DiscountService.adminToggleStatus(adminUser.id, fixDiscount.id, true);
    assert(reActivated.isActive === true, "Admin can re-activate a discount coupon");

    const updatedDisc = await DiscountService.adminUpdateDiscount(adminUser.id, fixDiscount.id, {
      value: 60,
    });
    assert(updatedDisc.value === 60, "Admin can update discount value");

    // -------------------------------------------------------------------------
    // 3. ORDER CREATION WITH DISCOUNT INTEGRATION
    // -------------------------------------------------------------------------
    console.log("\n3. Testing Order Creation with Discount Integration...");

    // Subtotal: 6 items * 50 = 300. Delivery fee: 30.
    // Coupon: PCT20 -> 20% of 300 = 60 discount.
    // Expected total: 300 + 30 - 60 = 270.
    const createdOrder = await OrderService.createOrder(customerUser.id, {
      pharmacyId: pharmacy.id,
      fulfillmentType: FulfillmentType.HOME_DELIVERY,
      deliveryAddressId: customerAddress.id,
      discountCode: pctCode,
      items: [
        {
          pharmacyMedicineId: pharmacyMedicine.id,
          quantity: 6,
        },
      ],
    });

    assert(createdOrder.subtotal === 300, "Order subtotal is ₹300");
    assert(createdOrder.deliveryFee === 30, "Order delivery fee is ₹30");
    assert(createdOrder.discountAmount === 60, "Order discountAmount is ₹60");
    assert(createdOrder.totalAmount === 270, "Order totalAmount is ₹270 (300 + 30 - 60)");

    // -------------------------------------------------------------------------
    // 4. REVIEW ELIGIBILITY & DUPLICATE PROTECTION
    // -------------------------------------------------------------------------
    console.log("\n4. Testing Review Eligibility & Protection Rules...");

    // A. Review on PENDING order should fail
    try {
      await ReviewService.createReview(customerUser.id, {
        orderId: createdOrder.id,
        medicineId: medicine.id,
        rating: 5,
        comment: "Great medicine",
      });
      assert(false, "Reviewing a PENDING order must fail");
    } catch (err: any) {
      assert(err.status === 400, "Reviewing non-completed order rejected with 400");
    }

    // B. Progress order to COMPLETED
    await prisma.order.update({
      where: { id: createdOrder.id },
      data: { orderStatus: OrderStatus.COMPLETED },
    });

    // Assign delivery partner to delivery record
    await prisma.delivery.update({
      where: { orderId: createdOrder.id },
      data: {
        deliveryPartnerId: deliveryPartner.id,
        status: DeliveryStatus.DELIVERED,
      },
    });

    // C. Non-owner customer reviewing this order should fail
    try {
      await ReviewService.createReview(otherCustomerUser.id, {
        orderId: createdOrder.id,
        medicineId: medicine.id,
        rating: 5,
      });
      assert(false, "Non-owner customer should not be able to review order");
    } catch (err: any) {
      assert(err.status === 403, "Non-owner review rejected with 403 Forbidden");
    }

    // D. Review medicine NOT in the order should fail
    otherMed = await prisma.medicine.create({
      data: {
        name: `Other Med ${testSuffix}`,
        genericName: "Other",
        composition: "10mg",
        manufacturer: "OtherLabs",
        categoryId: medicineCategory.id,
        isActive: true,
      },
    });
    try {
      await ReviewService.createReview(customerUser.id, {
        orderId: createdOrder.id,
        medicineId: otherMed.id,
        rating: 4,
      });
      assert(false, "Reviewing a medicine not part of the order must fail");
    } catch (err: any) {
      assert(err.status === 400, "Reviewing non-purchased medicine rejected with 400");
    }

    // E. Successful Medicine Review
    const medReview = await ReviewService.createReview(customerUser.id, {
      orderId: createdOrder.id,
      medicineId: medicine.id,
      rating: 5,
      comment: "Worked very well, fast relief.",
    });
    assert(medReview.rating === 5, "Customer successfully created medicine review");
    assert(medReview.medicine?.id === medicine.id, "Review references correct medicine");

    // F. Duplicate Medicine Review Prevention
    try {
      await ReviewService.createReview(customerUser.id, {
        orderId: createdOrder.id,
        medicineId: medicine.id,
        rating: 4,
      });
      assert(false, "Duplicate medicine review on same order must fail");
    } catch (err: any) {
      assert(err.status === 409, "Duplicate medicine review rejected with 409 Conflict");
    }

    // G. Successful Pharmacy Review
    const pharmReview = await ReviewService.createReview(customerUser.id, {
      orderId: createdOrder.id,
      pharmacyId: pharmacy.id,
      rating: 4,
      comment: "Prompt packaging and clean bill.",
    });
    assert(pharmReview.rating === 4, "Customer successfully created pharmacy review");

    // H. Duplicate Pharmacy Review Prevention
    try {
      await ReviewService.createReview(customerUser.id, {
        orderId: createdOrder.id,
        pharmacyId: pharmacy.id,
        rating: 3,
      });
      assert(false, "Duplicate pharmacy review on same order must fail");
    } catch (err: any) {
      assert(err.status === 409, "Duplicate pharmacy review rejected with 409 Conflict");
    }

    // I. Successful Delivery Partner Review
    const delivReview = await ReviewService.createReview(customerUser.id, {
      orderId: createdOrder.id,
      deliveryPartnerId: deliveryPartner.id,
      rating: 5,
      comment: "Courteous and delivered on time.",
    });
    assert(delivReview.rating === 5, "Customer successfully created delivery partner review");

    // J. Duplicate Delivery Partner Review Prevention
    try {
      await ReviewService.createReview(customerUser.id, {
        orderId: createdOrder.id,
        deliveryPartnerId: deliveryPartner.id,
        rating: 2,
      });
      assert(false, "Duplicate delivery review on same order must fail");
    } catch (err: any) {
      assert(err.status === 409, "Duplicate delivery partner review rejected with 409 Conflict");
    }

    // -------------------------------------------------------------------------
    // 5. AGGREGATES & PUBLIC LISTINGS
    // -------------------------------------------------------------------------
    console.log("\n5. Testing Aggregate Ratings & Review Status...");

    const medAgg = await ReviewService.getMedicineAverageRating(medicine.id);
    assert(medAgg.totalReviews === 1, "Medicine total reviews count is 1");
    assert(medAgg.averageRating === 5.0, "Medicine average rating is 5.0");

    const pharmAgg = await ReviewService.getPharmacyAverageRating(pharmacy.id);
    assert(pharmAgg.averageRating === 4.0, "Pharmacy average rating is 4.0");

    const delivAgg = await ReviewService.getDeliveryPartnerAverageRating(deliveryPartner.id);
    assert(delivAgg.averageRating === 5.0, "Delivery partner average rating is 5.0");

    const reviewStatus = await ReviewService.getOrderReviewStatus(customerUser.id, createdOrder.id);
    assert(reviewStatus.pharmacyReviewed === true, "OrderReviewStatus correctly shows pharmacy reviewed");
    assert(reviewStatus.deliveryReviewed === true, "OrderReviewStatus correctly shows delivery reviewed");
    assert(reviewStatus.reviewedMedicineIds.includes(medicine.id), "OrderReviewStatus includes medicine ID");

    // -------------------------------------------------------------------------
    // 6. CUSTOMER UPDATE & ADMIN MODERATION
    // -------------------------------------------------------------------------
    console.log("\n6. Testing Review Updates & Admin Moderation...");

    // A. Customer updates own review
    const updatedReview = await ReviewService.updateReview(customerUser.id, medReview.id, {
      rating: 4,
      comment: "Updated: Worked well.",
    });
    assert(updatedReview.rating === 4, "Customer can update their own review rating");

    // B. Non-owner update fails
    try {
      await ReviewService.updateReview(otherCustomerUser.id, medReview.id, {
        rating: 1,
      });
      assert(false, "Non-owner updating review must fail");
    } catch (err: any) {
      assert(err.status === 403, "Non-owner update rejected with 403 Forbidden");
    }

    // C. Admin lists reviews
    const adminReviews = await ReviewService.adminListReviews({ page: 1, limit: 10 });
    assert(adminReviews.items.length >= 3, "Admin list reviews returns submitted reviews");

    // D. Admin soft-hides review
    const hiddenReview = await ReviewService.adminHideReview(adminUser.id, medReview.id, true);
    assert(hiddenReview.isHidden === true, "Admin soft-hides review");

    // E. Public list should exclude hidden review
    const publicMedList = await ReviewService.listMedicineReviews(medicine.id, { page: 1, limit: 10 });
    assert(publicMedList.items.length === 0, "Hidden review excluded from public listing");

    // F. Admin unhides review
    const unhiddenReview = await ReviewService.adminHideReview(adminUser.id, medReview.id, false);
    assert(unhiddenReview.isHidden === false, "Admin unhides review");

    const publicMedListAfter = await ReviewService.listMedicineReviews(medicine.id, { page: 1, limit: 10 });
    assert(publicMedListAfter.items.length === 1, "Unhidden review reappears in public listing");

    // G. Admin hard deletes a review
    await ReviewService.adminDeleteReview(adminUser.id, delivReview.id);
    const delivAggAfter = await ReviewService.getDeliveryPartnerAverageRating(deliveryPartner.id);
    assert(delivAggAfter.totalReviews === 0, "Deleted review removed from aggregates");

    // H. Verify Audit Logs created for Admin actions
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        userId: adminUser.id,
      },
    });
    assert(auditLogs.some((l) => l.action === "ADMIN_CREATE_DISCOUNT"), "AuditLog created for discount creation");
    assert(auditLogs.some((l) => l.action === "ADMIN_HIDE_REVIEW"), "AuditLog created for review hiding");
    assert(auditLogs.some((l) => l.action === "ADMIN_DELETE_REVIEW"), "AuditLog created for review deletion");

    console.log("\n==================================================");
    console.log("🎉 ALL PHASE 11 BACKEND TESTS PASSED!");
    console.log("==================================================");
  } finally {
    // Cleanup test data
    console.log("\nCleaning up test records...");
    await prisma.auditLog.deleteMany({
      where: {
        userId: { in: [adminUser?.id, customerUser?.id, otherCustomerUser?.id, pharmacyOwner?.id, deliveryUser?.id].filter(Boolean) },
      },
    });
    await prisma.review.deleteMany({
      where: { customerId: { in: [customerUser?.id, otherCustomerUser?.id].filter(Boolean) } },
    });
    await prisma.deliveryEvent.deleteMany({
      where: { delivery: { order: { customerId: customerUser?.id } } },
    });
    await prisma.delivery.deleteMany({
      where: { order: { customerId: customerUser?.id } },
    });
    await prisma.orderItem.deleteMany({
      where: { order: { customerId: customerUser?.id } },
    });
    await prisma.order.deleteMany({
      where: { customerId: customerUser?.id },
    });
    await prisma.inventoryBatch.deleteMany({
      where: { pharmacyMedicineId: pharmacyMedicine?.id },
    });
    await prisma.pharmacyMedicine.deleteMany({
      where: { pharmacyId: pharmacy?.id },
    });
    await prisma.medicine.deleteMany({
      where: { id: { in: [medicine?.id, otherMed?.id].filter(Boolean) } },
    });
    await prisma.medicineCategory.deleteMany({
      where: { id: medicineCategory?.id },
    });
    await prisma.discount.deleteMany({
      where: { code: { contains: testSuffix.toUpperCase() } },
    });
    await prisma.address.deleteMany({
      where: { userId: customerUser?.id },
    });
    await prisma.deliveryPartner.deleteMany({
      where: { id: deliveryPartner?.id },
    });
    await prisma.pharmacy.deleteMany({
      where: { id: pharmacy?.id },
    });
    await prisma.customerProfile.deleteMany({
      where: { userId: { in: [customerUser?.id, otherCustomerUser?.id].filter(Boolean) } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [adminUser?.id, customerUser?.id, otherCustomerUser?.id, pharmacyOwner?.id, deliveryUser?.id].filter(Boolean) } },
    });
    console.log("Cleanup complete.");
  }
}

runTests().catch((err) => {
  console.error("Test run failed:", err);
  process.exit(1);
});
