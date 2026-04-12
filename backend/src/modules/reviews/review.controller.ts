import type { Request, Response } from "express";
import * as reviewService from "./review.service.js";
import { success, created, notFound, badRequest } from "../../utils/apiResponse.js";

export async function getProductReviews(req: Request, res: Response) {
  const result = await reviewService.getProductReviews(req.params.productId as string, req.query);
  return success(res, { reviews: result.reviews, stats: result.stats }, "Reviews fetched", 200, result.meta);
}

export async function createReview(req: Request, res: Response) {
  try {
    const review = await reviewService.createReview(req.user!.id, req.params.productId as string, req.body);
    return created(res, review, "Review submitted for approval");
  } catch (err: any) {
    if (err.code === "P2002") return badRequest(res, "You have already reviewed this product");
    return badRequest(res, err.message);
  }
}

export async function updateReview(req: Request, res: Response) {
  const review = await reviewService.updateReview(req.user!.id, req.params.id as string, req.body);
  if (!review) return notFound(res, "Review not found");
  return success(res, review, "Review updated");
}

export async function deleteReview(req: Request, res: Response) {
  const review = await reviewService.deleteReview(req.user!.id, req.params.id as string);
  if (!review) return notFound(res, "Review not found");
  return success(res, null, "Review deleted");
}

export async function approveReview(req: Request, res: Response) {
  const review = await reviewService.approveReview(req.params.id as string, req.body.isApproved ?? true);
  return success(res, review, "Review approval updated");
}
