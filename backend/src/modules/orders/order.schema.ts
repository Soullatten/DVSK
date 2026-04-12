import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().min(1),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"]),
  adminNotes: z.string().optional(),
});

export const updateTrackingSchema = z.object({
  shippingProvider: z.string().min(1),
  trackingNumber: z.string().min(1),
});
