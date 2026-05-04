import { Router, type Request, type Response } from "express";
import { prisma } from "../../config/database.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import { success } from "../../utils/apiResponse.js";

const router = Router();

router.use(authenticate, requireAdmin);

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
];

const formatRelative = (date: Date | null | undefined) => {
  if (!date) return "Never";
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

router.get("/customers", async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true } },
      },
    });

    const totals = await prisma.order.groupBy({
      by: ["userId"],
      _sum: { total: true },
      where: { status: { not: "CANCELLED" } },
    });
    const totalsMap = new Map(totals.map((t) => [t.userId, Number(t._sum.total ?? 0)]));

    const customers = users.map((u, idx) => ({
      id: u.id,
      name: u.name || u.email || u.phone || "Anonymous",
      email: u.email ?? "",
      phone: u.phone ?? "",
      avatar: u.avatar,
      orders_count: u._count.orders,
      total_spent: totalsMap.get(u.id) ?? 0,
      isOnline: false,
      lastLogin: formatRelative(u.updatedAt),
      avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
      createdAt: u.createdAt,
    }));

    return success(res, customers);
  } catch (err: any) {
    console.error("/customers feed error:", err?.message || err);
    return success(res, []);
  }
});

router.get("/discounts", async (_req: Request, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    const now = new Date();

    const discounts = coupons.map((c) => {
      const validFrom = c.validFrom ?? null;
      const validUntil = c.validUntil ?? null;
      let status: "Active" | "Scheduled" | "Expired" = "Active";
      if (!c.isActive) status = "Expired";
      else if (validFrom && now < validFrom) status = "Scheduled";
      else if (validUntil && now > validUntil) status = "Expired";

      const type: "Percentage" | "Fixed Amount" =
        c.discountType === "PERCENTAGE" ? "Percentage" : "Fixed Amount";

      const value =
        type === "Percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`;

      return {
        id: c.id,
        code: c.code,
        type,
        value,
        status,
        used: c.usedCount ?? 0,
        startDate: validFrom
          ? new Date(validFrom).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "—",
      };
    });

    return success(res, discounts);
  } catch (err: any) {
    console.error("/discounts feed error:", err?.message || err);
    return success(res, []);
  }
});

router.get("/collections", async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
    const collections = categories.map((c) => ({
      id: c.id,
      title: c.name,
      slug: c.slug,
      products_count: c._count.products,
      updated_at: c.updatedAt ?? c.createdAt,
    }));
    return success(res, collections);
  } catch (err: any) {
    console.error("/collections feed error:", err?.message || err);
    return success(res, []);
  }
});

router.get("/inventory", async (_req: Request, res: Response) => {
  try {
    const variants = await prisma.productVariant.findMany({
      where: { product: { isActive: true } },
      include: { product: { select: { id: true, name: true, slug: true } } },
      orderBy: { stock: "asc" },
      take: 200,
    });
    const items = variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      productId: v.productId,
      productName: v.product?.name ?? "",
      slug: v.product?.slug ?? "",
      size: v.size,
      color: v.color,
      stock: v.stock,
      reservedStock: v.reservedStock,
      lowStockAlert: v.lowStockAlert,
    }));
    return success(res, items);
  } catch (err: any) {
    console.error("/inventory feed error:", err?.message || err);
    return success(res, []);
  }
});

const STUB_PATHS = [
  "/giftcards",
  "/transfers",
  "/drafts",
  "/segments",
  "/companies",
  "/markets",
  "/catalogs",
  "/attribution",
  "/automations",
  "/campaigns",
  "/abandonedcheckouts",
  "/purchaseorders",
];

for (const path of STUB_PATHS) {
  router.get(path, (_req, res) => success(res, []));
}

export default router;
