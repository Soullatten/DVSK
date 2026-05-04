import { Router } from "express";
import * as productController from "./product.controller.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  createProductSchema,
  updateProductSchema,
  variantSchema,
  productQuerySchema,
  addImagesSchema,
} from "./product.schema.js";

const router = Router();

// Public
router.get("/", validate(productQuerySchema, "query"), productController.listProducts);
router.get("/featured", productController.getFeatured);
router.get("/new-arrivals", productController.getNewArrivals);
router.get("/:slug", productController.getProduct);

// Admin
router.post("/", authenticate, requireAdmin, validate(createProductSchema), productController.createProduct);
router.put("/:id", authenticate, requireAdmin, validate(updateProductSchema), productController.updateProduct);
router.delete("/:id", authenticate, requireAdmin, productController.deleteProduct);
router.post("/:id/variants", authenticate, requireAdmin, validate(variantSchema), productController.addVariant);
router.put("/:id/variants/:variantId", authenticate, requireAdmin, productController.updateVariant);
router.post("/:id/images", authenticate, requireAdmin, validate(addImagesSchema), productController.addImages);
router.delete("/:id/images/:imageId", authenticate, requireAdmin, productController.removeImage);

export default router;
