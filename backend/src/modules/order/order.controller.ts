import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate";
import { OrderService } from "./order.service";
import { orderCreateSchema, orderQuerySchema, orderRejectSchema } from "./order.validation";

export class OrderController {
  /**
   * Customer: Place a new order with atomic stock reservation
   */
  static async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validatedInput = orderCreateSchema.parse(req.body);
      const customerId = req.user!.id;

      const order = await OrderService.createOrder(customerId, validatedInput);

      res.status(201).json({
        success: true,
        message: "Order placed successfully. Inventory stock has been reserved.",
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Customer: Get order history
   */
  static async getCustomerOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = orderQuerySchema.parse(req.query);
      const customerId = req.user!.id;

      const { items, pagination } = await OrderService.getCustomerOrders(customerId, query);

      res.status(200).json({
        success: true,
        data: items,
        pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Customer: Get order details by ID
   */
  static async getCustomerOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const order = await OrderService.getCustomerOrderById(customerId, req.params.id);

      res.status(200).json({
        success: true,
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Pharmacy: List received orders
   */
  static async getPharmacyOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = req.user?.pharmacy?.id;
      if (!pharmacyId) {
        res.status(403).json({
          success: false,
          message: "User is not associated with a registered pharmacy.",
        });
        return;
      }

      const query = orderQuerySchema.parse(req.query);
      const { items, pagination } = await OrderService.getPharmacyOrders(pharmacyId, query);

      res.status(200).json({
        success: true,
        data: items,
        pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Pharmacy: Get single order details
   */
  static async getPharmacyOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = req.user?.pharmacy?.id;
      if (!pharmacyId) {
        res.status(403).json({
          success: false,
          message: "User is not associated with a registered pharmacy.",
        });
        return;
      }

      const order = await OrderService.getPharmacyOrderById(pharmacyId, req.params.id);

      res.status(200).json({
        success: true,
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Pharmacy: Accept pending order
   */
  static async acceptOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = req.user?.pharmacy?.id;
      if (!pharmacyId) {
        res.status(403).json({
          success: false,
          message: "User is not associated with a registered pharmacy.",
        });
        return;
      }

      const order = await OrderService.acceptOrder(pharmacyId, req.params.id, req.user!.id);

      res.status(200).json({
        success: true,
        message: "Order accepted successfully.",
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Pharmacy: Reject pending order and release reserved stock
   */
  static async rejectOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = req.user?.pharmacy?.id;
      if (!pharmacyId) {
        res.status(403).json({
          success: false,
          message: "User is not associated with a registered pharmacy.",
        });
        return;
      }

      const { reason } = orderRejectSchema.parse(req.body);
      const result = await OrderService.rejectOrder(pharmacyId, req.params.id, reason, req.user!.id);

      res.status(200).json({
        success: true,
        message: result.message,
        data: { order: result.order },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Pharmacy: Mark order as preparing (ACCEPTED -> PREPARING)
   */
  static async markPreparing(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = req.user?.pharmacy?.id;
      if (!pharmacyId) {
        res.status(403).json({
          success: false,
          message: "User is not associated with a registered pharmacy.",
        });
        return;
      }

      const order = await OrderService.markPreparing(pharmacyId, req.params.id, req.user!.id);

      res.status(200).json({
        success: true,
        message: "Order is now being prepared.",
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Pharmacy: Mark order as ready for pickup (PREPARING -> READY_FOR_PICKUP)
   */
  static async markReady(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pharmacyId = req.user?.pharmacy?.id;
      if (!pharmacyId) {
        res.status(403).json({
          success: false,
          message: "User is not associated with a registered pharmacy.",
        });
        return;
      }

      const order = await OrderService.markReady(pharmacyId, req.params.id, req.user!.id);

      res.status(200).json({
        success: true,
        message: "Order is ready for customer pickup.",
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  }
}
