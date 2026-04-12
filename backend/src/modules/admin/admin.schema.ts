import { z } from "zod";

export const updateRoleSchema = z.object({
  role: z.enum(["CUSTOMER", "ADMIN", "SUPER_ADMIN"]),
});

export const couponSchema = z.object({
  code: z.string().min(3).max(30).toUpperCase(),
  description: z.string().max(200).optional(),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z.number().positive(),
  maxDiscount: z.number().positive().optional(),
  minOrderValue: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  isActive: z.boolean().default(true),
});
