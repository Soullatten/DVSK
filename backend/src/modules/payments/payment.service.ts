import crypto from "crypto";
import { prisma } from "../../config/database.js";
import { razorpay } from "../../config/razorpay.js";
import { env } from "../../env.js";

export async function createRazorpayOrder(orderId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, status: "PENDING" },
  });
  if (!order) throw new Error("Order not found or already paid");

  // Check if payment already exists
  const existingPayment = await prisma.payment.findUnique({ where: { orderId } });
  if (existingPayment && existingPayment.status !== "FAILED") {
    return {
      razorpayOrderId: existingPayment.razorpayOrderId,
      amount: Number(existingPayment.amount) * 100,
      currency: existingPayment.currency,
      key: env.RAZORPAY_KEY_ID,
    };
  }

  const amountInPaise = Math.round(Number(order.total) * 100);

  const rzpOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: order.orderNumber,
    notes: { orderId: order.id, userId },
  });

  // Save payment record
  if (existingPayment) {
    await prisma.payment.update({
      where: { id: existingPayment.id },
      data: { razorpayOrderId: rzpOrder.id, amount: order.total, status: "PENDING" },
    });
  } else {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        amount: order.total,
        currency: "INR",
      },
    });
  }

  return {
    razorpayOrderId: rzpOrder.id,
    amount: amountInPaise,
    currency: "INR",
    key: env.RAZORPAY_KEY_ID,
  };
}

export async function verifyPayment(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  // Verify signature
  const body = data.razorpay_order_id + "|" + data.razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== data.razorpay_signature) {
    throw new Error("Invalid payment signature");
  }

  // Update payment
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: data.razorpay_order_id },
  });
  if (!payment) throw new Error("Payment record not found");

  // Fetch payment details from Razorpay
  const rzpPayment = await razorpay.payments.fetch(data.razorpay_payment_id);

  return prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: data.razorpay_payment_id,
        razorpaySignature: data.razorpay_signature,
        method: rzpPayment.method || null,
        status: "CAPTURED",
      },
    });

    // Confirm the order + decrement stock
    const order = await tx.order.findUnique({
      where: { id: payment.orderId },
      include: { items: true },
    });

    if (order && order.status === "PENDING") {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { decrement: item.quantity },
            reservedStock: { decrement: item.quantity },
          },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: "CONFIRMED" },
      });
    }

    return updatedPayment;
  });
}

export async function handleWebhook(body: any, signature: string) {
  if (env.RAZORPAY_WEBHOOK_SECRET) {
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest("hex");

    if (expectedSignature !== signature) {
      throw new Error("Invalid webhook signature");
    }
  }

  const event = body.event;
  const payload = body.payload;

  if (event === "payment.captured") {
    const rzpOrderId = payload.payment.entity.order_id;
    const rzpPaymentId = payload.payment.entity.id;

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: rzpOrderId },
    });

    if (payment && payment.status === "PENDING") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: rzpPaymentId,
          method: payload.payment.entity.method,
          status: "CAPTURED",
        },
      });

      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "CONFIRMED" },
      });
    }
  }

  if (event === "payment.failed") {
    const rzpOrderId = payload.payment.entity.order_id;
    await prisma.payment.updateMany({
      where: { razorpayOrderId: rzpOrderId, status: "PENDING" },
      data: { status: "FAILED" },
    });
  }
}

export async function processRefund(paymentId: string, amount?: number) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });
  if (!payment || !payment.razorpayPaymentId) throw new Error("Payment not found");
  if (payment.status !== "CAPTURED") throw new Error("Payment not captured");

  const refundAmount = amount || Number(payment.amount);
  const refundAmountPaise = Math.round(refundAmount * 100);

  const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
    amount: refundAmountPaise,
  });

  const isPartial = refundAmount < Number(payment.amount);

  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      refundId: refund.id,
      refundAmount: refundAmount,
      status: isPartial ? "PARTIALLY_REFUNDED" : "REFUNDED",
    },
  });
}
