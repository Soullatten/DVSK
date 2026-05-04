import { z } from "zod";

const numericString = z.union([z.number(), z.string()]);

// Treat empty strings the same as missing so admin form defaults don't fail validation.
const optionalString = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().optional()
);

const optionalNumericString = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  numericString.optional()
);

const productCoreShape = {
  name: optionalString,
  title: optionalString,

  description: optionalString,
  shortDesc: optionalString,

  basePrice: optionalNumericString,
  price: optionalNumericString,
  salePrice: optionalNumericString,

  categoryId: optionalString,
  category: optionalString,
  categorySlug: optionalString,

  tag: z.enum(["NEW_SEASON", "CORE", "ESSENTIALS", "LIMITED_EDITION", "SALE"]).optional(),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]).optional(),

  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),

  stock: optionalNumericString,

  slug: optionalString,

  images: z.array(z.object({
    url: z.string().min(1),
    alt: z.string().optional(),
    position: z.number().int().optional(),
  })).optional(),

  variants: z.array(z.object({
    size: z.string().min(1),
    color: z.string().min(1),
    colorHex: z.string().optional(),
    sku: z.string().min(1).optional(),
    stock: z.number().int().min(0).optional(),
    priceOverride: numericString.optional(),
  })).optional(),
};

export const createProductSchema = z.object(productCoreShape).passthrough();
export const updateProductSchema = z.object(productCoreShape).passthrough();

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

export const variantSchema = z.union([
  z.object({
    size: z.string().min(1),
    color: z.string().min(1),
    colorHex: z.string().optional(),
    sku: z.string().min(1).optional(),
    stock: numericString.optional(),
    lowStockAlert: z.number().int().min(0).optional(),
    priceOverride: numericString.optional(),
  }).passthrough(),
  z.object({
    sizes: z.array(z.string().min(1)).min(1),
    color: z.string().min(1),
    colorHex: z.string().optional(),
    stock: numericString.optional(),
    lowStockAlert: z.number().int().min(0).optional(),
    priceOverride: numericString.optional(),
  }).passthrough(),
]);

export const addImagesSchema = z.object({
  images: z.array(z.object({
    url: z.string().min(1),
    alt: z.string().optional(),
    position: z.number().int().optional(),
  })).min(1),
}).passthrough();
