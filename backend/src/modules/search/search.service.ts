import { prisma } from "../../config/database.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";

export async function searchProducts(q: string, query: any) {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const where = {
    isActive: true,
    OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { description: { contains: q, mode: "insensitive" as const } },
      { category: { name: { contains: q, mode: "insensitive" as const } } },
    ],
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        images: { take: 1, orderBy: { position: "asc" } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, meta: paginationMeta(total, page, limit) };
}

export async function getSuggestions(q: string) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      name: { contains: q, mode: "insensitive" },
    },
    select: { name: true, slug: true },
    take: 8,
  });

  return products.map((p) => ({ name: p.name, slug: p.slug }));
}
