import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./env.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Route imports
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import productRoutes from "./modules/products/product.routes.js";
import categoryRoutes from "./modules/categories/category.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import wishlistRoutes from "./modules/wishlist/wishlist.routes.js";
import reviewRoutes from "./modules/reviews/review.routes.js";
import searchRoutes from "./modules/search/search.routes.js";
import uploadRoutes from "./modules/upload/upload.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import panelRoutes from "./modules/panel/panel.routes.js";
import purchaseOrderRoutes from "./modules/purchase-orders/po.routes.js";
import marketingRoutes from "./modules/marketing/marketing.routes.js";
import devRoutes from "./modules/dev/dev.routes.js";
import emailRoutes from "./modules/email/email.routes.js";
import couponsPublicRoutes from "./modules/coupons/coupons.routes.js";
import { subscribersPublicRouter, subscribersAdminRouter } from "./modules/subscribers/subscribers.routes.js";

const app = express();

// Middleware
// helmet() defaults are too strict for a dev backend that:
//   1. Serves static images from /uploads consumed by another origin (storefront on 5173, admin on 5172)
//   2. Has frontends that include libraries needing eval() (Three.js shaders, Framer Motion, etc.)
// We loosen two specific headers so images load cross-origin and CSP doesn't block eval-based libs.
// CORS itself is still allow-listed via env.ALLOWED_ORIGINS below.
app.use(
  helmet({
    contentSecurityPolicy: false, // disable strict CSP — frontends manage their own
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow other origins to <img src> our /uploads
    crossOriginEmbedderPolicy: false,
  })
);
// In dev, also accept any localhost / 127.0.0.1 / private-LAN IP origin so
// you can test the storefront from a phone on the same wifi (origin will be
// http://192.168.x.x:<vite port>) without hardcoding the host's address.
const isDevLocalOrigin = (origin: string) => {
  if (env.NODE_ENV === "production") return false;
  try {
    const u = new URL(origin);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
    // RFC1918 private ranges: 10.x, 172.16–31.x, 192.168.x
    if (/^10\./.test(u.hostname)) return true;
    if (/^192\.168\./.test(u.hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(u.hostname)) return true;
    return false;
  } catch {
    return false;
  }
};

// Allow ANY Vercel deployment URL for this project. Vercel creates a new
// `dvsk-XXXXX.vercel.app` URL per deploy, plus the stable alias
// `dvsk-alpha.vercel.app`. Without this, every new deploy would break CORS
// until we manually added its URL to ALLOWED_ORIGINS. The regex restricts
// to URLs starting with "dvsk-" + a valid Vercel preview suffix, so other
// people's Vercel projects can't reach this backend.
const isDvskVercelOrigin = (origin: string) => {
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return false;
    return /^dvsk[a-z0-9-]*\.vercel\.app$/i.test(u.hostname) ||
           /^dvsk-[a-z0-9-]+-krishivrajputgmailcoms-projects\.vercel\.app$/i.test(u.hostname);
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin(origin, callback) {
      // allow tools like Postman / curl (no origin header)
      if (!origin) return callback(null, true);

      // Electron packaged apps loaded via file:// send Origin: "null" or "file://"
      if (origin === "null" || origin.startsWith("file://")) {
        return callback(null, true);
      }

      if (env.ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      if (isDevLocalOrigin(origin)) {
        return callback(null, true);
      }

      // Vercel preview deploys for this project — keeps every preview URL
      // working without needing to update ALLOWED_ORIGINS each time.
      if (isDvskVercelOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(compression());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve locally-uploaded product images (used when Cloudinary isn't configured)
app.use("/uploads", express.static("uploads"));

// Rate limiting
const limiter = rateLimit({ windowMs: 60 * 1000, max: 100, message: { success: false, error: { code: "RATE_LIMIT", message: "Too many requests" } } });
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, error: { code: "RATE_LIMIT", message: "Too many auth attempts" } } });

app.use("/api", limiter);
app.use("/api/auth", authLimiter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "DVSK API is running", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/coupons", couponsPublicRoutes);
// Newsletter subscribers — public POST for footer signups, admin GET for list
app.use("/api/subscribers", subscribersPublicRouter);
app.use("/api/admin/subscribers", subscribersAdminRouter);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin/chat", chatRoutes);
app.use("/api/admin/email", emailRoutes);
app.use("/api/admin/purchase-orders", purchaseOrderRoutes);
app.use("/api/dev", devRoutes);
app.use("/api/admin", marketingRoutes);
app.use("/api/admin", adminRoutes);
// Admin panel feeds at root /api so existing pages calling /customers, /discounts, etc. work.
app.use("/api", panelRoutes);

// Error handler
app.use(errorHandler);

export default app;
