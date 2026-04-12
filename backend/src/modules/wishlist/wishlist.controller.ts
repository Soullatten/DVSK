import type { Request, Response } from "express";
import * as wishlistService from "./wishlist.service.js";
import { success } from "../../utils/apiResponse.js";

export async function getWishlist(req: Request, res: Response) {
  const items = await wishlistService.getWishlist(req.user!.id);
  return success(res, items);
}

export async function addToWishlist(req: Request, res: Response) {
  await wishlistService.addToWishlist(req.user!.id, req.params.productId as string);
  return success(res, null, "Added to wishlist", 201);
}

export async function removeFromWishlist(req: Request, res: Response) {
  await wishlistService.removeFromWishlist(req.user!.id, req.params.productId as string);
  return success(res, null, "Removed from wishlist");
}
