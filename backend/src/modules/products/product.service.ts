import { prisma } from "../../config/database.js";
import { slugify } from "../../utils/helpers.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import type { Prisma } from "@prisma/client";

export async function listProducts(query: any) {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const where: Prisma.ProductWhereInput = { isActive: true };

  if (query.category) where.category = { slug: query.category };
  if (query.tag) where.tag = query.tag as any;
  if (query.gender) where.gender = query.gender as any;
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

function inferGenderFromSlug(slug: string): "MEN" | "WOMEN" | "UNISEX" {
  const s = slug.toLowerCase();
  if (s.startsWith("women")) return "WOMEN";
  if (s.startsWith("men")) return "MEN";
  return "UNISEX";
}

async function resolveCategory(opts: {
  categoryId?: string;
  categorySlug?: string;
  category?: string;
  gender?: "MEN" | "WOMEN" | "UNISEX";
}) {
  if (opts.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: opts.categoryId } });
    if (cat) return { categoryId: cat.id, gender: opts.gender ?? inferGenderFromSlug(cat.slug) };
  }

  const slug = (opts.categorySlug || opts.category || "").toLowerCase().trim();
  if (!slug) throw new Error("category is required");

  let cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) {
    const niceName = slug.charAt(0).toUpperCase() + slug.slice(1);
    cat = await prisma.category.create({ data: { slug, name: niceName } });
  }
  return { categoryId: cat.id, gender: opts.gender ?? inferGenderFromSlug(slug) };
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

function uniqueSlug(base: string): string {
  const stamp = Math.random().toString(36).slice(2, 6);
  return `${base}-${stamp}`;
}

export async function createProduct(data: any) {
  const name = data.name || data.title;
  if (!name) throw new Error("name (or title) is required");

  const description = data.description || "";
  const basePrice = toNumber(data.basePrice ?? data.price);
  if (basePrice <= 0) throw new Error("basePrice (or price) must be greater than 0");

  const { categoryId, gender } = await resolveCategory({
    categoryId: data.categoryId,
    categorySlug: data.categorySlug,
    category: data.category,
    gender: data.gender,
  });

  let baseSlug = data.slug ? slugify(data.slug) : slugify(name);
  let slug = baseSlug;
  if (await prisma.product.findUnique({ where: { slug } })) {
    slug = uniqueSlug(baseSlug);
  }

  const productData: Prisma.ProductCreateInput = {
    name,
    slug,
    description,
    basePrice,
    ...(data.salePrice !== undefined && { salePrice: toNumber(data.salePrice) }),
    ...(data.shortDesc && { shortDesc: data.shortDesc }),
    tag: data.tag ?? "CORE",
    gender,
    isActive: data.isActive ?? true,
    isFeatured: data.isFeatured ?? false,
    category: { connect: { id: categoryId } },
    ...(Array.isArray(data.images) && data.images.length > 0 && {
      images: {
        create: data.images.map((img: any, i: number) => ({
          url: img.url,
          alt: img.alt,
          position: img.position ?? i,
        })),
      },
    }),
    ...(Array.isArray(data.variants) && data.variants.length > 0 && {
      variants: {
        create: data.variants.map((v: any) => ({
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          sku: v.sku || `${slug.toUpperCase().slice(0, 8)}-${v.size}-${v.color}`.toUpperCase(),
          stock: toNumber(v.stock),
          ...(v.priceOverride !== undefined && { priceOverride: toNumber(v.priceOverride) }),
        })),
      },
    }),
  };

  return prisma.product.create({
    data: productData,
    include: { images: true, variants: true, category: true },
  });
}

export async function updateProduct(id: string, data: any) {
  const update: Prisma.ProductUpdateInput = {};

  const name = data.name || data.title;
  if (name) {
    update.name = name;
    update.slug = slugify(name);
  }
  if (data.description) update.description = data.description;
  if (data.shortDesc !== undefined) update.shortDesc = data.shortDesc;
  if (data.basePrice !== undefined || data.price !== undefined) {
    update.basePrice = toNumber(data.basePrice ?? data.price);
  }
  if (data.salePrice !== undefined) update.salePrice = toNumber(data.salePrice);
  if (data.tag) update.tag = data.tag;
  if (data.gender) update.gender = data.gender;
  if (data.isActive !== undefined) update.isActive = data.isActive;
  if (data.isFeatured !== undefined) update.isFeatured = data.isFeatured;

  if (data.categoryId || data.categorySlug || data.category) {
    const { categoryId } = await resolveCategory({
      categoryId: data.categoryId,
      categorySlug: data.categorySlug,
      category: data.category,
      gender: data.gender,
    });
    update.category = { connect: { id: categoryId } };
  }

  return prisma.product.update({
    where: { id },
    data: update,
    include: { images: true, variants: true, category: true },
  });
}

export async function deleteProduct(id: string) {
  return prisma.product.update({ where: { id }, data: { isActive: false } });
}

export async function addVariant(productId: string, data: any) {
  // Batch mode: { sizes: ["S","M","L"], color, stock, ... }
  if (Array.isArray(data.sizes) && data.sizes.length > 0) {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
    const baseSku = (product?.slug || productId.slice(0, 8)).toUpperCase();
    const created = [];
    for (const size of data.sizes) {
      const sku = `${baseSku}-${data.color}-${size}`.toUpperCase().replace(/\s+/g, "-");
      const variant = await prisma.productVariant.create({
        data: {
          productId,
          size,
          color: data.color || "Default",
          colorHex: data.colorHex,
          sku,
          stock: toNumber(data.stock),
          lowStockAlert: data.lowStockAlert ?? 5,
          ...(data.priceOverride !== undefined && { priceOverride: toNumber(data.priceOverride) }),
        },
      });
      created.push(variant);
    }
    return created;
  }

  // Single mode
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
  const baseSku = (product?.slug || productId.slice(0, 8)).toUpperCase();
  const sku = data.sku || `${baseSku}-${data.color}-${data.size}`.toUpperCase().replace(/\s+/g, "-");
  return prisma.productVariant.create({
    data: {
      productId,
      size: data.size,
      color: data.color,
      colorHex: data.colorHex,
      sku,
      stock: toNumber(data.stock),
      lowStockAlert: data.lowStockAlert ?? 5,
      ...(data.priceOverride !== undefined && { priceOverride: toNumber(data.priceOverride) }),
    },
  });
}

export async function updateVariant(variantId: string, data: any) {
  return prisma.productVariant.update({ where: { id: variantId }, data });
}

export async function deleteProductImage(productId: string, imageId: string) {
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });
  if (!image) throw new Error("Image not found for this product");

  await prisma.productImage.delete({ where: { id: imageId } });

  // If the image was stored locally (URL points at /uploads/...), delete the file too
  try {
    const localMatch = image.url.match(/\/uploads\/(.+)$/);
    if (localMatch && localMatch[1]) {
      const fs = await import("fs");
      const path = await import("path");
      const localPath = path.resolve(process.cwd(), "uploads", localMatch[1]);
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }
  } catch (err) {
    console.warn("[deleteProductImage] file unlink failed:", err);
  }

  return { id: imageId };
}

export async function addImages(
  productId: string,
  images: { url: string; alt?: string; position?: number }[]
) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("images array is required");
  }

  const existing = await prisma.productImage.findMany({
    where: { productId },
    select: { url: true },
  });
  const existingUrls = new Set(existing.map((e) => e.url));

  const seen = new Set<string>();
  const unique = images.filter((img) => {
    if (!img.url || existingUrls.has(img.url) || seen.has(img.url)) return false;
    seen.add(img.url);
    return true;
  });

  if (unique.length === 0) return [];

  const existingCount = existing.length;
  const created = await Promise.all(
    unique.map((img, i) =>
      prisma.productImage.create({
        data: {
          productId,
          url: img.url,
          alt: img.alt,
          position: img.position ?? existingCount + i,
        },
      })
    )
  );
  return created;
}
