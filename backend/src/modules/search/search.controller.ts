import type { Request, Response } from "express";
import * as searchService from "./search.service.js";
import { success, badRequest } from "../../utils/apiResponse.js";

export async function search(req: Request, res: Response) {
  const q = req.query.q as string;
  if (!q || q.length < 2) return badRequest(res, "Search query must be at least 2 characters");

  const result = await searchService.searchProducts(q, req.query);
  return success(res, result.products, "Search results", 200, result.meta);
}

export async function suggestions(req: Request, res: Response) {
  const q = req.query.q as string;
  if (!q || q.length < 2) return success(res, []);

  const results = await searchService.getSuggestions(q);
  return success(res, results);
}
