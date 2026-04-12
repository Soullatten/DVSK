import type { Request, Response } from "express";
import * as productService from "./product.service.js";
import { success, created, notFound } from "../../utils/apiResponse.js";

export async function listProducts(req: Request, res: Response) {
  const result = await productService.listProducts(req.query);
  return success(res, result.products, "Products fetched", 200, result.meta);
}

export async function getProduct(req: Request, res: Response) {
  const product = await productService.getProductBySlug(req.params.slug as string);
  if (!product) return notFound(res, "Product not found");
  return success(res, product);
}

export async function getFeatured(_req: Request, res: Response) {
  const products = await productService.getFeatured();
  return success(res, products);
}

export async function getNewArrivals(_req: Request, res: Response) {
  const products = await productService.getNewArrivals();
  return success(res, products);
}

export async function createProduct(req: Request, res: Response) {
  const product = await productService.createProduct(req.body);
  return created(res, product);
}

export async function updateProduct(req: Request, res: Response) {
  const product = await productService.updateProduct(req.params.id as string, req.body);
  return success(res, product, "Product updated");
}

export async function deleteProduct(req: Request, res: Response) {
  await productService.deleteProduct(req.params.id as string);
  return success(res, null, "Product deleted");
}

export async function addVariant(req: Request, res: Response) {
  const variant = await productService.addVariant(req.params.id as string, req.body);
  return created(res, variant);
}

export async function updateVariant(req: Request, res: Response) {
  const variant = await productService.updateVariant(req.params.variantId as string, req.body);
  return success(res, variant, "Variant updated");
}
