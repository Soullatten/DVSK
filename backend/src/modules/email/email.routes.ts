import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import * as emailController from "./email.controller.js";

const router = Router();

// All email endpoints require an authenticated admin.
router.use(authenticate, requireAdmin);

router.get("/templates", emailController.listTemplates);
router.post("/preview", emailController.previewTemplate);
router.post("/orders/:orderId/preview", emailController.previewOrderTemplate);
router.post("/orders/:orderId/send", emailController.sendOrderEmail);
router.post("/orders/:orderId/suggest", emailController.suggestOrderEmail);
router.post("/suggest-broadcast", emailController.suggestBroadcast);
router.get("/logs", emailController.listLogs);
router.get("/customer/:userId", emailController.getCustomerBundle);

export default router;
