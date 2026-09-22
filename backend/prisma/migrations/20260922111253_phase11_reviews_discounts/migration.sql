-- Phase 11: Reviews, Ratings & Discounts
-- Add orderId FK and isHidden flag to Review table
-- Add unique constraints for duplicate-prevention
-- Add reviews relation index on Order

-- Add new columns to Review
ALTER TABLE "Review" ADD COLUMN "orderId" TEXT;
ALTER TABLE "Review" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- Add FK constraint for orderId
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" 
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add unique constraints (using partial indexes since orderId, medicineId etc can be NULL)
-- Postgres: NULL values are not considered equal in UNIQUE constraints by default.
-- We use a workaround with a unique index using COALESCE for nullable columns.
-- Strategy: unique per (customerId, orderId, medicineId) only when all three non-null
CREATE UNIQUE INDEX "unique_medicine_review_per_order" 
  ON "Review"("customerId", "orderId", "medicineId") 
  WHERE "medicineId" IS NOT NULL AND "orderId" IS NOT NULL;

CREATE UNIQUE INDEX "unique_pharmacy_review_per_order" 
  ON "Review"("customerId", "orderId", "pharmacyId") 
  WHERE "pharmacyId" IS NOT NULL AND "orderId" IS NOT NULL;

CREATE UNIQUE INDEX "unique_delivery_review_per_order" 
  ON "Review"("customerId", "orderId", "deliveryPartnerId") 
  WHERE "deliveryPartnerId" IS NOT NULL AND "orderId" IS NOT NULL;

-- Add supporting indexes
CREATE INDEX "Review_orderId_idx" ON "Review"("orderId");
CREATE INDEX "Review_isHidden_idx" ON "Review"("isHidden");
