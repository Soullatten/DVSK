import type { Request, Response, NextFunction } from "express";
import { env } from "../env.js";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error("[ERROR]", err.message, env.NODE_ENV === "development" ? err.stack : "");

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: env.NODE_ENV === "production" ? "Something went wrong" : err.message,
    },
  });
}
