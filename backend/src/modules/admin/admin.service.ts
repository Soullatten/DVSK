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
