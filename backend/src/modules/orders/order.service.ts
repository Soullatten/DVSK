import { prisma } from "../../config/database.js";
import { generateOrderNumber } from "../../utils/helpers.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import { clearCart, applyCoupon } from "../cart/cart.service.js";
import { geocodeCityAsync, LiveEvents } from "../../realtime/events.js";
import type { Prisma } from "@prisma/client";

const FREE_SHIPPING_THRESHOLD = 2500;
const SHIPPING_COST = 149;
const STORE_STATE = "Maharashtra"; // origin state for GST splitting

// Tax based on customer location:
//  - International (non-India) → 0% (export, no GST)
//  - Same state as store origin → CGST + SGST (9% + 9% = 18%)
//  - Different state in India → IGST (18%)
function computeTax(taxableAmount: number, country: string, state: string) {
  const c = (country || "India").trim().toLowerCase();
  if (c !== "india") {
    return { rate: 0, amount: 0, breakdown: { cgst: 0, sgst: 0, igst: 0 } };
  }
  const sameState = state.trim().toLowerCase() === STORE_STATE.trim().toLowerCase();
  const total = Math.round(taxableAmount * 0.18 * 100) / 100;
  if (sameState) {
    const half = Math.round((total / 2) * 100) / 100;
    return { rate: 0.18, amount: total, breakdown: { cgst: half, sgst: total - half, igst: 0 } };
  }
  return { rate: 0.18, amount: total, breakdown: { cgst: 0, sgst: 0, igst: total } };
}

interface InlineShippingAddress {
  fullName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

export async function createOrder(
  userId: string,
  data: {
    addressId?: string;
    shippingAddress?: InlineShippingAddress;
    couponCode?: string;
    notes?: string;
  }
) {
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

    // Resolve address: use existing addressId, OR create one from inline shippingAddress
    let address = data.addressId
      ? await tx.address.findFirst({ where: { id: data.addressId, userId } })
      : null;

    if (!address && data.shippingAddress) {
      address = await tx.address.create({
        data: {
          userId,
          label: "Checkout",
          fullName: data.shippingAddress.fullName,
          phone: data.shippingAddress.phone,
          addressLine1: data.shippingAddress.addressLine1,
          addressLine2: data.shippingAddress.addressLine2 ?? null,
          city: data.shippingAddress.city,
          state: data.shippingAddress.state,
          pincode: data.shippingAddress.pincode,
          country: data.shippingAddress.country || "India",
        },
      });
    }

    if (!address) throw new Error("Shipping address is required");

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
    const taxResult = computeTax(taxableAmount, address.country || "India", address.state || "");
    const tax = taxResult.amount;
    const total = Math.round((taxableAmount + shippingCost + tax) * 100) / 100;

    // Create order
    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        addressId: address.id,
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
        user: { select: { id: true, name: true, email: true, phone: true } },
        address: true,
        items: true,
        payment: { select: { status: true, method: true, amount: true, currency: true, createdAt: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, meta: paginationMeta(total, page, limit) };
}

export async function getOrderByIdAdmin(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      address: true,
      items: true,
      payment: true,
    },
  });
}

export async function updateOrderStatus(orderId: string, status: string, adminNotes?: string) {
  const updated = await prisma.$transaction(async (tx) => {
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

  // Push real-time event so the customer's order tracking page (and admin
  // dashboards) update without a manual refresh. Done AFTER the transaction
  // commits so subscribers querying for the new state see it.
  LiveEvents.orderStatusUpdated({
    orderId: updated.id,
    orderNumber: updated.orderNumber,
    userId: updated.userId,
    status: updated.status as string,
    adminNotes: updated.adminNotes,
  });

  return updated;
}

export async function updateTracking(orderId: string, shippingProvider: string, trackingNumber: string) {
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { shippingProvider, trackingNumber, status: "SHIPPED" },
  });

  // Notify subscribers — status changed (→ SHIPPED) AND new tracking info
  // is available, so fire both events.
  LiveEvents.orderTrackingUpdated({
    orderId: updated.id,
    orderNumber: updated.orderNumber,
    userId: updated.userId,
    shippingProvider,
    trackingNumber,
  });
  LiveEvents.orderStatusUpdated({
    orderId: updated.id,
    orderNumber: updated.orderNumber,
    userId: updated.userId,
    status: updated.status as string,
    adminNotes: updated.adminNotes,
  });

  return updated;
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

/**
 * Returns recent orders pre-enriched with lat/lng + display formatting,
 * ready to be consumed by the admin LiveView (so the map markers and side
 * panel survive a page refresh).
 */
export async function getLiveFeedOrders(opts: {
  period?: "Today" | "Last 7 days" | "Last 30 days";
  limit?: number;
} = {}) {
  const { period = "Today", limit = 20 } = opts;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === "Last 7 days") start.setDate(start.getDate() - 6);
  else if (period === "Last 30 days") start.setDate(start.getDate() - 29);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start },
      status: { not: "CANCELLED" },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { address: { select: { city: true, state: true, country: true } } },
  });

  const enriched = await Promise.all(
    orders.map(async (o) => {
      const coords = await geocodeCityAsync(
        o.address?.city ?? null,
        o.address?.state ?? null,
        o.address?.country ?? null
      );
      const totalNum = Number(o.total);
      return {
        id: o.orderNumber,
        city: o.address?.city || "Unknown",
        amount: `₹${Math.round(totalNum).toLocaleString("en-IN")}`,
        time: formatRelativeTime(new Date(o.createdAt)),
        lat: coords.lat,
        lng: coords.lng,
        ts: new Date(o.createdAt).getTime(),
        createdAt: o.createdAt,
      };
    })
  );

  return enriched;
}

export async function getOrderStats(period: "Today" | "Last 7 days" | "Last 30 days" | "Last 90 days" = "Last 30 days") {
  const now = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (period === "Today") {
    // already today
  } else if (period === "Last 7 days") {
    start.setDate(start.getDate() - 6);
  } else if (period === "Last 90 days") {
    start.setDate(start.getDate() - 89);
  } else {
    start.setDate(start.getDate() - 29);
  }

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start },
      status: { not: "CANCELLED" },
    },
    select: {
      total: true,
      subtotal: true,
      discount: true,
      shippingCost: true,
      tax: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const dailyMap = new Map<string, { count: number; revenue: number }>();
  let totalOrders = 0;
  let totalRevenue = 0;
  let totalSubtotal = 0;
  let totalDiscount = 0;
  let totalShipping = 0;
  let totalTax = 0;

  // Pre-fill every day in range so sparkline has continuous data
  const cursor = new Date(start);
  while (cursor <= now) {
    const key = cursor.toISOString().slice(0, 10);
    dailyMap.set(key, { count: 0, revenue: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const o of orders) {
    const key = new Date(o.createdAt).toISOString().slice(0, 10);
    const bucket = dailyMap.get(key) || { count: 0, revenue: 0 };
    const amount = Number(o.total || 0);
    bucket.count += 1;
    bucket.revenue += amount;
    dailyMap.set(key, bucket);
    totalOrders += 1;
    totalRevenue += amount;
    totalSubtotal += Number(o.subtotal || 0);
    totalDiscount += Number(o.discount || 0);
    totalShipping += Number(o.shippingCost || 0);
    totalTax += Number(o.tax || 0);
  }

  const daily = Array.from(dailyMap.entries())
    .map(([date, v]) => ({ date, count: v.count, revenue: v.revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    period,
    totalOrders,
    totalRevenue,
    totalSubtotal,
    totalDiscount,
    totalShipping,
    totalTax,
    netSales: totalSubtotal - totalDiscount,
    daily,
    activeDays: daily.filter((d) => d.count > 0).length,
  };
}
