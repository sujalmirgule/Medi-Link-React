import { Request, Response, NextFunction } from "express";
import { PaymentService } from "./payment.service";
import {
  createPaymentSchema,
  verifyPaymentSchema,
  failPaymentSchema,
  refundPaymentSchema,
} from "./payment.validation";

export async function createPaymentIntent(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const { orderId } = req.params;
    const parsedBody = createPaymentSchema.parse(req.body);

    const payment = await PaymentService.createPaymentIntent(
      user.id,
      user.role,
      orderId,
      parsedBody
    );

    res.status(201).json({
      success: true,
      message: "Payment intent initialized successfully.",
      data: { payment },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentForOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const { orderId } = req.params;
    const pharmacyId = user.pharmacy?.id;

    const payment = await PaymentService.getPaymentForOrder(
      user.id,
      user.role,
      orderId,
      pharmacyId
    );

    res.status(200).json({
      success: true,
      data: { payment },
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const { paymentId } = req.params;
    const parsedBody = verifyPaymentSchema.parse(req.body);

    const payment = await PaymentService.verifyPayment(
      user.id,
      user.role,
      paymentId,
      parsedBody
    );

    res.status(200).json({
      success: true,
      message: "Payment verified and completed successfully.",
      data: { payment },
    });
  } catch (err) {
    next(err);
  }
}

export async function failPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const { paymentId } = req.params;
    const parsedBody = failPaymentSchema.parse(req.body);

    const payment = await PaymentService.failPayment(
      user.id,
      user.role,
      paymentId,
      parsedBody
    );

    res.status(200).json({
      success: true,
      message: "Payment marked as failed.",
      data: { payment },
    });
  } catch (err) {
    next(err);
  }
}

export async function refundPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const adminUser = (req as any).user;
    const { paymentId } = req.params;
    const parsedBody = refundPaymentSchema.parse(req.body);

    const payment = await PaymentService.refundPayment(
      adminUser.id,
      paymentId,
      parsedBody
    );

    res.status(200).json({
      success: true,
      message: "Payment refunded successfully.",
      data: { payment },
    });
  } catch (err) {
    next(err);
  }
}

export async function listPaymentsAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, status, method, search } = req.query;
    const result = await PaymentService.listPaymentsAdmin({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string,
      method: method as string,
      search: search as string,
    });

    res.status(200).json({
      success: true,
      data: result.items,
      metrics: result.metrics,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentDetailAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const payment = await PaymentService.getPaymentDetailAdmin(id);

    res.status(200).json({
      success: true,
      data: { payment },
    });
  } catch (err) {
    next(err);
  }
}
