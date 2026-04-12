import { Router } from "express";
import * as paymentController from "./payment.controller.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createPaymentOrderSchema, verifyPaymentSchema, refundSchema } from "./payment.schema.js";

const router = Router();

router.post("/create-order", authenticate, validate(createPaymentOrderSchema), paymentController.createOrder);
router.post("/verify", authenticate, validate(verifyPaymentSchema), paymentController.verify);
router.post("/webhook", paymentController.webhook); // No auth — Razorpay calls this
router.post("/:id/refund", authenticate, requireAdmin, validate(refundSchema), paymentController.refund);

export default router;
