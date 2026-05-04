import type { Request, Response } from "express";
import * as orderService from "./order.service.js";
import { success, created, notFound, badRequest } from "../../utils/apiResponse.js";
import { LiveEvents } from "../../realtime/events.js";

export async function createOrder(req: Request, res: Response) {
  try {
    const order = await orderService.createOrder(req.user!.id, req.body);
    // Fire & forget — don't block the HTTP response on geocoding
    LiveEvents.orderPlaced({
      orderNumber: order.orderNumber,
      city: order.address?.city ?? null,
      state: order.address?.state ?? null,
      country: order.address?.country ?? null,
      total: Number(order.total),
    }).catch((e) => console.error("[LiveEvents.orderPlaced]", e));
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

export async function getStats(req: Request, res: Response) {
  const period = (req.query.period as string) || "Last 30 days";
  const stats = await orderService.getOrderStats(
    period as "Today" | "Last 7 days" | "Last 30 days"
  );
  return success(res, stats);
}

export async function getLiveFeed(req: Request, res: Response) {
  const period = (req.query.period as string) || "Today";
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const orders = await orderService.getLiveFeedOrders({
    period: period as "Today" | "Last 7 days" | "Last 30 days",
    limit,
  });
  return success(res, orders);
}

export async function getAdminOrderDetail(req: Request, res: Response) {
  const order = await orderService.getOrderByIdAdmin(req.params.id as string);
  if (!order) return notFound(res, "Order not found");
  return success(res, order);
}
