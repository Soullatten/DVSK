import type { Request, Response } from "express";
import * as orderService from "./order.service.js";
import { success, created, notFound, badRequest } from "../../utils/apiResponse.js";

export async function createOrder(req: Request, res: Response) {
  try {
    const order = await orderService.createOrder(req.user!.id, req.body);
    return created(res, order, "Order placed successfully");
  } catch (err: any) {
    return badRequest(res, err.message);
  }
}

export async function getUserOrders(req: Request, res: Response) {
  const result = await orderService.getUserOrders(req.user!.id, req.query);
  return success(res, result.orders, "Orders fetched", 200, result.meta);
}

export async function getOrder(req: Request, res: Response) {
  const order = await orderService.getOrderById(req.user!.id, req.params.id as string);
  if (!order) return notFound(res, "Order not found");
  return success(res, order);
}

export async function cancelOrder(req: Request, res: Response) {
  try {
    const order = await orderService.cancelOrder(req.user!.id, req.params.id as string);
    return success(res, order, "Order cancelled");
  } catch (err: any) {
    return badRequest(res, err.message);
  }
}

export async function getAllOrders(req: Request, res: Response) {
  const result = await orderService.getAllOrders(req.query);
  return success(res, result.orders, "Orders fetched", 200, result.meta);
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const order = await orderService.updateOrderStatus(req.params.id as string, req.body.status, req.body.adminNotes);
    return success(res, order, "Order status updated");
  } catch (err: any) {
    return badRequest(res, err.message);
  }
}

export async function updateTracking(req: Request, res: Response) {
  try {
    const order = await orderService.updateTracking(req.params.id as string, req.body.shippingProvider, req.body.trackingNumber);
    return success(res, order, "Tracking info updated");
  } catch (err: any) {
    return badRequest(res, err.message);
  }
}
