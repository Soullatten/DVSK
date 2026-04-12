import { prisma } from "../../config/database.js";
import { generateOrderNumber } from "../../utils/helpers.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import { clearCart, applyCoupon } from "../cart/cart.service.js";
import type { Prisma } from "@prisma/client";

const FREE_SHIPPING_THRESHOLD = 2500;
const SHIPPING_COST = 149;
const TAX_RATE = 0.18; // 18% GST

export async function createOrder(userId: string, data: { addressId: string; couponCode?: string; notes?: string }) {
  return prisma.$transaction(async (tx) => {
    // Get cart items
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1, orderBy: { position: "asc" } } } },
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

    // Verify address
    const address = await tx.address.findFirst({ where: { id: data.addressId, userId } });
    if (!address) throw new Error("Address not found");

    // Calculate totals + validate stock
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of cart.items) {
      if (!item.product.isActive) throw new Error(`${item.product.name} is no longer available`);

      const availableStock = item.variant.stock - item.variant.reservedStock;
      if (availableStock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.product.name} (${item.variant.size}/${item.variant.color})`);
      }

      const unitPrice = Number(item.variant.priceOverride || item.product.salePrice || item.product.basePrice);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        productName: item.product.name,
        size: item.variant.size,
        color: item.variant.color,
        image: item.product.images[0]?.url || null,
      });

      // Reserve stock
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { reservedStock: { increment: item.quantity } },
      });
    }

    // Apply coupon
    let discount = 0;
    if (data.couponCode) {
      const couponResult = await applyCoupon(data.couponCode, subtotal);
      discount = couponResult.discount;
      await tx.coupon.update({
        where: { code: data.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const taxableAmount = subtotal - discount;
    const tax = Math.round(taxableAmount * TAX_RATE * 100) / 100;
    const total = Math.round((taxableAmount + shippingCost + tax) * 100) / 100;

    // Create order
    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        addressId: data.addressId,
        subtotal,
        shippingCost,
        discount,
        tax,
        total,
        couponCode: data.couponCode,
        notes: data.notes,
        items: { create: orderItems },
      },
      include: { items: true, address: true },
    });

    // Clear cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  });
}

export async function getUserOrders(userId: string, query: any) {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        items: true,
        payment: { select: { status: true, method: true } },
      },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return { orders, meta: paginationMeta(total, page, limit) };
}

export async function getOrderById(userId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true, address: true, payment: true },
  });
}

export async function cancelOrder(userId: string, orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found");
    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      throw new Error("Order cannot be cancelled at this stage");
    }

    // Release reserved stock
    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { reservedStock: { decrement: item.quantity } },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
      include: { items: true },
    });
  });
}

export async function getAllOrders(query: any) {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const where: Prisma.OrderWhereInput = {};
  if (query.status) where.status = query.status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
        payment: { select: { status: true, method: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, meta: paginationMeta(total, page, limit) };
}

export async function updateOrderStatus(orderId: string, status: string, adminNotes?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new Error("Order not found");

    // If confirming: decrement actual stock, release reserved
    if (status === "CONFIRMED" && order.status === "PENDING") {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { decrement: item.quantity },
            reservedStock: { decrement: item.quantity },
          },
        });
      }
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status: status as any, ...(adminNotes && { adminNotes }) },
      include: { items: true, payment: true },
    });
  });
}

export async function updateTracking(orderId: string, shippingProvider: string, trackingNumber: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: { shippingProvider, trackingNumber, status: "SHIPPED" },
  });
}
