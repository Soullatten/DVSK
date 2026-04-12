import { prisma } from "../../config/database.js";
import { slugify } from "../../utils/helpers.js";

export async function listCategories() {
  return prisma.category.findMany({
    include: {
      children: true,
      _count: { select: { products: true } },
    },
    where: { parentId: null },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      children: true,
      _count: { select: { products: true } },
    },
  });
}

export async function createCategory(data: any) {
  return prisma.category.create({
    data: { ...data, slug: slugify(data.name) },
  });
}

export async function updateCategory(id: string, data: any) {
  const updateData: any = { ...data };
  if (data.name) updateData.slug = slugify(data.name);
  return prisma.category.update({ where: { id }, data: updateData });
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } });
}
