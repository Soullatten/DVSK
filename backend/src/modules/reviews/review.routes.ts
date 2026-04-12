import { Router } from "express";
import * as reviewController from "./review.controller.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createReviewSchema, updateReviewSchema } from "./review.schema.js";

const router = Router();

// Public
router.get("/products/:productId", reviewController.getProductReviews);

// User
router.post("/products/:productId", authenticate, validate(createReviewSchema), reviewController.createReview);
router.put("/:id", authenticate, validate(updateReviewSchema), reviewController.updateReview);
router.delete("/:id", authenticate, reviewController.deleteReview);

// Admin
router.put("/admin/:id/approve", authenticate, requireAdmin, reviewController.approveReview);

export default router;
