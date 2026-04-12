import { z } from "zod";

export const registerSchema = z.object({
  firebaseToken: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  firebaseToken: z.string().min(1),
});
