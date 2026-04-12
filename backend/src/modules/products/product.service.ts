import { prisma } from "../../config/database.js";
import { slugify } from "../../utils/helpers.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import type { Prisma } from "@prisma/client";

export async function listProducts(query: any) {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const where: Prisma.ProductWhereInput = { isActive: true };

  if (query.category) {
    where.category = { slug: query.category };
  }
  if (query.tag) {
    where.tag = query.tag as any;
  }
  if (query.gender) {
    where.gender = query.gender as any;
  }
  if (query.minPrice || query.maxPrice) {
    where.basePrice = {};
    if (query.minPrice) where.basePrice.gte = parseFloat(query.minPrice);
    if (query.maxPrice) where.basePrice.lte = parseFloat(query.maxPrice);
  }
  if (query.size || query.color) {
    where.variants = {
      some: {
        ...(query.size && { size: query.size }),
        ...(query.color && { color: { contains: query.color, mode: "insensitive" } }),
        stock: { gt: 0 },
      },
    };
  }
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  switch (query.sort) {
    case "price_asc": orderBy = { basePrice: "asc" }; break;
    case "price_desc": orderBy = { basePrice: "desc" }; break;
    case "newest": orderBy = { createdAt: "desc" }; break;
    case "featured": orderBy = { isFeatured: "desc" }; break;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { position: "asc" }, take: 2 },
        variants: { select: { id: true, size: true, color: true, colorHex: true, stock: true, priceOverride: true } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, meta: paginationMeta(total, page, limit) };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { position: "asc" } },
      variants: true,
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  });
}

export async function getFeatured() {
  return prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      category: { select: { id: true, name: true, slug: true } },
    },
    take: 12,
  });
}

export async function getNewArrivals() {
  return prisma.product.findMany({
    where: { isActive: true, tag: "NEW_SEASON" },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      category: { select: { id: true, name: true, slug: true } },
    },
    take: 12,
  });
}

export async function createProduct(data: any) {
  const slug = slugify(data.name);
  const { images, variants, ...productData } = data;

  return prisma.product.create({
    data: {
      ...productData,
      slug,
      ...(images && { images: { create: images } }),
      ...(variants && { variants: { create: variants } }),
    },
    include: { images: true, variants: true, category: true },
  });
}

export async function updateProduct(id: string, data: any) {
  const { images, variants, ...productData } = data;
  if (productData.name) productData.slug = slugify(productData.name);

  return prisma.product.update({
    where: { id },
    data: productData,
    include: { images: true, variants: true, category: true },
  });
}

export async function deleteProduct(id: string) {
  return prisma.product.update({ where: { id }, data: { isActive: false } });
}

export async function addVariant(productId: string, data: any) {
  return prisma.productVariant.create({ data: { ...data, productId } });
}

export async function updateVariant(variantId: string, data: any) {
  return prisma.productVariant.update({ where: { id: variantId }, data });
}
