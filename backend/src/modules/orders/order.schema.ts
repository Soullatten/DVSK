import { z } from "zod";

const optionalString = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().optional()
);

export const shippingAddressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  email: optionalString,
  addressLine1: z.string().min(1),
  addressLine2: optionalString,
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
  country: z.string().optional(),
});

export const createOrderSchema = z.object({
  addressId: optionalString,
  shippingAddress: shippingAddressSchema.optional(),
  couponCode: optionalString,
  notes: z.string().max(500).optional(),
}).refine(
  (data) => Boolean(data.addressId) || Boolean(data.shippingAddress),
  { message: "Either addressId or shippingAddress is required" }
);

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"]),
  adminNotes: z.string().optional(),
});

export const updateTrackingSchema = z.object({
  shippingProvider: z.string().min(1),
  trackingNumber: z.string().min(1),
});
