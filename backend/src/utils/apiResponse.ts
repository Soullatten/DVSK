import type { Response } from "express";
import type { PaginationMeta } from "../types/index.js";

export function success<T>(res: Response, data: T, message = "Success", status = 200, meta?: PaginationMeta) {
  return res.status(status).json({
    success: true,
    data,
    message,
    ...(meta && { meta }),
  });
}

export function created<T>(res: Response, data: T, message = "Created successfully") {
  return success(res, data, message, 201);
}

export function error(res: Response, status: number, code: string, message: string, details?: Array<{ field: string; message: string }>) {
  return res.status(status).json({
    success: false,
    error: { code, message, ...(details && { details }) },
  });
}

export function notFound(res: Response, message = "Resource not found") {
  return error(res, 404, "NOT_FOUND", message);
}

export function unauthorized(res: Response, message = "Unauthorized") {
  return error(res, 401, "UNAUTHORIZED", message);
}

export function forbidden(res: Response, message = "Forbidden") {
  return error(res, 403, "FORBIDDEN", message);
}

export function badRequest(res: Response, message: string, details?: Array<{ field: string; message: string }>) {
  return error(res, 400, "VALIDATION_ERROR", message, details);
}
