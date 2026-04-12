import { Router } from "express";
import * as adminController from "./admin.controller.js";
import { authenticate, requireAdmin, requireSuperAdmin } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { updateRoleSchema, couponSchema } from "./admin.schema.js";

const router = Router();

router.use(authenticate, requireAdmin);

// Dashboard
router.get("/dashboard", adminController.dashboard);
router.get("/revenue", adminController.revenue);
router.get("/inventory", adminController.inventory);

// Users
router.get("/users", adminController.listUsers);
router.put("/users/:id/role", requireSuperAdmin, validate(updateRoleSchema), adminController.updateUserRole);

// Coupons
router.post("/coupons", validate(couponSchema), adminController.createCoupon);
router.get("/coupons", adminController.listCoupons);
router.put("/coupons/:id", adminController.updateCoupon);
router.delete("/coupons/:id", adminController.deleteCoupon);

export default router;
