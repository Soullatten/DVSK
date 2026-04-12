import type { Request, Response } from "express";
import * as adminService from "./admin.service.js";
import { success, created, badRequest } from "../../utils/apiResponse.js";

export async function dashboard(_req: Request, res: Response) {
  const stats = await adminService.getDashboardStats();
  return success(res, stats);
}

export async function listUsers(req: Request, res: Response) {
  const result = await adminService.listUsers(req.query);
  return success(res, result.users, "Users fetched", 200, result.meta);
}

export async function updateUserRole(req: Request, res: Response) {
  try {
    const user = await adminService.updateUserRole(req.params.id as string, req.body.role);
    return success(res, user, "Role updated");
  } catch (err: any) {
    return badRequest(res, err.message);
  }
}

export async function inventory(_req: Request, res: Response) {
  const items = await adminService.getLowStockItems();
  return success(res, items);
}

export async function revenue(req: Request, res: Response) {
  const period = (req.query.period as string) || "monthly";
  const data = await adminService.getRevenueReport(period);
  return success(res, data);
}

export async function createCoupon(req: Request, res: Response) {
  try {
    const coupon = await adminService.createCoupon(req.body);
    return created(res, coupon);
  } catch (err: any) {
    if (err.code === "P2002") return badRequest(res, "Coupon code already exists");
    return badRequest(res, err.message);
  }
}

export async function listCoupons(_req: Request, res: Response) {
  const coupons = await adminService.listCoupons();
  return success(res, coupons);
}

export async function updateCoupon(req: Request, res: Response) {
  const coupon = await adminService.updateCoupon(req.params.id as string, req.body);
  return success(res, coupon, "Coupon updated");
}

export async function deleteCoupon(req: Request, res: Response) {
  await adminService.deleteCoupon(req.params.id as string);
  return success(res, null, "Coupon deactivated");
}
