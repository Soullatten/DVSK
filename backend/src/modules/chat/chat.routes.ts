import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import { navyaChat } from "./chat.controller.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.post("/", navyaChat);

export default router;
