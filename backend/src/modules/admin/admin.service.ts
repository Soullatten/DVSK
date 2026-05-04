import { prisma } from "../../config/database.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";

export async function getDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalUsers,
    totalOrders,
    monthlyOrders,
    totalRevenue,
    monthlyRevenue,
    lastMonthRevenue,
    pendingOrders,
    topProducts,
    lowStockCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth }, status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { createdAt: { gte: startOfMonth }, status: { not: "CANCELLED" } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth }, status: { not: "CANCELLED" } }, _sum: { total: true } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    prisma.productVariant.count({ where: { stock: { lte: 5 }, product: { isActive: true } } }),
  ]);

  return {
    totalUsers,
    totalOrders,
    monthlyOrders,
    totalRevenue: Number(totalRevenue._sum.total || 0),
    monthlyRevenue: Number(monthlyRevenue._sum.total || 0),
    lastMonthRevenue: Number(lastMonthRevenue._sum.total || 0),
    pendingOrders,
    topProducts,
    lowStockCount,
  };
}

export async function listUsers(query: any) {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, phone: true, role: true, avatar: true, createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count(),
  ]);

  return { users, meta: paginationMeta(total, page, limit) };
}

export async function updateUserRole(userId: string, role: any) {
  return prisma.user.update({ where: { id: userId }, data: { role } });
}

export async function getLowStockItems() {
  return prisma.productVariant.findMany({
    where: { stock: { lte: 5 }, product: { isActive: true } },
    include: {
      product: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { stock: "asc" },
  });
}

export async function getRevenueReport(period: string) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "weekly":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "yearly":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: startDate }, status: { not: "CANCELLED" } },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return orders;
}

// Drafts: PENDING orders (paid but unfulfilled, OR awaiting payment)
export async function getDrafts() {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["PENDING", "CONFIRMED"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      payment: { select: { status: true } },
      items: { select: { id: true } },
    },
  });
  return orders.map((o) => ({
    id: o.orderNumber,
    rawId: o.id,
    createdAt: o.createdAt,
    customerName: o.user?.name || o.user?.email || o.user?.phone || "Guest",
    customerEmail: o.user?.email || null,
    status: o.payment?.status === "CAPTURED" || o.payment?.status === "AUTHORIZED"
      ? "Invoice sent"
      : "Open",
    total: Number(o.total || 0),
    itemCount: o.items.length,
  }));
}

// Segments: computed customer cohorts
export async function getSegments() {
  const now = Date.now();
  const day30Ago = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const day90Ago = new Date(now - 90 * 24 * 60 * 60 * 1000);

  const totalCustomers = await prisma.user.count({ where: { role: "CUSTOMER" } });

  const totalsByUser = await prisma.order.groupBy({
    by: ["userId"],
    where: { status: { not: "CANCELLED" } },
    _sum: { total: true },
    _count: { _all: true },
    _max: { createdAt: true },
  });

  const newSince30 = await prisma.user.count({
    where: { role: "CUSTOMER", createdAt: { gte: day30Ago } },
  });

  const highValue = totalsByUser.filter((t) => Number(t._sum.total || 0) >= 5000).length;
  const repeat = totalsByUser.filter((t) => (t._count?._all || 0) >= 2).length;
  const atRisk = totalsByUser.filter((t) => {
    const last = t._max.createdAt;
    return last && last < day30Ago && last > day90Ago;
  }).length;
  const oneTime = totalsByUser.filter((t) => (t._count?._all || 0) === 1).length;

  return [
    {
      id: "SEG-ALL",
      name: "All Customers",
      customerCount: totalCustomers,
      totalCustomers,
      logicRule: "All registered users",
      isSystem: true,
      lastActivity: "Live",
      createdBy: "System",
    },
    {
      id: "SEG-NEW",
      name: "New Customers (30d)",
      customerCount: newSince30,
      totalCustomers,
      logicRule: "Created in last 30 days",
      isSystem: true,
      lastActivity: "Live",
      createdBy: "System",
    },
    {
      id: "SEG-HIGH",
      name: "High-Value (₹5k+ spent)",
      customerCount: highValue,
      totalCustomers,
      logicRule: "Total Spent ≥ ₹5,000",
      isSystem: true,
      lastActivity: "Live",
      createdBy: "System",
    },
    {
      id: "SEG-REPEAT",
      name: "Repeat Buyers",
      customerCount: repeat,
      totalCustomers,
      logicRule: "Orders ≥ 2",
      isSystem: true,
      lastActivity: "Live",
      createdBy: "System",
    },
    {
      id: "SEG-RISK",
      name: "At-Risk (no order 30-90d)",
      customerCount: atRisk,
      totalCustomers,
      logicRule: "Last order between 30-90 days ago",
      isSystem: true,
      lastActivity: "Live",
      createdBy: "System",
    },
    {
      id: "SEG-ONETIME",
      name: "One-time Buyers",
      customerCount: oneTime,
      totalCustomers,
      logicRule: "Orders = 1",
      isSystem: true,
      lastActivity: "Live",
      createdBy: "System",
    },
  ];
}

// Reports: preset aggregations
export async function getReports() {
  const now = new Date();
  const start30 = new Date(now);
  start30.setDate(start30.getDate() - 29);
  start30.setHours(0, 0, 0, 0);

  const [orderCount30, revenueAgg30, topProducts, lowStock] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: start30 }, status: { not: "CANCELLED" } },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: start30 }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      where: { order: { status: { not: "CANCELLED" }, createdAt: { gte: start30 } } },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    prisma.productVariant.count({
      where: { stock: { lte: 5 }, product: { isActive: true } },
    }),
  ]);

  const totalRevenue30 = Number(revenueAgg30._sum.total || 0);

  return [
    {
      id: "RPT-SALES-30",
      name: "Sales · Last 30 days",
      category: "Orders",
      value: `₹${totalRevenue30.toLocaleString("en-IN")}`,
      sub: `${orderCount30} orders`,
      lastViewed: now.toISOString(),
      views: 0,
    },
    {
      id: "RPT-AOV-30",
      name: "Average Order Value · 30d",
      category: "Orders",
      value: orderCount30 > 0 ? `₹${Math.round(totalRevenue30 / orderCount30).toLocaleString("en-IN")}` : "₹0",
      sub: `${orderCount30} orders`,
      lastViewed: now.toISOString(),
      views: 0,
    },
    {
      id: "RPT-TOP",
      name: "Top Products · 30d",
      category: "Behavior",
      value: topProducts[0]?.productName || "—",
      sub: topProducts.length
        ? topProducts.slice(0, 3).map((p) => p.productName).join(", ")
        : "No sales yet",
      lastViewed: now.toISOString(),
      views: 0,
    },
    {
      id: "RPT-LOWSTOCK",
      name: "Low Stock Variants",
      category: "Finances",
      value: String(lowStock),
      sub: "≤ 5 units remaining",
      lastViewed: now.toISOString(),
      views: 0,
    },
  ];
}

// Coupons
export async function createCoupon(data: any) {
  return prisma.coupon.create({
    data: {
      ...data,
      validFrom: new Date(data.validFrom),
      validUntil: new Date(data.validUntil),
    },
  });
}

export async function listCoupons() {
  return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
}

export async function updateCoupon(id: string, data: any) {
  const updateData: any = { ...data };
  if (data.validFrom) updateData.validFrom = new Date(data.validFrom);
  if (data.validUntil) updateData.validUntil = new Date(data.validUntil);
  return prisma.coupon.update({ where: { id }, data: updateData });
}

export async function deleteCoupon(id: string) {
  return prisma.coupon.update({ where: { id }, data: { isActive: false } });
}
