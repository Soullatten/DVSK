import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  DATABASE_URL: z.string().min(1),

  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),

  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Groq API key for Navya AI assistant (admin panel)
  GROQ_API_KEY: z.string().optional(),

  // ── Email (Brevo SMTP) ──
  // All optional: if SMTP_USER is empty the email service runs in MOCK mode —
  // sends are logged to console + EmailLog with status="mocked" so the admin
  // UI flow can be exercised end-to-end before real Brevo creds are wired in.
  SMTP_HOST: z.string().default("smtp-relay.brevo.com"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().default("nexoraai10@gmail.com"),
  SMTP_FROM_NAME: z.string().default("DVSK"),
  // When true, ALL outgoing emails are redirected to EMAIL_TEST_RECIPIENT
  // regardless of who the real recipient is. Use this in dev so customers
  // never accidentally receive test sends.
  EMAIL_TEST_MODE: z
    .string()
    .default("true")
    .transform((v) => v.toLowerCase() === "true"),
  EMAIL_TEST_RECIPIENT: z.string().default("nexoraai10@gmail.com"),

  // Main frontend URL – still useful for emails, redirects, etc.
  FRONTEND_URL: z.string().default("http://localhost:5173"),

  // NEW: comma‑separated list of allowed origins -> string[]
  ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://localhost:3001")
    .transform((value) =>
      value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),

  REDIS_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);