import { z } from "zod";

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 10)) : 10)),
});

export const pharmacyProfileUpdateSchema = z.object({
  phone: z.string().trim().min(10, "Phone must be at least 10 digits").max(20).optional(),
  email: z.string().trim().email("Invalid email address").optional(),
  address: z.string().trim().min(3, "Address must be at least 3 characters").optional(),
  city: z.string().trim().min(2, "City must be at least 2 characters").optional(),
  state: z.string().trim().min(2, "State must be at least 2 characters").optional(),
  pincode: z.string().trim().min(4, "Pincode must be at least 4 characters").max(10).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export const pharmacyMedicineCreateSchema = z.object({
  medicineId: z.string().uuid("Invalid medicine ID"),
  sellingPrice: z.coerce
    .number({ required_error: "Selling price is required" })
    .positive("Selling price must be greater than zero"),
  isAvailable: z.boolean().optional().default(true),
});

export const pharmacyMedicineUpdateSchema = z.object({
  sellingPrice: z.coerce
    .number()
    .positive("Selling price must be greater than zero")
    .optional(),
  isAvailable: z.boolean().optional(),
});

export const inventoryBatchCreateSchema = z
  .object({
    pharmacyMedicineId: z.string().uuid("Invalid pharmacy medicine ID"),
    batchNumber: z.string().trim().min(1, "Batch number is required"),
    manufacturingDate: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        (val) => !val || !isNaN(Date.parse(val)),
        "Manufacturing date must be a valid date"
      ),
    expiryDate: z
      .string({ required_error: "Expiry date is required" })
      .trim()
      .refine((val) => !isNaN(Date.parse(val)), "Expiry date must be a valid date"),
    quantity: z.coerce
      .number({ required_error: "Quantity is required" })
      .int("Quantity must be an integer")
      .min(0, "Quantity cannot be negative"),
  })
  .refine(
    (data) => {
      if (data.manufacturingDate && data.expiryDate) {
        const mfg = new Date(data.manufacturingDate).getTime();
        const exp = new Date(data.expiryDate).getTime();
        return exp > mfg;
      }
      return true;
    },
    {
      message: "Expiry date must be after manufacturing date",
      path: ["expiryDate"],
    }
  );

export const inventoryBatchUpdateSchema = z
  .object({
    batchNumber: z.string().trim().min(1, "Batch number cannot be empty").optional(),
    manufacturingDate: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        (val) => !val || !isNaN(Date.parse(val)),
        "Manufacturing date must be a valid date"
      ),
    expiryDate: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), "Expiry date must be a valid date"),
    quantity: z.coerce
      .number()
      .int("Quantity must be an integer")
      .min(0, "Quantity cannot be negative")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.manufacturingDate && data.expiryDate) {
        const mfg = new Date(data.manufacturingDate).getTime();
        const exp = new Date(data.expiryDate).getTime();
        return exp > mfg;
      }
      return true;
    },
    {
      message: "Expiry date must be after manufacturing date",
      path: ["expiryDate"],
    }
  );

export const pharmacyMedicineFilterSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  isAvailable: z.enum(["true", "false", "all"]).optional().default("all"),
});

export const inventoryFilterSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  pharmacyMedicineId: z.string().trim().optional(),
  status: z.enum(["all", "active", "expiring_soon", "expired"]).optional().default("all"),
});

export const catalogFilterSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
});
