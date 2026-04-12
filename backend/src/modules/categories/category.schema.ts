import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  parentId: z.string().optional(),
});
