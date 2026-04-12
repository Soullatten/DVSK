import type { Request, Response } from "express";
import * as cartService from "./cart.service.js";
import { success, badRequest } from "../../utils/apiResponse.js";

export async function getCart(req: Request, res: Response) {
  const cart = await cartService.getCart(req.user!.id);
  return success(res, cart);
}

export async function addItem(req: Request, res: Response) {
  try {
    const cart = await cartService.addItem(req.user!.id, req.body);
    return success(res, cart, "Item added to cart");
  } catch (err: any) {
    return badRequest(res, err.message);
  }
}

export async function updateItem(req: Request, res: Response) {
  try {
    const cart = await cartService.updateItem(req.user!.id, req.params.itemId as string, req.body.quantity);
    return success(res, cart, "Cart updated");
  } catch (err: any) {
    return badRequest(res, err.message);
  }
}

export async function removeItem(req: Request, res: Response) {
  try {
    const cart = await cartService.removeItem(req.user!.id, req.params.itemId as string);
    return success(res, cart, "Item removed");
  } catch (err: any) {
    return badRequest(res, err.message);
  }
}

export async function clearCart(req: Request, res: Response) {
  const cart = await cartService.clearCart(req.user!.id);
  return success(res, cart, "Cart cleared");
}

export async function applyCoupon(req: Request, res: Response) {
  try {
    const cart = await cartService.getCart(req.user!.id);
    const result = await cartService.applyCoupon(req.body.code, cart.total);
    return success(res, result, "Coupon applied");
  } catch (err: any) {
    return badRequest(res, err.message);
  }
}
