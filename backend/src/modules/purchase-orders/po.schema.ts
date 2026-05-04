import { z } from "zod";

const numericString = z.union([z.number(), z.string()]);

const optionalString = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().optional()
);

export const createPurchaseOrderSchema = z.object({
  supplier: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  amount: numericString,
  currency: z.string().optional(),
  itemsLabel: z.string().min(1),
  eta: optionalString,
  lat: z.number().optional(),
  lng: z.number().optional(),
  notes: optionalString,
  lineItems: z.array(z.object({
    variantId: z.string().min(1),
    quantity: z.number().int().positive(),
    unitCost: numericString.optional(),
  })).optional(),
}).passthrough();

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum(["PROCESSING", "IN_TRANSIT", "CUSTOMS", "DELIVERED", "CANCELLED"]),
}).passthrough();

export const updatePurchaseOrderSchema = z.object({
  supplier: optionalString,
  city: optionalString,
  country: optionalString,
  amount: numericString.optional(),
  currency: optionalString,
  itemsLabel: optionalString,
  eta: optionalString,
  lat: z.number().optional(),
  lng: z.number().optional(),
  notes: optionalString,
  progress: z.number().int().min(0).max(100).optional(),
  lineItems: z.array(z.object({
    variantId: z.string().min(1),
    quantity: z.number().int().positive(),
    unitCost: numericString.optional(),
  })).optional(),
}).passthrough();
