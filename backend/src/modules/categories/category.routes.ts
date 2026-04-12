import { Router } from "express";
import * as categoryController from "./category.controller.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { categorySchema } from "./category.schema.js";

const router = Router();

router.get("/", categoryController.listCategories);
router.get("/:slug", categoryController.getCategory);
router.post("/", authenticate, requireAdmin, validate(categorySchema), categoryController.createCategory);
router.put("/:id", authenticate, requireAdmin, validate(categorySchema), categoryController.updateCategory);
router.delete("/:id", authenticate, requireAdmin, categoryController.deleteCategory);

export default router;
