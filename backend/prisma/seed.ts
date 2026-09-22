import { PrismaClient, UserRole, VerificationStatus, DiscountType } from "@prisma/client";
import { PasswordService } from "../src/modules/auth/password.service";

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("🌱 Starting MediLink Demo & Test Data Seeder");
  console.log("==================================================");

  // Production safety guard: Prevent accidental demo seeding against production
  if (process.env.NODE_ENV === "production") {
    console.error("⛔ [Safety Guard] Demo seed script is disabled in production environment (NODE_ENV === 'production').");
    process.exit(1);
  }

  const demoPassword = "Demo@12345";
  const passwordHash = await PasswordService.hashPassword(demoPassword);

  // ---------------------------------------------------------------------------
  // 1. DEMO CUSTOMER ACCOUNT
  // ---------------------------------------------------------------------------
  const customerEmail = "demo.customer@medilink.test";
  console.log(`[Seed] Provisioning Demo Customer: ${customerEmail}`);
  const customerUser = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {
      passwordHash,
      role: UserRole.CUSTOMER,
      isActive: true,
      verificationStatus: VerificationStatus.NOT_REQUIRED,
    },
    create: {
      email: customerEmail,
      passwordHash,
      phone: "+91 98765 00001",
      role: UserRole.CUSTOMER,
      isActive: true,
      verificationStatus: VerificationStatus.NOT_REQUIRED,
      profile: {
        create: {
          firstName: "Demo",
          lastName: "Customer",
        },
      },
    },
    include: { profile: true },
  });

  // Ensure customer profile exists
  if (!customerUser.profile) {
    await prisma.customerProfile.create({
      data: {
        userId: customerUser.id,
        firstName: "Demo",
        lastName: "Customer",
      },
    });
  }

  // Ensure customer demo address exists
  const existingAddress = await prisma.address.findFirst({
    where: { userId: customerUser.id },
  });
  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: customerUser.id,
        label: "Home",
        addressLine1: "123 Healthcare Ave, Flat 4B",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        isDefault: true,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // 2. DEMO PHARMACY ACCOUNT
  // ---------------------------------------------------------------------------
  const pharmacyEmail = "demo.pharmacy@medilink.test";
  console.log(`[Seed] Provisioning Demo Pharmacy: ${pharmacyEmail}`);
  const pharmacyUser = await prisma.user.upsert({
    where: { email: pharmacyEmail },
    update: {
      passwordHash,
      role: UserRole.PHARMACY,
      isActive: true,
      verificationStatus: VerificationStatus.VERIFIED,
    },
    create: {
      email: pharmacyEmail,
      passwordHash,
      phone: "+91 98765 43210",
      role: UserRole.PHARMACY,
      isActive: true,
      verificationStatus: VerificationStatus.VERIFIED,
    },
  });

  // Provision / Update Pharmacy details
  const pharmacyLicense = "DL-DEMO-PHARM-2026";
  const demoPharmacy = await prisma.pharmacy.upsert({
    where: { licenseNumber: pharmacyLicense },
    update: {
      ownerUserId: pharmacyUser.id,
      name: "MediLink Demo Pharmacy",
      phone: "+91 98765 43210",
      email: pharmacyEmail,
      address: "Shop 12, Wellness Plaza, MG Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      latitude: 19.0760,
      longitude: 72.8777,
      isVerified: true,
      isActive: true,
    },
    create: {
      ownerUserId: pharmacyUser.id,
      name: "MediLink Demo Pharmacy",
      licenseNumber: pharmacyLicense,
      phone: "+91 98765 43210",
      email: pharmacyEmail,
      address: "Shop 12, Wellness Plaza, MG Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      latitude: 19.0760,
      longitude: 72.8777,
      isVerified: true,
      isActive: true,
    },
  });

  // ---------------------------------------------------------------------------
  // 3. DEMO DELIVERY PARTNER ACCOUNT
  // ---------------------------------------------------------------------------
  const deliveryEmail = "demo.delivery@medilink.test";
  console.log(`[Seed] Provisioning Demo Delivery Partner: ${deliveryEmail}`);
  const deliveryUser = await prisma.user.upsert({
    where: { email: deliveryEmail },
    update: {
      passwordHash,
      role: UserRole.DELIVERY_PARTNER,
      isActive: true,
      verificationStatus: VerificationStatus.VERIFIED,
    },
    create: {
      email: deliveryEmail,
      passwordHash,
      phone: "+91 98765 43211",
      role: UserRole.DELIVERY_PARTNER,
      isActive: true,
      verificationStatus: VerificationStatus.VERIFIED,
    },
  });

  await prisma.deliveryPartner.upsert({
    where: { userId: deliveryUser.id },
    update: {
      phone: "+91 98765 43211",
      isVerified: true,
      isAvailable: true,
      isActive: true,
    },
    create: {
      userId: deliveryUser.id,
      phone: "+91 98765 43211",
      isVerified: true,
      isAvailable: true,
      isActive: true,
    },
  });

  // ---------------------------------------------------------------------------
  // 4. DEMO ADMIN ACCOUNT
  // ---------------------------------------------------------------------------
  const adminEmail = "demo.admin@medilink.test";
  console.log(`[Seed] Provisioning Demo Admin: ${adminEmail}`);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      verificationStatus: VerificationStatus.NOT_REQUIRED,
    },
    create: {
      email: adminEmail,
      passwordHash,
      phone: "+91 98765 99999",
      role: UserRole.ADMIN,
      isActive: true,
      verificationStatus: VerificationStatus.NOT_REQUIRED,
    },
  });

  // ---------------------------------------------------------------------------
  // 5. MEDICINE CATEGORIES & CATALOG
  // ---------------------------------------------------------------------------
  console.log("[Seed] Provisioning Medicine Categories & Catalog Items...");

  const categories = [
    { name: "Analgesics & Antipyretics", description: "Pain relief and fever reduction medications" },
    { name: "Antihistamines & Allergy", description: "Allergy and symptom relief medications" },
    { name: "Vitamins & Supplements", description: "Nutritional and immune support supplements" },
    { name: "General Wellness", description: "Daily healthcare and wellness essentials" },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    const createdCat = await prisma.medicineCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description, isActive: true },
      create: { name: cat.name, description: cat.description, isActive: true },
    });
    categoryMap.set(cat.name, createdCat.id);
  }

  const demoMedicines = [
    {
      name: "Paracetamol Demo 500mg",
      genericName: "Paracetamol",
      composition: "Paracetamol 500mg",
      description: "Fever reducer and mild to moderate pain relief.",
      manufacturer: "MediLink Pharma Labs",
      categoryName: "Analgesics & Antipyretics",
      price: 45.0,
      batchNumber: "BATCH-PARA-2026",
      quantity: 100,
    },
    {
      name: "Cetirizine Demo 10mg",
      genericName: "Cetirizine Hydrochloride",
      composition: "Cetirizine HCl 10mg",
      description: "Antihistamine for allergic rhinitis, sneezing, and itching.",
      manufacturer: "MediLink Pharma Labs",
      categoryName: "Antihistamines & Allergy",
      price: 35.0,
      batchNumber: "BATCH-CETI-2026",
      quantity: 100,
    },
    {
      name: "Vitamin C Demo 500mg",
      genericName: "Ascorbic Acid",
      composition: "Ascorbic Acid 500mg",
      description: "Antioxidant supplement supporting immune health.",
      manufacturer: "MediLink Nutraceuticals",
      categoryName: "Vitamins & Supplements",
      price: 60.0,
      batchNumber: "BATCH-VITC-2026",
      quantity: 100,
    },
    {
      name: "Demo Medicine A",
      genericName: "Amoxicillin Demo 250mg",
      composition: "Amoxicillin Trihydrate 250mg",
      description: "Broad-spectrum antibacterial medication for demo purposes.",
      manufacturer: "Demo BioSciences",
      categoryName: "General Wellness",
      price: 120.0,
      batchNumber: "BATCH-MEDA-2026",
      quantity: 100,
    },
    {
      name: "Demo Medicine B",
      genericName: "Ibuprofen Demo 400mg",
      composition: "Ibuprofen 400mg",
      description: "Non-steroidal anti-inflammatory medication for demo purposes.",
      manufacturer: "Demo BioSciences",
      categoryName: "Analgesics & Antipyretics",
      price: 80.0,
      batchNumber: "BATCH-MEDB-2026",
      quantity: 100,
    },
  ];

  const now = new Date();
  const mfgDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const expDate = new Date(now.getFullYear() + 2, now.getMonth(), 1);

  for (const medData of demoMedicines) {
    const categoryId = categoryMap.get(medData.categoryName)!;

    // 5A. Medicine Catalog Item
    const existingMed = await prisma.medicine.findFirst({
      where: { name: medData.name },
    });

    let medicineId = existingMed?.id;
    if (existingMed) {
      await prisma.medicine.update({
        where: { id: existingMed.id },
        data: {
          genericName: medData.genericName,
          composition: medData.composition,
          description: medData.description,
          manufacturer: medData.manufacturer,
          categoryId,
          isActive: true,
        },
      });
    } else {
      const createdMed = await prisma.medicine.create({
        data: {
          name: medData.name,
          genericName: medData.genericName,
          composition: medData.composition,
          description: medData.description,
          manufacturer: medData.manufacturer,
          categoryId,
          prescriptionRequired: false,
          isActive: true,
        },
      });
      medicineId = createdMed.id;
    }

    // 5B. Link Medicine to Demo Pharmacy Inventory
    const pharmacyMed = await prisma.pharmacyMedicine.upsert({
      where: {
        pharmacyId_medicineId: {
          pharmacyId: demoPharmacy.id,
          medicineId: medicineId!,
        },
      },
      update: {
        sellingPrice: medData.price,
        isAvailable: true,
      },
      create: {
        pharmacyId: demoPharmacy.id,
        medicineId: medicineId!,
        sellingPrice: medData.price,
        isAvailable: true,
      },
    });

    // 5C. Inventory Batch
    await prisma.inventoryBatch.upsert({
      where: {
        pharmacyMedicineId_batchNumber: {
          pharmacyMedicineId: pharmacyMed.id,
          batchNumber: medData.batchNumber,
        },
      },
      update: {
        manufacturingDate: mfgDate,
        expiryDate: expDate,
        quantity: medData.quantity,
        reservedQuantity: 0,
      },
      create: {
        pharmacyMedicineId: pharmacyMed.id,
        batchNumber: medData.batchNumber,
        manufacturingDate: mfgDate,
        expiryDate: expDate,
        quantity: medData.quantity,
        reservedQuantity: 0,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // 6. DEMO COUPONS & DISCOUNTS
  // ---------------------------------------------------------------------------
  console.log("[Seed] Provisioning Demo Discount Coupons...");
  await prisma.discount.upsert({
    where: { code: "DEMO10" },
    update: {
      type: DiscountType.PERCENTAGE,
      value: 10.0,
      maxDiscount: 50.0,
      minimumOrderAmount: 100.0,
      isActive: true,
    },
    create: {
      code: "DEMO10",
      type: DiscountType.PERCENTAGE,
      value: 10.0,
      maxDiscount: 50.0,
      minimumOrderAmount: 100.0,
      isActive: true,
    },
  });

  await prisma.discount.upsert({
    where: { code: "SAVE50" },
    update: {
      type: DiscountType.FIXED,
      value: 50.0,
      minimumOrderAmount: 200.0,
      isActive: true,
    },
    create: {
      code: "SAVE50",
      type: DiscountType.FIXED,
      value: 50.0,
      minimumOrderAmount: 200.0,
      isActive: true,
    },
  });

  console.log("==================================================");
  console.log("✅ MediLink Demo Seed Completed Successfully!");
  console.log("==================================================");
  console.log("Credentials Summary (Password for all: Demo@12345):");
  console.log("  - Customer:         demo.customer@medilink.test");
  console.log("  - Pharmacy:         demo.pharmacy@medilink.test");
  console.log("  - Delivery Partner: demo.delivery@medilink.test");
  console.log("  - Admin:            demo.admin@medilink.test");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("❌ [Seed Error]:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
