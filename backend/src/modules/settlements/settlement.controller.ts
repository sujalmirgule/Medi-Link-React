import { Request, Response, NextFunction } from "express";
import { SettlementService } from "./settlement.service";

export async function getPharmacySettlements(req: Request, res: Response, next: NextFunction) {
  try {
    const pharmacyId = (req as any).user?.pharmacy?.id;
    if (!pharmacyId) {
      const err: any = new Error("Pharmacy identity not found on user profile.");
      err.status = 403;
      throw err;
    }

    const { page, limit, status } = req.query;
    const result = await SettlementService.listPharmacySettlements(pharmacyId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string,
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

export async function getPharmacySettlementById(req: Request, res: Response, next: NextFunction) {
  try {
    const pharmacyId = (req as any).user?.pharmacy?.id;
    if (!pharmacyId) {
      const err: any = new Error("Pharmacy identity not found on user profile.");
      err.status = 403;
      throw err;
    }

    const { id } = req.params;
    const settlement = await SettlementService.getPharmacySettlementById(pharmacyId, id);

    res.status(200).json({
      success: true,
      data: { settlement },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminSettlements(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, status, pharmacyId, search } = req.query;
    const result = await SettlementService.listSettlementsAdmin({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string,
      pharmacyId: pharmacyId as string,
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

export async function getAdminSettlementById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const settlement = await SettlementService.getSettlementDetailAdmin(id);

    res.status(200).json({
      success: true,
      data: { settlement },
    });
  } catch (err) {
    next(err);
  }
}

export async function settleAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const adminUserId = (req as any).user?.id;
    const { id } = req.params;
    const settlement = await SettlementService.settleAdmin(adminUserId, id);

    // Fire-and-forget notification to pharmacy owner
    SettlementService._notifySettleAdmin(
      settlement.id,
      settlement.pharmacyId,
      settlement.orderId,
      settlement.amount,
      settlement.order?.orderNumber
    ).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Settlement marked as SETTLED successfully.",
      data: { settlement },
    });
  } catch (err) {
    next(err);
  }
}

export async function failSettlementAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const adminUserId = (req as any).user?.id;
    const { id } = req.params;
    const { reason } = req.body;
    const settlement = await SettlementService.failSettlementAdmin(adminUserId, id, reason);

    // Fire-and-forget notification to pharmacy owner
    SettlementService._notifyFailSettlementAdmin(
      settlement.id,
      settlement.pharmacyId,
      settlement.orderId,
      settlement.amount,
      reason,
      settlement.order?.orderNumber
    ).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Settlement marked as FAILED.",
      data: { settlement },
    });
  } catch (err) {
    next(err);
  }
}
