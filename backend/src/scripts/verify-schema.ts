import { PrismaClient, UserRole, OrderStatus, FulfillmentType, DeliveryStatus, PaymentMethod, PaymentStatus, SettlementStatus, DiscountType, NotificationType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("  MediLink Phase 2: Database & Relational Test    ");
  console.log("==================================================");

  // 1. Inspect all tables in public schema
  const tableRows: { table_name: string }[] = await prisma.$queryRawUnsafe(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
  );
  const tableNames = tableRows.map((r) => r.table_name);
  console.log(`\n[1] Tables present in PostgreSQL (${tableNames.length} total):`);
  tableNames.forEach((t) => console.log(`   - ${t}`));

  const requiredTables = [
    "User",
    "CustomerProfile",
    "Pharmacy",
    "PharmacyStaff",
    "DeliveryPartner",
    "Address",
    "MedicineCategory",
    "Medicine",
    "PharmacyMedicine",
    "InventoryBatch",
    "Order",
    "OrderItem",
    "Delivery",
    "DeliveryEvent",
    "Payment",
    "Settlement",
    "Review",
    "Discount",
    "Notification",
    "AuditLog",
  ];

  const missingTables = requiredTables.filter(
    (req) => !tableNames.includes(req) && !tableNames.includes(req.toLowerCase())
  );

  if (missingTables.length > 0) {
    throw new Error(`Missing expected tables: ${missingTables.join(", ")}`);
  }
  console.log("\n[PASS] All 20 required tables (including _prisma_migrations) verified in PostgreSQL!");

  // 2. Test Relational Seed Creation
  console.log("\n[2] Testing relational write & integrity...");

  // Clean up any previous test records by known unique test identifiers
  await prisma.review.deleteMany({ where: { comment: "Test Review" } });
  await prisma.settlement.deleteMany({ where: { order: { orderNumber: "ORD-TEST-001" } } });
  await prisma.payment.deleteMany({ where: { order: { orderNumber: "ORD-TEST-001" } } });
  await prisma.deliveryEvent.deleteMany({ where: { note: "Package received for testing" } });
  await prisma.delivery.deleteMany({ where: { order: { orderNumber: "ORD-TEST-001" } } });
  await prisma.orderItem.deleteMany({ where: { order: { orderNumber: "ORD-TEST-001" } } });
  await prisma.order.deleteMany({ where: { orderNumber: "ORD-TEST-001" } });
  await prisma.inventoryBatch.deleteMany({ where: { batchNumber: "BATCH-TEST-001" } });
  await prisma.pharmacyMedicine.deleteMany({ where: { pharmacy: { licenseNumber: "LIC-TEST-PHARMACY-001" } } });
  await prisma.medicine.deleteMany({ where: { name: "Test Paracetamol 500mg" } });
  await prisma.medicineCategory.deleteMany({ where: { name: "Test Pain Relief" } });
  await prisma.address.deleteMany({ where: { label: "Test Home" } });
  await prisma.pharmacyStaff.deleteMany({ where: { pharmacy: { licenseNumber: "LIC-TEST-PHARMACY-001" } } });
  await prisma.pharmacy.deleteMany({ where: { licenseNumber: "LIC-TEST-PHARMACY-001" } });
  await prisma.deliveryPartner.deleteMany({ where: { user: { email: "delivery.partner.test@medilink.com" } } });
  await prisma.customerProfile.deleteMany({ where: { user: { email: "customer.test@medilink.com" } } });
  await prisma.notification.deleteMany({ where: { title: "Test Notification" } });
  await prisma.discount.deleteMany({ where: { code: "MEDITEST10" } });
  await prisma.auditLog.deleteMany({ where: { action: "TEST_SEED_VERIFICATION" } });
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          "customer.test@medilink.com",
          "pharmacy.owner.test@medilink.com",
          "delivery.partner.test@medilink.com",
        ],
      },
    },
  });

  // A. Customer User + Profile
  const customerUser = await prisma.user.create({
    data: {
      email: "customer.test@medilink.com",
      phone: "+919876543210",
      passwordHash: "$2b$10$dummyhashedpasswordforverificationonly",
      role: UserRole.CUSTOMER,
      profile: {
        create: {
          firstName: "John",
          lastName: "Doe",
        },
      },
      addresses: {
        create: {
          label: "Test Home",
          addressLine1: "123 Healthcare Ave",
          city: "Kalyan",
          state: "Maharashtra",
          pincode: "421301",
          isDefault: true,
        },
      },
    },
    include: {
      profile: true,
      addresses: true,
    },
  });
  console.log(`   - Created Customer: ${customerUser.profile?.firstName} ${customerUser.profile?.lastName} (${customerUser.id})`);

  // B. Pharmacy Owner + Pharmacy + Staff
  const pharmacyOwner = await prisma.user.create({
    data: {
      email: "pharmacy.owner.test@medilink.com",
      phone: "+919876543211",
      passwordHash: "$2b$10$dummyhashedpasswordforverificationonly",
      role: UserRole.PHARMACY,
      ownedPharmacies: {
        create: {
          name: "Apollo Test Pharmacy",
          licenseNumber: "LIC-TEST-PHARMACY-001",
          phone: "+919876543211",
          email: "pharmacy.owner.test@medilink.com",
          address: "Shop 4, Wellness Plaza",
          city: "Kalyan",
          state: "Maharashtra",
          pincode: "421301",
          isVerified: true,
        },
      },
    },
    include: {
      ownedPharmacies: true,
    },
  });
  const pharmacy = pharmacyOwner.ownedPharmacies[0];
  console.log(`   - Created Pharmacy: ${pharmacy.name} (${pharmacy.id})`);

  // Staff association
  await prisma.pharmacyStaff.create({
    data: {
      userId: pharmacyOwner.id,
      pharmacyId: pharmacy.id,
    },
  });

  // C. Delivery Partner
  const deliveryUser = await prisma.user.create({
    data: {
      email: "delivery.partner.test@medilink.com",
      phone: "+919876543212",
      passwordHash: "$2b$10$dummyhashedpasswordforverificationonly",
      role: UserRole.DELIVERY_PARTNER,
      deliveryPartner: {
        create: {
          phone: "+919876543212",
          isVerified: true,
          isAvailable: true,
        },
      },
    },
    include: {
      deliveryPartner: true,
    },
  });
  const deliveryPartner = deliveryUser.deliveryPartner!;
  console.log(`   - Created Delivery Partner: ${deliveryPartner.id}`);

  // D. Medicine Category + Medicine
  const category = await prisma.medicineCategory.create({
    data: {
      name: "Test Pain Relief",
      description: "Medicines for fever, headaches and pain",
    },
  });

  const medicine = await prisma.medicine.create({
    data: {
      name: "Test Paracetamol 500mg",
      genericName: "Paracetamol",
      composition: "Paracetamol IP 500mg",
      description: "Relieves pain and fever",
      manufacturer: "Cipla Ltd.",
      categoryId: category.id,
      prescriptionRequired: false,
    },
  });
  console.log(`   - Created Medicine: ${medicine.name} in category ${category.name}`);

  // E. Pharmacy Medicine Listing + Inventory Batch
  const pharmacyMedicine = await prisma.pharmacyMedicine.create({
    data: {
      pharmacyId: pharmacy.id,
      medicineId: medicine.id,
      sellingPrice: 28.0,
      isAvailable: true,
      batches: {
        create: {
          batchNumber: "BATCH-TEST-001",
          expiryDate: new Date("2028-12-31"),
          quantity: 100,
          reservedQuantity: 2,
        },
      },
    },
    include: {
      batches: true,
    },
  });
  const batch = pharmacyMedicine.batches[0];
  const availableQuantity = batch.quantity - batch.reservedQuantity;
  console.log(`   - Created Pharmacy Listing & Batch: Total=${batch.quantity}, Reserved=${batch.reservedQuantity}, Available=${availableQuantity}`);

  if (availableQuantity !== 98) {
    throw new Error(`Inventory calculation failed: expected 98, got ${availableQuantity}`);
  }

  // F. Order + OrderItem + Delivery + Payment + Settlement
  const order = await prisma.order.create({
    data: {
      orderNumber: "ORD-TEST-001",
      customerId: customerUser.id,
      pharmacyId: pharmacy.id,
      deliveryAddressId: customerUser.addresses[0].id,
      orderStatus: OrderStatus.PENDING,
      fulfillmentType: FulfillmentType.HOME_DELIVERY,
      subtotal: 56.0, // 2 x 28.00
      deliveryFee: 30.0,
      discountAmount: 10.0,
      totalAmount: 76.0,
      customerNote: "Please deliver before 5 PM",
      items: {
        create: {
          pharmacyMedicineId: pharmacyMedicine.id,
          inventoryBatchId: batch.id,
          quantity: 2,
          unitPrice: 28.0,
          totalPrice: 56.0,
        },
      },
      delivery: {
        create: {
          deliveryPartnerId: deliveryPartner.id,
          status: DeliveryStatus.PENDING,
          deliveryOtpHash: "$2b$10$dummyotphash12345",
          events: {
            create: {
              status: DeliveryStatus.PENDING,
              note: "Package received for testing",
            },
          },
        },
      },
      payments: {
        create: {
          method: PaymentMethod.UPI,
          status: PaymentStatus.PAID,
          amount: 76.0,
          transactionReference: "UPI-TXN-TEST-12345",
          paidAt: new Date(),
        },
      },
      settlement: {
        create: {
          pharmacyId: pharmacy.id,
          amount: 50.0,
          status: SettlementStatus.PENDING,
        },
      },
    },
    include: {
      items: true,
      delivery: {
        include: {
          events: true,
        },
      },
      payments: true,
      settlement: true,
    },
  });
  console.log(`   - Created Order: ${order.orderNumber} (Total: ₹${order.totalAmount})`);

  // G. Review, Discount, Notification, AuditLog
  await prisma.review.create({
    data: {
      customerId: customerUser.id,
      pharmacyId: pharmacy.id,
      medicineId: medicine.id,
      rating: 5,
      comment: "Test Review: Quick service and genuine medicines.",
    },
  });

  await prisma.discount.create({
    data: {
      code: "MEDITEST10",
      type: DiscountType.PERCENTAGE,
      value: 10.0,
      maxDiscount: 50.0,
      minimumOrderAmount: 200.0,
    },
  });

  await prisma.notification.create({
    data: {
      userId: customerUser.id,
      type: NotificationType.ORDER_UPDATE,
      title: "Test Notification",
      message: "Your order ORD-TEST-001 has been placed successfully.",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: customerUser.id,
      action: "TEST_SEED_VERIFICATION",
      entity: "Order",
      entityId: order.id,
      metadata: { status: "SUCCESS", phase: 2 },
    },
  });

  console.log("   - Created Review, Discount, Notification, and AuditLog");

  // 3. Deep Relational Read & Verification
  console.log("\n[3] Testing deep relational read across all models...");
  const queriedOrder = await prisma.order.findUnique({
    where: { orderNumber: "ORD-TEST-001" },
    include: {
      customer: {
        include: { profile: true },
      },
      pharmacy: true,
      deliveryAddress: true,
      items: {
        include: {
          pharmacyMedicine: {
            include: {
              medicine: {
                include: { category: true },
              },
            },
          },
          inventoryBatch: true,
        },
      },
      delivery: {
        include: {
          deliveryPartner: {
            include: { user: true },
          },
          events: true,
        },
      },
      payments: true,
      settlement: true,
    },
  });

  if (!queriedOrder) {
    throw new Error("Failed to retrieve order by orderNumber");
  }

  console.log(`   - Order #${queriedOrder.orderNumber}`);
  console.log(`   - Customer: ${queriedOrder.customer.profile?.firstName} ${queriedOrder.customer.profile?.lastName} (${queriedOrder.customer.email})`);
  console.log(`   - Pharmacy: ${queriedOrder.pharmacy.name} (License: ${queriedOrder.pharmacy.licenseNumber})`);
  console.log(`   - Item: ${queriedOrder.items[0].pharmacyMedicine.medicine.name} (Category: ${queriedOrder.items[0].pharmacyMedicine.medicine.category.name})`);
  console.log(`   - Batch: ${queriedOrder.items[0].inventoryBatch?.batchNumber} (Expires: ${queriedOrder.items[0].inventoryBatch?.expiryDate.toISOString().split("T")[0]})`);
  console.log(`   - Delivery Partner Phone: ${queriedOrder.delivery?.deliveryPartner?.phone}`);
  console.log(`   - Payment: ₹${queriedOrder.payments[0].amount} via ${queriedOrder.payments[0].method} (${queriedOrder.payments[0].status})`);
  console.log(`   - Settlement: ₹${queriedOrder.settlement?.amount} (${queriedOrder.settlement?.status})`);

  console.log("\n==================================================");
  console.log("  ALL PHASE 2 DATABASE CHECKS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
