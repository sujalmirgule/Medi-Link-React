import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { DiscountController } from "./discount.controller";

// Public / Customer discount preview router
export const discountRouter = Router();
discountRouter.post("/preview", DiscountController.previewDiscount);

// Admin discount router
export const adminDiscountRouter = Router();
adminDiscountRouter.use(authenticate, authorize(UserRole.ADMIN));
adminDiscountRouter.post("/", DiscountController.adminCreateDiscount);
adminDiscountRouter.get("/", DiscountController.adminListDiscounts);
adminDiscountRouter.get("/:id", DiscountController.adminGetDiscount);
adminDiscountRouter.patch("/:id", DiscountController.adminUpdateDiscount);
adminDiscountRouter.patch("/:id/status", DiscountController.adminToggleStatus);
adminDiscountRouter.delete("/:id", DiscountController.adminDeleteDiscount);
