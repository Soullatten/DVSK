import { Router } from "express";
import * as orderController from "./order.controller.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createOrderSchema, updateOrderStatusSchema, updateTrackingSchema } from "./order.schema.js";

const router = Router();

router.use(authenticate);

// User routes
router.post("/", validate(createOrderSchema), orderController.createOrder);
router.get("/", orderController.getUserOrders);
router.get("/:id", orderController.getOrder);
router.post("/:id/cancel", orderController.cancelOrder);

// Admin routes
router.get("/admin/all", requireAdmin, orderController.getAllOrders);
router.put("/admin/:id/status", requireAdmin, validate(updateOrderStatusSchema), orderController.updateOrderStatus);
router.put("/admin/:id/tracking", requireAdmin, validate(updateTrackingSchema), orderController.updateTracking);

export default router;
