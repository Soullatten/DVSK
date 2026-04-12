import type { Request, Response, NextFunction } from "express";
import { firebaseAuth } from "../config/firebase.js";
import { prisma } from "../config/database.js";
import { unauthorized, forbidden } from "../utils/apiResponse.js";
import type { Role } from "@prisma/client";

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return unauthorized(res, "No token provided");

    const decoded = await firebaseAuth.verifyIdToken(token);

    let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email || null,
          phone: decoded.phone_number || null,
          name: decoded.name || null,
          avatar: decoded.picture || null,
        },
      });
    }

    req.user = user;
    next();
  } catch {
    return unauthorized(res, "Invalid or expired token");
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return unauthorized(res);
    if (!roles.includes(req.user.role)) return forbidden(res, "Insufficient permissions");
    next();
  };
}

export const requireAdmin = requireRole("ADMIN", "SUPER_ADMIN");
export const requireSuperAdmin = requireRole("SUPER_ADMIN");
