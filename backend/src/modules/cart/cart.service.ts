import { prisma } from "../../config/database.js";

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
}

export async function getCart(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, basePrice: true, salePrice: true, isActive: true },
          },
          variant: {
            select: { id: true, size: true, color: true, colorHex: true, stock: true, priceOverride: true, sku: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart) return { items: [], total: 0, itemCount: 0 };

  const items = cart.items.map((item) => {
    const price = item.variant.priceOverride || item.product.salePrice || item.product.basePrice;
    return {
      ...item,
      unitPrice: price,
      totalPrice: Number(price) * item.quantity,
    };
  });

  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, total, itemCount };
}

export async function addItem(userId: string, data: { productId: string; variantId: string; quantity: number }) {
  const cart = await getOrCreateCart(userId);

  // Check stock
  const variant = await prisma.productVariant.findUnique({ where: { id: data.variantId } });
  if (!variant || variant.stock < data.quantity) {
    throw new Error("Insufficient stock");
  }

  // Upsert cart item
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId: data.variantId } },
  });

  if (existing) {
    const newQty = existing.quantity + data.quantity;
    if (newQty > variant.stock) throw new Error("Insufficient stock");
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: data.productId,
        variantId: data.variantId,
        quantity: data.quantity,
      },
    });
  }

  return getCart(userId);
}

export async function updateItem(userId: string, itemId: string, quantity: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new Error("Cart not found");

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    include: { variant: true },
  });
  if (!item) throw new Error("Item not found in cart");
  if (quantity > item.variant.stock) throw new Error("Insufficient stock");

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  return getCart(userId);
}

export async function removeItem(userId: string, itemId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new Error("Cart not found");

  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  return getCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  return { items: [], total: 0, itemCount: 0 };
}

export async function applyCoupon(code: string, cartTotal: number) {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) throw new Error("Invalid coupon code");
  if (!coupon.isActive) throw new Error("Coupon is no longer active");

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) throw new Error("Coupon has expired");
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new Error("Coupon usage limit reached");
  if (coupon.minOrderValue && cartTotal < Number(coupon.minOrderValue)) {
    throw new Error(`Minimum order value is ₹${coupon.minOrderValue}`);
  }

  let discount: number;
  if (coupon.discountType === "PERCENTAGE") {
    discount = cartTotal * (Number(coupon.discountValue) / 100);
    if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
  } else {
    discount = Number(coupon.discountValue);
  }

  return { discount: Math.round(discount * 100) / 100, coupon };
}
