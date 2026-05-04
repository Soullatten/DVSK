import type { Request, Response } from "express";
import * as productService from "./product.service.js";
import { success, created, notFound, badRequest } from "../../utils/apiResponse.js";

export async function listProducts(req: Request, res: Response) {
  // Browsers + intermediate proxies can cache for 30s; admin-write events
  // bust the cache by changing data, so this is safe.
  res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  const result = await productService.listProducts(req.query);
  return success(res, result.products, "Products fetched", 200, result.meta);
}

export async function getProduct(req: Request, res: Response) {
  res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  const product = await productService.getProductBySlug(req.params.slug as string);
  if (!product) return notFound(res, "Product not found");
  return success(res, product);
}

export async function getFeatured(_req: Request, res: Response) {
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
  const products = await productService.getFeatured();
  return success(res, products);
}

export async function getNewArrivals(_req: Request, res: Response) {
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
  const products = await productService.getNewArrivals();
  return success(res, products);
}

export async function createProduct(req: Request, res: Response) {
  try {
    const product = await productService.createProduct(req.body);
    return created(res, product);
  } catch (err: any) {
    return badRequest(res, err?.message || "Failed to create product");
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const product = await productService.updateProduct(req.params.id as string, req.body);
    return success(res, product, "Product updated");
  } catch (err: any) {
    return badRequest(res, err?.message || "Failed to update product");
  }
}

export async function addImages(req: Request, res: Response) {
  try {
    const result = await productService.addImages(req.params.id as string, req.body.images);
    return created(res, result, "Images attached");
  } catch (err: any) {
    return badRequest(res, err?.message || "Failed to attach images");
  }
}

export async function removeImage(req: Request, res: Response) {
  try {
    const result = await productService.deleteProductImage(
      req.params.id as string,
      req.params.imageId as string
    );
    return success(res, result, "Image removed");
  } catch (err: any) {
    return badRequest(res, err?.message || "Failed to remove image");
  }
}

export async function deleteProduct(req: Request, res: Response) {
  await productService.deleteProduct(req.params.id as string);
  return success(res, null, "Product deleted");
}

export async function addVariant(req: Request, res: Response) {
  try {
    const variant = await productService.addVariant(req.params.id as string, req.body);
    return created(res, variant);
  } catch (err: any) {
    return badRequest(res, err?.message || "Failed to add variant");
  }
}

export async function updateVariant(req: Request, res: Response) {
  const variant = await productService.updateVariant(req.params.variantId as string, req.body);
  return success(res, variant, "Variant updated");
}
