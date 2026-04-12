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

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(compression());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);

// Error handler
app.use(errorHandler);

export default app;
