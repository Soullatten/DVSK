import { Router } from "express";
import * as poController from "./po.controller.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
} from "./po.schema.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/", poController.list);
router.get("/:id", poController.getOne);
router.post("/", validate(createPurchaseOrderSchema), poController.create);
router.put("/:id", validate(updatePurchaseOrderSchema), poController.update);
router.put("/:id/status", validate(updatePurchaseOrderStatusSchema), poController.updateStatus);
router.delete("/:id", poController.remove);

export default router;
