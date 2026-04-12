import { z } from "zod";

export const createPaymentOrderSchema = z.object({
  orderId: z.string().min(1),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const refundSchema = z.object({
  amount: z.number().positive().optional(), // partial refund; omit for full
});
