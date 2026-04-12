import { prisma } from "../../config/database.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";

export async function getProductReviews(productId: string, query: any) {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const where = { productId, isApproved: true };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    }),
    prisma.review.count({ where }),
  ]);

  // Aggregate stats
  const stats = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    reviews,
    stats: { avgRating: stats._avg.rating || 0, totalReviews: stats._count.rating },
    meta: paginationMeta(total, page, limit),
  };
}

export async function createReview(userId: string, productId: string, data: { rating: number; title?: string; text: string }) {
  // Check if user has purchased this product
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId, status: { in: ["CONFIRMED", "DELIVERED"] } },
    },
  });

  return prisma.review.create({
    data: {
      userId,
      productId,
      ...data,
      isVerified: !!hasPurchased,
      isApproved: false, // Requires admin approval
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
}

export async function updateReview(userId: string, reviewId: string, data: any) {
  const review = await prisma.review.findFirst({ where: { id: reviewId, userId } });
  if (!review) return null;

  return prisma.review.update({
    where: { id: reviewId },
    data: { ...data, isApproved: false }, // Re-approve after edit
  });
}

export async function deleteReview(userId: string, reviewId: string) {
  const review = await prisma.review.findFirst({ where: { id: reviewId, userId } });
  if (!review) return null;
  return prisma.review.delete({ where: { id: reviewId } });
}

export async function approveReview(reviewId: string, isApproved: boolean) {
  return prisma.review.update({
    where: { id: reviewId },
    data: { isApproved },
  });
}
