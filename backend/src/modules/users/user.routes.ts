import { Router } from "express";
import * as userController from "./user.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { updateProfileSchema, addressSchema } from "./user.schema.js";

const router = Router();

router.use(authenticate);

router.get("/profile", userController.getProfile);
router.put("/profile", validate(updateProfileSchema), userController.updateProfile);
router.get("/addresses", userController.getAddresses);
router.post("/addresses", validate(addressSchema), userController.createAddress);
router.put("/addresses/:id", validate(addressSchema), userController.updateAddress);
router.delete("/addresses/:id", userController.deleteAddress);
router.put("/addresses/:id/default", userController.setDefaultAddress);

export default router;
