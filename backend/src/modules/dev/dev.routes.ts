import { Router, type Request, type Response } from "express";
import { prisma } from "../../config/database.js";
import { env } from "../../env.js";
import { LiveEvents } from "../../realtime/events.js";
import { success, badRequest, forbidden } from "../../utils/apiResponse.js";

const router = Router();

// Block all dev routes in production
router.use((_req, res, next) => {
  if (env.NODE_ENV === "production") {
    return forbidden(res, "Dev routes are disabled in production");
  }
  next();
});

function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `BOT-${y}${m}${d}-${rand}`;
}

interface SeedOrderBody {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  city: string;
  state: string;
  pincode?: string;
  country?: string;
  addressLine1?: string;
  items?: Array<{
    productId?: string;
    variantId?: string;
    quantity?: number;
  }>;
  total?: number;
}

router.post("/seed-order", async (req: Request, res: Response) => {
  try {
    const body = req.body as SeedOrderBody;
    if (!body?.customerEmail || !body?.city || !body?.state) {
      return badRequest(res, "customerEmail, city, and state are required");
    }

    // Synthesize a "BOT" user (firebaseUid prefixed so it's clearly fake)
    const botUid = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const user = await prisma.user.create({
      data: {
        firebaseUid: botUid,
        email: body.customerEmail,
        phone: body.customerPhone ?? null,
        name: body.customerName || body.customerEmail.split("@")[0],
        role: "CUSTOMER",
      },
    });

    // Create address
    const address = await prisma.address.create({
      data: {
        userId: user.id,
        label: "Bot",
        fullName: body.customerName || body.customerEmail,
        phone: body.customerPhone || "+919999999999",
        addressLine1: body.addressLine1 || "Test Street 1",
        city: body.city,
        state: body.state,
        pincode: body.pincode || "400001",
        country: body.country || "India",
      },
    });

    // Pick line items: use provided variantIds, or auto-pick a random in-stock variant
    let lineItems = (body.items || []).filter((i) => i.variantId && i.quantity);
    if (lineItems.length === 0) {
      const anyVariant = await prisma.productVariant.findFirst({
        where: { stock: { gt: 0 }, product: { isActive: true } },
        include: { product: true },
        orderBy: { createdAt: "desc" },
      });
      if (anyVariant) {
        lineItems = [{ variantId: anyVariant.id, quantity: 1 }];
      }
    }

    if (lineItems.length === 0) {
      // Fallback: synthesize a single-line order without touching real variants
      const total = body.total ?? Math.floor(Math.random() * 4000) + 500;
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: user.id,
          addressId: address.id,
          subtotal: total,
          shippingCost: 0,
          discount: 0,
          tax: 0,
          total,
          status: "CONFIRMED",
          notes: "[BOT] synthetic order — no products in DB",
        },
        include: { items: true, address: true },
      });
      LiveEvents.orderPlaced({
        orderNumber: order.orderNumber,
        city: address.city,
        state: address.state,
        country: address.country,
        total: Number(order.total),
      }).catch(() => {});
      return success(res, order);
    }

    // Build real order from variants
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: lineItems.map((i) => i.variantId!) } },
      include: { product: { include: { images: { take: 1, orderBy: { position: "asc" } } } } },
    });

    let subtotal = 0;
    const orderItemsData: any[] = [];
    for (const li of lineItems) {
      const variant = variants.find((v) => v.id === li.variantId);
      if (!variant) continue;
      const qty = li.quantity || 1;
      const unitPrice = Number(variant.priceOverride ?? variant.product.salePrice ?? variant.product.basePrice);
      const totalPrice = unitPrice * qty;
      subtotal += totalPrice;
      orderItemsData.push({
        productId: variant.productId,
        variantId: variant.id,
        quantity: qty,
        unitPrice,
        totalPrice,
        productName: variant.product.name,
        size: variant.size,
        color: variant.color,
        image: variant.product.images[0]?.url ?? null,
      });
    }

    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.id,
        addressId: address.id,
        subtotal,
        shippingCost: 0,
        discount: 0,
        tax,
        total,
        status: "CONFIRMED",
        notes: "[BOT] simulated order",
        items: { create: orderItemsData },
      },
      include: { items: true, address: true, user: { select: { name: true, email: true } } },
    });

    // Fire the same live event a real customer order would
    LiveEvents.orderPlaced({
      orderNumber: order.orderNumber,
      city: address.city,
      state: address.state,
      country: address.country,
      total: Number(order.total),
    }).catch(() => {});

    return success(res, order, "Bot order placed");
  } catch (err: any) {
    console.error("[dev/seed-order]", err);
    return badRequest(res, err?.message || "Failed to seed order");
  }
});

router.post("/wipe-all", async (req: Request, res: Response) => {
  // Hard guardrail: require explicit confirmation phrase
  if (req.body?.confirm !== "WIPE_DVSK_DATA") {
    return badRequest(
      res,
      "Add { \"confirm\": \"WIPE_DVSK_DATA\" } to the request body to confirm. This deletes ALL orders, products, customers, marketing rows, etc."
    );
  }

  const counts: Record<string, number> = {};

  try {
    // Order of deletes matters because of FK constraints — children before parents.
    // Cart items + carts
    counts.cartItems = (await prisma.cartItem.deleteMany({})).count;
    counts.carts = (await prisma.cart.deleteMany({})).count;

    // Order items + payments + orders + wishlist items + wishlists
    counts.wishlistItems = (await prisma.wishlistItem.deleteMany({})).count;
    counts.wishlists = (await prisma.wishlist.deleteMany({})).count;
    counts.payments = (await prisma.payment.deleteMany({})).count;
    counts.orderItems = (await prisma.orderItem.deleteMany({})).count;
    counts.orders = (await prisma.order.deleteMany({})).count;

    // Reviews
    counts.reviews = (await prisma.review.deleteMany({})).count;

    // Products: PurchaseOrderItem references variant; also ProductImage + ProductVariant cascade from product
    counts.purchaseOrderItems = (await prisma.purchaseOrderItem.deleteMany({})).count;
    counts.purchaseOrders = (await prisma.purchaseOrder.deleteMany({})).count;
    counts.productVariants = (await prisma.productVariant.deleteMany({})).count;
    counts.productImages = (await prisma.productImage.deleteMany({})).count;
    counts.products = (await prisma.product.deleteMany({})).count;

    // Categories — wipe so user starts truly fresh; createProduct auto-recreates them on demand
    counts.categories = (await prisma.category.deleteMany({})).count;

    // Marketing & growth tables
    counts.coupons = (await prisma.coupon.deleteMany({})).count;
    counts.campaigns = (await prisma.campaign.deleteMany({})).count;
    counts.automations = (await prisma.automation.deleteMany({})).count;
    counts.giftCards = (await prisma.giftCard.deleteMany({})).count;
    counts.markets = (await prisma.market.deleteMany({})).count;
    counts.catalogs = (await prisma.catalog.deleteMany({})).count;
    counts.companies = (await prisma.company.deleteMany({})).count;

    // Customer users + their addresses (keep ADMIN / SUPER_ADMIN accounts intact)
    const customerUsers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true },
    });
    const customerIds = customerUsers.map((u) => u.id);
    if (customerIds.length > 0) {
      counts.addresses = (await prisma.address.deleteMany({
        where: { userId: { in: customerIds } },
      })).count;
      counts.customers = (await prisma.user.deleteMany({
        where: { id: { in: customerIds } },
      })).count;
    } else {
      counts.addresses = 0;
      counts.customers = 0;
    }

    // Wipe locally-stored uploaded images
    try {
      const fs = await import("fs");
      const path = await import("path");
      const dir = path.resolve(process.cwd(), "uploads");
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        let removed = 0;
        for (const f of files) {
          if (f === ".gitkeep") continue;
          try {
            fs.unlinkSync(path.join(dir, f));
            removed += 1;
          } catch {}
        }
        counts.uploadedFiles = removed;
      } else {
        counts.uploadedFiles = 0;
      }
    } catch (err) {
      console.warn("[wipe-all] uploads cleanup failed:", err);
    }

    return success(res, { counts, message: "Database wiped. Admin accounts preserved." });
  } catch (err: any) {
    console.error("[wipe-all]", err);
    return badRequest(res, `Wipe failed at step: ${err?.message || "unknown"}. Partial counts: ${JSON.stringify(counts)}`);
  }
});

router.delete("/cleanup-bots", async (_req: Request, res: Response) => {
  try {
    const botUsers = await prisma.user.findMany({
      where: { firebaseUid: { startsWith: "bot_" } },
      select: { id: true },
    });
    const userIds = botUsers.map((u) => u.id);
    if (userIds.length === 0) return success(res, { deletedUsers: 0, deletedOrders: 0 });

    const orders = await prisma.order.deleteMany({ where: { userId: { in: userIds } } });
    const addresses = await prisma.address.deleteMany({ where: { userId: { in: userIds } } });
    const users = await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    return success(res, {
      deletedUsers: users.count,
      deletedOrders: orders.count,
      deletedAddresses: addresses.count,
    });
  } catch (err: any) {
    return badRequest(res, err?.message || "Cleanup failed");
  }
});

export default router;
