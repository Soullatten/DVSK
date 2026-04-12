import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
});

export const addressSchema = z.object({
  label: z.string().max(50).default("Home"),
  fullName: z.string().min(1).max(100),
  phone: z.string().min(10).max(15),
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().min(6).max(10),
  country: z.string().default("India"),
  isDefault: z.boolean().default(false),
});
