import { Prisma } from "@prisma/client";
import { AllocatedItem, OrderItemInput } from "./order.types";

function badRequestError(message: string): never {
  const err = new Error(message) as any;
  err.status = 400;
  err.statusCode = 400;
  throw err;
}

export class InventoryReservationService {
  /**
   * Validate and allocate inventory stock atomically inside a database transaction.
   * Enforces:
   * 1. Single pharmacy ownership (all items belong to pharmacyId).
   * 2. Medicine listing isAvailable = true.
   * 3. Batches are non-expired (expiryDate > now).
   * 4. Sufficient available stock (quantity - reservedQuantity >= requestedQty).
   * 5. Atomic reservation increment (concurrency-safe).
   */
  static async validateAndAllocateStock(
    tx: Prisma.TransactionClient,
    pharmacyId: string,
    items: OrderItemInput[]
  ): Promise<AllocatedItem[]> {
    const allocatedItems: AllocatedItem[] = [];
    const now = new Date();

    for (const item of items) {
      if (item.quantity <= 0) {
        badRequestError(`Invalid requested quantity (${item.quantity}). Quantity must be at least 1.`);
      }

      // 1. Fetch pharmacy medicine listing
      const listing = await tx.pharmacyMedicine.findUnique({
        where: { id: item.pharmacyMedicineId },
        include: {
          medicine: true,
          batches: {
            where: {
              expiryDate: { gt: now },
            },
            orderBy: {
              expiryDate: "asc", // FEFO deterministic allocation
            },
          },
        },
      });

      if (!listing) {
        badRequestError(`Medicine listing not found (${item.pharmacyMedicineId}).`);
      }

      if (listing.pharmacyId !== pharmacyId) {
        badRequestError(
          `Medicine "${listing.medicine.name}" does not belong to the selected pharmacy.`
        );
      }

      if (!listing.isAvailable) {
        badRequestError(
          `Medicine "${listing.medicine.name}" is currently marked unavailable by the pharmacy.`
        );
      }

      // 2. Calculate total available stock across non-expired batches
      const totalAvailable = listing.batches.reduce(
        (sum, b) => sum + Math.max(0, b.quantity - b.reservedQuantity),
        0
      );

      if (totalAvailable < item.quantity) {
        badRequestError(
          `Insufficient stock for "${listing.medicine.name}". Requested: ${item.quantity}, Available: ${totalAvailable}.`
        );
      }

      // 3. Allocate stock across batches (deterministic FEFO)
      let remainingToAllocate = item.quantity;

      for (const batch of listing.batches) {
        const availableInBatch = Math.max(0, batch.quantity - batch.reservedQuantity);
        if (availableInBatch <= 0) continue;

        const allocateFromBatch = Math.min(remainingToAllocate, availableInBatch);

        // Concurrency-safe atomic reservation:
        // Enforces DB-level atomic check: (quantity - reservedQuantity) >= allocateFromBatch
        const count = await tx.$executeRaw`
          UPDATE "InventoryBatch"
          SET "reservedQuantity" = "reservedQuantity" + ${allocateFromBatch}
          WHERE "id" = ${batch.id}
            AND ("quantity" - "reservedQuantity") >= ${allocateFromBatch}
        `;

        if (count === 0) {
          badRequestError(
            `Concurrency conflict: stock for "${listing.medicine.name}" in batch ${batch.batchNumber} was modified by another order. Please try again.`
          );
        }

        const unitPrice = listing.sellingPrice;
        const totalPrice = new Prisma.Decimal(unitPrice).mul(allocateFromBatch);

        allocatedItems.push({
          pharmacyMedicineId: listing.id,
          inventoryBatchId: batch.id,
          quantity: allocateFromBatch,
          unitPrice,
          totalPrice,
          medicineName: listing.medicine.name,
        });

        remainingToAllocate -= allocateFromBatch;
        if (remainingToAllocate <= 0) break;
      }

      if (remainingToAllocate > 0) {
        badRequestError(
          `Could not completely allocate stock for "${listing.medicine.name}". Insufficient batch units.`
        );
      }
    }

    return allocatedItems;
  }

  /**
   * Release reserved stock back into available inventory on order cancellation or rejection.
   * Decrements reservedQuantity atomically.
   */
  static async releaseReservedStock(
    tx: Prisma.TransactionClient,
    items: { inventoryBatchId: string | null; quantity: number }[]
  ): Promise<void> {
    for (const item of items) {
      if (!item.inventoryBatchId || item.quantity <= 0) continue;

      await tx.inventoryBatch.update({
        where: { id: item.inventoryBatchId },
        data: {
          reservedQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }
  }
}
