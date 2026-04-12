import { prisma } from "../../config/database.js";

async function getOrCreateWishlist(userId: string) {
  let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({ data: { userId } });
  }
  return wishlist;
}

export async function getWishlist(userId: string) {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true, name: true, slug: true, basePrice: true, salePrice: true,
              images: { take: 1, orderBy: { position: "asc" } },
              tag: true, isActive: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return wishlist?.items || [];
}

export async function addToWishlist(userId: string, productId: string) {
  const wishlist = await getOrCreateWishlist(userId);

  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
  });
  if (existing) return existing;

  return prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, productId },
  });
}

export async function removeFromWishlist(userId: string, productId: string) {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) return null;

  return prisma.wishlistItem.deleteMany({
    where: { wishlistId: wishlist.id, productId },
  });
}
