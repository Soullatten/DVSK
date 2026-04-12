import type { Request, Response } from "express";
import * as categoryService from "./category.service.js";
import { success, created, notFound } from "../../utils/apiResponse.js";

export async function listCategories(_req: Request, res: Response) {
  const categories = await categoryService.listCategories();
  return success(res, categories);
}

export async function getCategory(req: Request, res: Response) {
  const category = await categoryService.getCategoryBySlug(req.params.slug as string);
  if (!category) return notFound(res, "Category not found");
  return success(res, category);
}

export async function createCategory(req: Request, res: Response) {
  const category = await categoryService.createCategory(req.body);
  return created(res, category);
}

export async function updateCategory(req: Request, res: Response) {
  const category = await categoryService.updateCategory(req.params.id as string, req.body);
  return success(res, category, "Category updated");
}

export async function deleteCategory(req: Request, res: Response) {
  await categoryService.deleteCategory(req.params.id as string);
  return success(res, null, "Category deleted");
}
