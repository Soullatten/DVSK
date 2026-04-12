import { Router } from "express";
import * as cartController from "./cart.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { addToCartSchema, updateCartItemSchema, applyCouponSchema } from "./cart.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", cartController.getCart);
router.post("/items", validate(addToCartSchema), cartController.addItem);
router.put("/items/:itemId", validate(updateCartItemSchema), cartController.updateItem);
router.delete("/items/:itemId", cartController.removeItem);
router.delete("/", cartController.clearCart);
router.post("/apply-coupon", validate(applyCouponSchema), cartController.applyCoupon);

export default router;
