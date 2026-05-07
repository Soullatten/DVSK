import { prisma } from "../../config/database.js";
import { LiveEvents } from "../../realtime/events.js";

// ─── Tool definitions exposed to the LLM ──────────────────────────────────────
export const NAVYA_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_revenue_summary",
      description: "Returns total revenue, total orders, and pending orders for a given period.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["Today", "Last 7 days", "Last 30 days", "All time"],
            description: "Time window to aggregate over.",
          },
        },
        required: ["period"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent_orders",
      description: "Returns the most recent N orders with customer email, total, and status.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max orders to return (default 10)." },
          status: {
            type: "string",
            enum: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
            description: "Filter to only this status (optional).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_top_products",
      description: "Top selling products by units sold over the last 30 days.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max products to return (default 5)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_low_stock",
      description: "Product variants where stock is at or below a threshold.",
      parameters: {
        type: "object",
        properties: {
          threshold: { type: "number", description: "Stock threshold (default 5)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_product_by_name",
      description: "Search for a product by partial name match. Returns id, name, slug, basePrice, total stock.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term (partial name)." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_customers",
      description: "List customers with their order counts and total spent. Optionally filter to high-value or new customers.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max customers (default 20)." },
          minSpent: { type: "number", description: "Only return customers who have spent at least this much." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_active_visitors",
      description: "Visitors currently on the storefront (live shoppers right now). Returns count only.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "update_product_price",
      description:
        "Change a product's base price (and/or sale price). Use this when Krishiv asks to reprice an item. Requires explicit confirmation in the conversation.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string", description: "The product's cuid id." },
          basePrice: { type: "number", description: "New base price in INR." },
          salePrice: {
            type: "number",
            description: "New sale price (optional). Pass 0 to clear the existing sale price.",
          },
        },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_variant_stock",
      description:
        "Set the stock quantity on a specific variant (size/color combination). Use this for manual inventory corrections.",
      parameters: {
        type: "object",
        properties: {
          variantId: { type: "string" },
          stock: { type: "number" },
        },
        required: ["variantId", "stock"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_order_status",
      description: "Move an order to a new status (e.g. mark as PROCESSING, SHIPPED, DELIVERED, CANCELLED).",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string" },
          status: {
            type: "string",
            enum: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"],
          },
        },
        required: ["orderId", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_order_email",
      description:
        "Send a templated email to the customer of a specific order. Use templateKey 'order-confirmation' for order receipts, 'order-tracking' for shipping notifications, or 'new-drop' for marketing. Variables auto-fill from the order's live data; pass subjectOverride or extraVariables only if the user explicitly asked for custom wording.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "The order's cuid id OR its order number (e.g. DVSK-1024)." },
          templateKey: { type: "string", enum: ["order-confirmation", "order-tracking", "new-drop"] },
          subjectOverride: { type: "string", description: "Optional custom subject. Supports {{orderNumber}} etc." },
          extraVariables: {
            type: "object",
            description:
              "Optional overrides merged on top of the auto-resolved order variables (e.g. trackingNumber, courier).",
          },
        },
        required: ["orderId", "templateKey"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_discount_coupon",
      description: "Create a new discount coupon code that customers can apply at checkout.",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "Coupon code (uppercase, no spaces)." },
          discountType: { type: "string", enum: ["PERCENTAGE", "FLAT"] },
          discountValue: { type: "number", description: "Percentage (e.g. 10 for 10%) or flat ₹ amount." },
          maxUses: { type: "number", description: "Max times this coupon can be used (optional)." },
          validUntil: { type: "string", description: "ISO date when the coupon expires (optional)." },
        },
        required: ["code", "discountType", "discountValue"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_campaign",
      description: "Create a new marketing campaign that will appear on the admin Campaigns page.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          platform: {
            type: "string",
            description: "One of: Instagram Ads, Facebook Ads, TikTok Ads, Google Ads, YouTube Ads, Snapchat Ads, Pinterest Ads, LinkedIn Ads, Email, SMS",
          },
          status: { type: "string", enum: ["ACTIVE", "PAUSED", "DRAFT"] },
          spend: { type: "number", description: "Budget spent in ₹." },
          revenue: { type: "number", description: "Revenue attributed in ₹." },
          clicks: { type: "number" },
          conversions: { type: "number" },
        },
        required: ["name", "platform"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_gift_card",
      description: "Issue a new gift card. The code is auto-generated.",
      parameters: {
        type: "object",
        properties: {
          customerEmail: { type: "string" },
          customerName: { type: "string" },
          value: { type: "number", description: "Initial balance in ₹." },
          note: { type: "string", description: "Internal note (optional)." },
        },
        required: ["customerEmail", "value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_market",
      description: "Create a market (region / countries the store ships to).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          countries: {
            type: "array",
            items: { type: "string" },
            description: "Country names like ['India', 'UAE'].",
          },
          currency: { type: "string", description: "ISO currency code, default INR." },
        },
        required: ["name", "countries"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_catalog",
      description: "Create a new product catalog.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          region: { type: "string", description: "Region name, default Global." },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_company",
      description: "Add a Supplier or Sponsor partner to the Companies page.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string", description: "Free text: 'Fabric Manufacturer', 'Event Sponsor', etc." },
          category: { type: "string", enum: ["SUPPLIER", "SPONSOR"] },
          contact: { type: "string", description: "Email or phone (optional)." },
          location: { type: "string", description: "City, Country (optional)." },
          budgetTerms: { type: "string", description: "e.g. 'Net 30', '₹5,000 / event' (optional)." },
        },
        required: ["name", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_purchase_order",
      description: "Create an inbound purchase order for inventory restock.",
      parameters: {
        type: "object",
        properties: {
          supplier: { type: "string" },
          city: { type: "string" },
          country: { type: "string" },
          amount: { type: "number", description: "Total cost in ₹." },
          itemsLabel: { type: "string", description: "Free-text description e.g. '1000x Black Hoodies'." },
          eta: { type: "string", description: "ISO date string for expected arrival." },
        },
        required: ["supplier", "city", "country", "amount", "itemsLabel"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_product",
      description: "Create a new product. Will appear on Inventory and on the storefront menswear/womenswear/accessories page.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          basePrice: { type: "number", description: "Base price in ₹." },
          category: {
            type: "string",
            enum: ["men", "women", "accessories"],
            description: "Storefront category slug.",
          },
          sizes: {
            type: "array",
            items: { type: "string" },
            description: "Sizes to create variants for, e.g. ['S','M','L','XL']. Default ['M'].",
          },
          stock: { type: "number", description: "Initial stock per size variant." },
        },
        required: ["name", "basePrice", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_automation",
      description: "Create a marketing automation (workflow) skeleton.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["ACTIVE", "PAUSED", "DRAFT"] },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_resource",
      description: "Delete a resource by id. Use this when Krishiv asks to remove/cancel a campaign, gift card, market, catalog, company, automation, or purchase order.",
      parameters: {
        type: "object",
        properties: {
          resource: {
            type: "string",
            enum: ["campaign", "gift_card", "market", "catalog", "company", "automation", "purchase_order"],
          },
          id: { type: "string" },
        },
        required: ["resource", "id"],
      },
    },
  },
] as const;

// ─── Tool execution dispatcher ─────────────────────────────────────────────────
export async function executeNavyaTool(name: string, args: any): Promise<any> {
  switch (name) {
    case "get_revenue_summary": {
      const period = args?.period || "Last 30 days";
      const now = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      if (period === "Today") {
        // already today
      } else if (period === "Last 7 days") {
        start.setDate(start.getDate() - 6);
      } else if (period === "Last 30 days") {
        start.setDate(start.getDate() - 29);
      } else {
        start.setFullYear(2000); // "All time"
      }
      const where = { status: { not: "CANCELLED" as const }, createdAt: { gte: start } };
      const [count, agg, pending] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.aggregate({ where, _sum: { total: true } }),
        prisma.order.count({ where: { status: "PENDING", createdAt: { gte: start } } }),
      ]);
      return {
        period,
        totalOrders: count,
        totalRevenue: Number(agg._sum.total || 0),
        pendingOrders: pending,
      };
    }

    case "list_recent_orders": {
      const limit = Math.min(Math.max(Number(args?.limit) || 10, 1), 50);
      const where: any = {};
      if (args?.status) where.status = args.status;
      const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          user: { select: { name: true, email: true, phone: true } },
          payment: { select: { status: true } },
          address: { select: { city: true, state: true } },
        },
      });
      return orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.user?.name || o.user?.email || o.user?.phone || "Guest",
        city: o.address?.city || "",
        total: Number(o.total),
        status: o.status,
        paymentStatus: o.payment?.status || "PENDING",
        createdAt: o.createdAt,
      }));
    }

    case "list_top_products": {
      const limit = Math.min(Number(args?.limit) || 5, 20);
      const start = new Date();
      start.setDate(start.getDate() - 30);
      const top = await prisma.orderItem.groupBy({
        by: ["productName"],
        where: { order: { createdAt: { gte: start }, status: { not: "CANCELLED" } } },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: limit,
      });
      return top.map((t) => ({
        productName: t.productName,
        unitsSold: Number(t._sum.quantity || 0),
        revenue: Number(t._sum.totalPrice || 0),
      }));
    }

    case "list_low_stock": {
      const threshold = Math.max(Number(args?.threshold) || 5, 0);
      const variants = await prisma.productVariant.findMany({
        where: { stock: { lte: threshold }, product: { isActive: true } },
        include: { product: { select: { id: true, name: true, slug: true } } },
        orderBy: { stock: "asc" },
        take: 50,
      });
      return variants.map((v) => ({
        variantId: v.id,
        productId: v.product.id,
        productName: v.product.name,
        size: v.size,
        color: v.color,
        sku: v.sku,
        stock: v.stock,
      }));
    }

    case "find_product_by_name": {
      const q = String(args?.query || "").trim();
      if (!q) return [];
      const list = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { variants: { select: { stock: true } } },
        take: 10,
      });
      return list.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        basePrice: Number(p.basePrice),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
        totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
      }));
    }

    case "list_customers": {
      const limit = Math.min(Number(args?.limit) || 20, 100);
      const minSpent = Number(args?.minSpent) || 0;
      const customers = await prisma.user.findMany({
        where: { role: "CUSTOMER" },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { orders: true } },
          orders: { where: { status: { not: "CANCELLED" } }, select: { total: true } },
        },
      });
      const mapped = customers.map((u) => ({
        id: u.id,
        name: u.name || u.email || u.phone || "Guest",
        email: u.email,
        phone: u.phone,
        orderCount: u._count.orders,
        totalSpent: u.orders.reduce((sum, o) => sum + Number(o.total), 0),
      }));
      return mapped.filter((c) => c.totalSpent >= minSpent);
    }

    case "list_active_visitors": {
      const { getIO } = await import("../../realtime/socket.js");
      const io = getIO();
      const count = io ? io.of("/track").sockets.size : 0;
      return { count };
    }

    case "update_product_price": {
      const { productId, basePrice, salePrice } = args || {};
      if (!productId) throw new Error("productId is required");
      const update: any = {};
      if (typeof basePrice === "number" && basePrice > 0) update.basePrice = basePrice;
      if (typeof salePrice === "number") {
        update.salePrice = salePrice === 0 ? null : salePrice;
      }
      const product = await prisma.product.update({
        where: { id: productId },
        data: update,
        select: { id: true, name: true, basePrice: true, salePrice: true },
      });
      return {
        ok: true,
        product: {
          ...product,
          basePrice: Number(product.basePrice),
          salePrice: product.salePrice ? Number(product.salePrice) : null,
        },
      };
    }

    case "set_variant_stock": {
      const { variantId, stock } = args || {};
      if (!variantId) throw new Error("variantId is required");
      if (typeof stock !== "number" || stock < 0) throw new Error("stock must be a non-negative number");
      const variant = await prisma.productVariant.update({
        where: { id: variantId },
        data: { stock },
        select: { id: true, sku: true, size: true, color: true, stock: true },
      });
      return { ok: true, variant };
    }

    case "update_order_status": {
      const { orderId, status } = args || {};
      if (!orderId || !status) throw new Error("orderId and status are required");
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status },
        select: { id: true, orderNumber: true, status: true },
      });
      return { ok: true, order };
    }

    case "send_order_email": {
      const { orderId, templateKey, subjectOverride, extraVariables } = args || {};
      if (!orderId || !templateKey) throw new Error("orderId + templateKey required");
      const { sendEmail, buildOrderTemplateVars } = await import("../email/email.service.js");
      // Allow Navya to be passed either the cuid id or the order number ("DVSK-1024")
      const order = await prisma.order.findFirst({
        where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
        include: { user: true },
      });
      if (!order) return { ok: false, error: `Order not found: ${orderId}` };
      if (!order.user?.email) return { ok: false, error: "Order has no customer email on file" };

      const variables = await buildOrderTemplateVars(order.id, templateKey, extraVariables || {});
      const result = await sendEmail({
        templateKey,
        variables,
        toEmail: order.user.email,
        subjectOverride,
        orderId: order.id,
        userId: order.userId,
        triggeredBy: "navya",
      });
      return {
        ok: result.ok,
        status: result.status,
        emailLogId: result.emailLogId,
        sentTo: result.finalRecipient,
        wasTestRedirect: result.wasTestRedirect,
        wasMocked: result.wasMocked,
        error: result.errorMessage,
      };
    }

    case "create_discount_coupon": {
      const { code, discountType, discountValue, maxUses, validUntil } = args || {};
      if (!code || !discountType || typeof discountValue !== "number") {
        throw new Error("code, discountType, and discountValue are required");
      }
      const coupon = await prisma.coupon.create({
        data: {
          code: String(code).toUpperCase().replace(/\s+/g, ""),
          discountType,
          discountValue,
          usageLimit: maxUses ? Number(maxUses) : null,
          validFrom: new Date(),
          validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      });
      LiveEvents.dataChanged("discounts", "create", coupon.id);
      return { ok: true, coupon };
    }

    case "create_campaign": {
      const c = await prisma.campaign.create({
        data: {
          name: args.name,
          platform: args.platform || "Email",
          status: args.status || "DRAFT",
          spend: args.spend ?? 0,
          revenue: args.revenue ?? 0,
          clicks: args.clicks ?? 0,
          conversions: args.conversions ?? 0,
        },
      });
      LiveEvents.dataChanged("campaigns", "create", c.id);
      return { ok: true, campaign: c };
    }

    case "create_gift_card": {
      const { customerEmail, customerName, value, note } = args;
      if (!customerEmail || typeof value !== "number" || value <= 0) {
        throw new Error("customerEmail and a positive value are required");
      }
      const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
      let code = `DVSK-${part()}-${part()}-${part()}`;
      while (await prisma.giftCard.findUnique({ where: { code } })) {
        code = `DVSK-${part()}-${part()}-${part()}`;
      }
      const gc = await prisma.giftCard.create({
        data: {
          code,
          customerEmail,
          customerName: customerName ?? null,
          initialValue: value,
          currentBalance: value,
          note: note ?? null,
          status: "ACTIVE",
        },
      });
      LiveEvents.dataChanged("gift-cards", "create", gc.id);
      return { ok: true, giftCard: gc };
    }

    case "create_market": {
      const { name: mname, countries, currency } = args;
      if (!mname || !Array.isArray(countries)) throw new Error("name and countries are required");
      const m = await prisma.market.create({
        data: {
          name: mname,
          countries,
          currency: currency || "INR",
          status: "ACTIVE",
        },
      });
      LiveEvents.dataChanged("markets", "create", m.id);
      return { ok: true, market: m };
    }

    case "create_catalog": {
      const { name: cname, region } = args;
      if (!cname) throw new Error("name is required");
      const cat = await prisma.catalog.create({
        data: {
          name: cname,
          region: region || "Global",
          status: "ACTIVE",
        },
      });
      LiveEvents.dataChanged("catalogs", "create", cat.id);
      return { ok: true, catalog: cat };
    }

    case "create_company": {
      const { name: coname, type: cotype, category, contact, location, budgetTerms } = args;
      if (!coname || !category) throw new Error("name and category are required");
      const co = await prisma.company.create({
        data: {
          name: coname,
          type: cotype || "Other",
          category: category as any,
          contact: contact ?? null,
          location: location ?? null,
          budgetTerms: budgetTerms ?? null,
          status: "Pending",
        },
      });
      LiveEvents.dataChanged("companies", "create", co.id);
      return { ok: true, company: co };
    }

    case "create_purchase_order": {
      const { supplier, city, country, amount, itemsLabel, eta } = args;
      if (!supplier || !city || !country || typeof amount !== "number" || !itemsLabel) {
        throw new Error("supplier, city, country, amount, and itemsLabel are required");
      }
      const orderNumber = `PO-${Math.floor(1000 + Math.random() * 9000)}`;
      const po = await prisma.purchaseOrder.create({
        data: {
          orderNumber,
          supplier,
          city,
          country,
          amount,
          currency: "INR",
          itemsLabel,
          status: "PROCESSING",
          progress: 15,
          eta: eta ? new Date(eta) : null,
        },
      });
      LiveEvents.dataChanged("purchase-orders", "create", po.id);
      return { ok: true, purchaseOrder: po };
    }

    case "create_product": {
      const { name: pname, description, basePrice, category, sizes, stock } = args;
      if (!pname || !basePrice || !category) {
        throw new Error("name, basePrice, and category are required");
      }
      const slug = String(pname).toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-");
      const stamp = Math.random().toString(36).slice(2, 6);
      const finalSlug = `${slug}-${stamp}`;
      const slugLower = String(category).toLowerCase().trim();
      let cat = await prisma.category.findUnique({ where: { slug: slugLower } });
      if (!cat) {
        cat = await prisma.category.create({
          data: { slug: slugLower, name: slugLower.charAt(0).toUpperCase() + slugLower.slice(1) },
        });
      }
      const gender: "MEN" | "WOMEN" | "UNISEX" = slugLower === "women" ? "WOMEN" : slugLower === "men" ? "MEN" : "UNISEX";

      const sizeList: string[] = Array.isArray(sizes) && sizes.length > 0 ? sizes : ["M"];
      const stockPer = typeof stock === "number" ? stock : 0;

      const product = await prisma.product.create({
        data: {
          name: pname,
          slug: finalSlug,
          description: description || pname,
          basePrice,
          gender,
          tag: "CORE",
          isActive: true,
          category: { connect: { id: cat.id } },
          variants: {
            create: sizeList.map((sz: string) => ({
              size: sz,
              color: "Default",
              sku: `${finalSlug.toUpperCase().slice(0, 10)}-DEFAULT-${sz}`.replace(/\s+/g, "-"),
              stock: stockPer,
            })),
          },
        },
        include: { variants: true, category: true },
      });
      LiveEvents.dataChanged("products", "create", product.id);
      return { ok: true, product };
    }

    case "create_automation": {
      const { name: aname, description, status } = args;
      if (!aname) throw new Error("name is required");
      const automation = await prisma.automation.create({
        data: {
          name: aname,
          description: description ?? null,
          status: status || "DRAFT",
          trigger: "manual",
        },
      });
      LiveEvents.dataChanged("automations", "create", automation.id);
      return { ok: true, automation };
    }

    case "delete_resource": {
      const { resource, id } = args;
      if (!resource || !id) throw new Error("resource and id are required");
      let res: any;
      switch (resource) {
        case "campaign":
          res = await prisma.campaign.delete({ where: { id } });
          break;
        case "gift_card":
          res = await prisma.giftCard.update({ where: { id }, data: { status: "DISABLED" } });
          break;
        case "market":
          res = await prisma.market.delete({ where: { id } });
          break;
        case "catalog":
          res = await prisma.catalog.delete({ where: { id } });
          break;
        case "company":
          res = await prisma.company.delete({ where: { id } });
          break;
        case "automation":
          res = await prisma.automation.delete({ where: { id } });
          break;
        case "purchase_order":
          res = await prisma.purchaseOrder.delete({ where: { id } });
          break;
        default:
          throw new Error(`Unknown resource: ${resource}`);
      }
      const typeMap: Record<string, string> = {
        campaign: "campaigns",
        gift_card: "gift-cards",
        market: "markets",
        catalog: "catalogs",
        company: "companies",
        automation: "automations",
        purchase_order: "purchase-orders",
      };
      LiveEvents.dataChanged(typeMap[resource]!, "delete", id);
      return { ok: true, deleted: res };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
