import type { Request, Response } from "express";
import * as poService from "./po.service.js";
import { success, created, notFound, badRequest } from "../../utils/apiResponse.js";

export async function list(_req: Request, res: Response) {
  const orders = await poService.listPurchaseOrders();
  return success(res, orders);
}

export async function getOne(req: Request, res: Response) {
  const order = await poService.getPurchaseOrderById(req.params.id as string);
  if (!order) return notFound(res, "Purchase order not found");
  return success(res, order);
}

export async function create(req: Request, res: Response) {
  try {
    const order = await poService.createPurchaseOrder(req.body);
    return created(res, order, "Purchase order created");
  } catch (err: any) {
    return badRequest(res, err?.message || "Failed to create purchase order");
  }
}

export async function update(req: Request, res: Response) {
  try {
    const order = await poService.updatePurchaseOrder(req.params.id as string, req.body);
    return success(res, order, "Purchase order updated");
  } catch (err: any) {
    return badRequest(res, err?.message || "Failed to update purchase order");
  }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const order = await poService.updatePurchaseOrderStatus(
      req.params.id as string,
      req.body.status
    );
    return success(res, order, "Status updated");
  } catch (err: any) {
    return badRequest(res, err?.message || "Failed to update status");
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const result = await poService.deletePurchaseOrder(req.params.id as string);
    return success(res, result, "Purchase order deleted");
  } catch (err: any) {
    return badRequest(res, err?.message || "Failed to delete purchase order");
  }
}
