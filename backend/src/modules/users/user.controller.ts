import type { Request, Response } from "express";
import * as userService from "./user.service.js";
import { success, notFound } from "../../utils/apiResponse.js";

export async function getProfile(req: Request, res: Response) {
  return success(res, req.user);
}

export async function updateProfile(req: Request, res: Response) {
  const user = await userService.updateProfile(req.user!.id, req.body);
  return success(res, user, "Profile updated");
}

export async function getAddresses(req: Request, res: Response) {
  const addresses = await userService.getAddresses(req.user!.id);
  return success(res, addresses);
}

export async function createAddress(req: Request, res: Response) {
  const address = await userService.createAddress(req.user!.id, req.body);
  return success(res, address, "Address added", 201);
}

export async function updateAddress(req: Request, res: Response) {
  const address = await userService.updateAddress(req.user!.id, req.params.id as string, req.body);
  if (!address) return notFound(res, "Address not found");
  return success(res, address, "Address updated");
}

export async function deleteAddress(req: Request, res: Response) {
  const address = await userService.deleteAddress(req.user!.id, req.params.id as string);
  if (!address) return notFound(res, "Address not found");
  return success(res, null, "Address deleted");
}

export async function setDefaultAddress(req: Request, res: Response) {
  const address = await userService.setDefaultAddress(req.user!.id, req.params.id as string);
  if (!address) return notFound(res, "Address not found");
  return success(res, address, "Default address updated");
}
