import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  shortDesc: z.string().max(500).optional(),
  basePrice: z.number().positive(),
  salePrice: z.number().positive().optional(),
  categoryId: z.string().min(1),
  tag: z.enum(["NEW_SEASON", "CORE", "ESSENTIALS", "LIMITED_EDITION", "SALE"]).default("CORE"),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    position: z.number().int().default(0),
  })).optional(),
  variants: z.array(z.object({
    size: z.string().min(1),
    color: z.string().min(1),
    colorHex: z.string().optional(),
    sku: z.string().min(1),
    stock: z.number().int().min(0).default(0),
    priceOverride: z.number().positive().optional(),
  })).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  gender: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "popular", "featured"]).optional(),
  search: z.string().optional(),
});

export const variantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  colorHex: z.string().optional(),
  sku: z.string().min(1),
  stock: z.number().int().min(0).default(0),
  lowStockAlert: z.number().int().min(0).default(5),
  priceOverride: z.number().positive().optional(),
});
