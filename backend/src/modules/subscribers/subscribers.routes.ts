import { Router } from "express";
import * as ctrl from "./subscribers.controller.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";

const router = Router();

// ── Public ──
// Storefront footer + checkout email-capture box hit this.
router.post("/", ctrl.subscribe);
// Unsubscribe via token-less email param — used in unsubscribe link in
// campaign emails. Anyone with the email can unsubscribe (no auth) since
// requiring a token would lock people out of their own preferences.
router.post("/unsubscribe", ctrl.unsubscribe);

// ── Admin ──
const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);
adminRouter.get("/", ctrl.listSubscribers);
adminRouter.get("/stats", ctrl.subscriberStats);
adminRouter.post("/broadcast", ctrl.broadcastToSubscribers);
adminRouter.delete("/:id", ctrl.deleteSubscriber);

export { router as subscribersPublicRouter, adminRouter as subscribersAdminRouter };
