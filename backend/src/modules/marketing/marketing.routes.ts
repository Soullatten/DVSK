import { Router } from "express";
import * as ctrl from "./marketing.controller.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";

const router = Router();

router.use(authenticate, requireAdmin);

// Campaigns
router.get("/campaigns", ctrl.listCampaigns);
router.post("/campaigns", ctrl.createCampaign);
router.put("/campaigns/:id", ctrl.updateCampaign);
router.delete("/campaigns/:id", ctrl.deleteCampaign);

// Automations
router.get("/automations", ctrl.listAutomations);
router.post("/automations", ctrl.createAutomation);
router.put("/automations/:id", ctrl.updateAutomation);
router.delete("/automations/:id", ctrl.deleteAutomation);

// Gift Cards
router.get("/gift-cards", ctrl.listGiftCards);
router.post("/gift-cards", ctrl.createGiftCard);
router.put("/gift-cards/:id", ctrl.updateGiftCard);
router.delete("/gift-cards/:id", ctrl.deleteGiftCard);

// Markets
router.get("/markets", ctrl.listMarkets);
router.post("/markets", ctrl.createMarket);
router.put("/markets/:id", ctrl.updateMarket);
router.delete("/markets/:id", ctrl.deleteMarket);

// Catalogs
router.get("/catalogs", ctrl.listCatalogs);
router.post("/catalogs", ctrl.createCatalog);
router.put("/catalogs/:id", ctrl.updateCatalog);
router.delete("/catalogs/:id", ctrl.deleteCatalog);

// Companies
router.get("/companies", ctrl.listCompanies);
router.post("/companies", ctrl.createCompany);
router.put("/companies/:id", ctrl.updateCompany);
router.delete("/companies/:id", ctrl.deleteCompany);

// Abandoned Checkouts
router.get("/abandoned-checkouts", ctrl.listAbandonedCheckouts);

export default router;
