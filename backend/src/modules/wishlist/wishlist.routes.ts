import { Router } from "express";
import * as wishlistController from "./wishlist.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", wishlistController.getWishlist);
router.post("/:productId", wishlistController.addToWishlist);
router.delete("/:productId", wishlistController.removeFromWishlist);

export default router;
