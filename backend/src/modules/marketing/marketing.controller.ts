import type { Request, Response } from "express";
import * as svc from "./marketing.service.js";
import { success, created, badRequest } from "../../utils/apiResponse.js";

const wrap = (fn: (...args: any[]) => Promise<any>) =>
  async (req: Request, res: Response) => {
    try {
      const result = await fn(req);
      const code = req.method === "POST" ? 201 : 200;
      return code === 201 ? created(res, result) : success(res, result);
    } catch (err: any) {
      return badRequest(res, err?.message || "Operation failed");
    }
  };

// Campaigns
export const listCampaigns = wrap(async () => svc.listCampaigns());
export const createCampaign = wrap(async (req: Request) => svc.createCampaign(req.body));
export const updateCampaign = wrap(async (req: Request) => svc.updateCampaign(req.params.id as string, req.body));
export const deleteCampaign = wrap(async (req: Request) => svc.deleteCampaign(req.params.id as string));

// Automations
export const listAutomations = wrap(async () => svc.listAutomations());
export const createAutomation = wrap(async (req: Request) => svc.createAutomation(req.body));
export const updateAutomation = wrap(async (req: Request) => svc.updateAutomation(req.params.id as string, req.body));
export const deleteAutomation = wrap(async (req: Request) => svc.deleteAutomation(req.params.id as string));

// Gift Cards
export const listGiftCards = wrap(async () => svc.listGiftCards());
export const createGiftCard = wrap(async (req: Request) => svc.createGiftCard(req.body));
export const updateGiftCard = wrap(async (req: Request) => svc.updateGiftCard(req.params.id as string, req.body));
export const deleteGiftCard = wrap(async (req: Request) => svc.deleteGiftCard(req.params.id as string));

// Markets
export const listMarkets = wrap(async () => svc.listMarkets());
export const createMarket = wrap(async (req: Request) => svc.createMarket(req.body));
export const updateMarket = wrap(async (req: Request) => svc.updateMarket(req.params.id as string, req.body));
export const deleteMarket = wrap(async (req: Request) => svc.deleteMarket(req.params.id as string));

// Catalogs
export const listCatalogs = wrap(async () => svc.listCatalogs());
export const createCatalog = wrap(async (req: Request) => svc.createCatalog(req.body));
export const updateCatalog = wrap(async (req: Request) => svc.updateCatalog(req.params.id as string, req.body));
export const deleteCatalog = wrap(async (req: Request) => svc.deleteCatalog(req.params.id as string));

// Companies
export const listCompanies = wrap(async (req: Request) => svc.listCompanies(req.query.category as string | undefined));
export const createCompany = wrap(async (req: Request) => svc.createCompany(req.body));
export const updateCompany = wrap(async (req: Request) => svc.updateCompany(req.params.id as string, req.body));
export const deleteCompany = wrap(async (req: Request) => svc.deleteCompany(req.params.id as string));

// Abandoned Checkouts (derived)
export const listAbandonedCheckouts = wrap(async () => svc.listAbandonedCheckouts());
