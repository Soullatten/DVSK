import { Router } from "express";
import multer from "multer";
import * as uploadController from "./upload.controller.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

const router = Router();

router.use(authenticate, requireAdmin);

router.post("/image", upload.single("image"), uploadController.uploadImage);
router.post("/product-image", upload.single("image"), uploadController.uploadImage);
router.post("/images", upload.array("images", 10), uploadController.uploadImages);
router.post("/product-images", upload.array("images", 10), uploadController.uploadImages);
router.delete("/:publicId", uploadController.deleteImage);

export default router;
