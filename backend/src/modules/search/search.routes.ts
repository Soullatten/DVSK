import { Router } from "express";
import * as searchController from "./search.controller.js";

const router = Router();

router.get("/", searchController.search);
router.get("/suggestions", searchController.suggestions);

export default router;
