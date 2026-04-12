import type { Request, Response } from "express";
import * as authService from "./auth.service.js";
import { success, error } from "../../utils/apiResponse.js";

export async function register(req: Request, res: Response) {
  try {
    const { firebaseToken, name } = req.body;
    const user = await authService.verifyAndGetUser(firebaseToken, name);
    return success(res, user, "Registration successful", 201);
  } catch (err: any) {
    return error(res, 401, "AUTH_ERROR", err.message || "Registration failed");
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { firebaseToken } = req.body;
    const user = await authService.verifyAndGetUser(firebaseToken);
    return success(res, user, "Login successful");
  } catch (err: any) {
    return error(res, 401, "AUTH_ERROR", err.message || "Login failed");
  }
}

export async function me(req: Request, res: Response) {
  try {
    const user = await authService.getCurrentUser(req.user!.id);
    return success(res, user);
  } catch (err: any) {
    return error(res, 500, "INTERNAL_ERROR", err.message);
  }
}
