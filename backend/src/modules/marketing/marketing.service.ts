import { prisma } from "../../config/database.js";

const toNum = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) || 0 : 0);

// ===== CAMPAIGNS =====
export async function listCampaigns() {
  return prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });
}
export async function createCampaign(data: any) {
  return prisma.campaign.create({
    data: {
      name: data.name,
      platform: data.platform || "Email",
      status: data.status || "DRAFT",
      spend: toNum(data.spend),
      revenue: toNum(data.revenue),
      clicks: Number(data.clicks) || 0,
      conversions: Number(data.conversions) || 0,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });
}
export async function updateCampaign(id: string, data: any) {
  const update: any = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.platform !== undefined) update.platform = data.platform;
  if (data.status !== undefined) update.status = data.status;
  if (data.spend !== undefined) update.spend = toNum(data.spend);
  if (data.revenue !== undefined) update.revenue = toNum(data.revenue);
  if (data.clicks !== undefined) update.clicks = Number(data.clicks);
  if (data.conversions !== undefined) update.conversions = Number(data.conversions);
  if (data.startDate !== undefined) update.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) update.endDate = data.endDate ? new Date(data.endDate) : null;
  return prisma.campaign.update({ where: { id }, data: update });
}
export async function deleteCampaign(id: string) {
  await prisma.campaign.delete({ where: { id } });
  return { id };
}

// ===== AUTOMATIONS =====
export async function listAutomations() {
  return prisma.automation.findMany({ orderBy: { createdAt: "desc" } });
}
export async function createAutomation(data: any) {
  return prisma.automation.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      status: data.status || "DRAFT",
      trigger: data.trigger || "manual",
      steps: data.steps ?? null,
    },
  });
}
export async function updateAutomation(id: string, data: any) {
  const update: any = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description;
  if (data.status !== undefined) update.status = data.status;
  if (data.trigger !== undefined) update.trigger = data.trigger;
  if (data.steps !== undefined) update.steps = data.steps;
  if (data.metricsSent !== undefined) update.metricsSent = Number(data.metricsSent);
  if (data.metricsClicked !== undefined) update.metricsClicked = Number(data.metricsClicked);
  if (data.metricsRevenue !== undefined) update.metricsRevenue = toNum(data.metricsRevenue);
  return prisma.automation.update({ where: { id }, data: update });
}
export async function deleteAutomation(id: string) {
  await prisma.automation.delete({ where: { id } });
  return { id };
}

// ===== GIFT CARDS =====
function genCode(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DVSK-${part()}-${part()}-${part()}`;
}
export async function listGiftCards() {
  return prisma.giftCard.findMany({ orderBy: { createdAt: "desc" } });
}
export async function createGiftCard(data: any) {
  let code = data.code || genCode();
  while (await prisma.giftCard.findUnique({ where: { code } })) {
    code = genCode();
  }
  const value = toNum(data.value ?? data.initialValue);
  return prisma.giftCard.create({
    data: {
      code,
      customerName: data.customerName ?? null,
      customerEmail: data.customerEmail ?? null,
      initialValue: value,
      currentBalance: value,
      note: data.note ?? null,
      status: "ACTIVE",
    },
  });
}
export async function updateGiftCard(id: string, data: any) {
  const update: any = {};
  if (data.customerName !== undefined) update.customerName = data.customerName;
  if (data.customerEmail !== undefined) update.customerEmail = data.customerEmail;
  if (data.currentBalance !== undefined) update.currentBalance = toNum(data.currentBalance);
  if (data.status !== undefined) update.status = data.status;
  if (data.note !== undefined) update.note = data.note;
  return prisma.giftCard.update({ where: { id }, data: update });
}
export async function deleteGiftCard(id: string) {
  await prisma.giftCard.update({ where: { id }, data: { status: "DISABLED" } });
  return { id };
}

// ===== MARKETS =====
export async function listMarkets() {
  return prisma.market.findMany({ orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }] });
}
export async function createMarket(data: any) {
  return prisma.market.create({
    data: {
      name: data.name,
      countries: Array.isArray(data.countries) ? data.countries : [data.countries].filter(Boolean),
      currency: data.currency || "INR",
      status: data.status || "ACTIVE",
      isPrimary: !!data.isPrimary,
    },
  });
}
export async function updateMarket(id: string, data: any) {
  const update: any = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.countries !== undefined) update.countries = data.countries;
  if (data.currency !== undefined) update.currency = data.currency;
  if (data.status !== undefined) update.status = data.status;
  if (data.isPrimary !== undefined) update.isPrimary = data.isPrimary;
  return prisma.market.update({ where: { id }, data: update });
}
export async function deleteMarket(id: string) {
  await prisma.market.delete({ where: { id } });
  return { id };
}

// ===== CATALOGS =====
export async function listCatalogs() {
  return prisma.catalog.findMany({ orderBy: { createdAt: "desc" } });
}
export async function createCatalog(data: any) {
  return prisma.catalog.create({
    data: {
      name: data.name,
      region: data.region || "Global",
      status: data.status || "ACTIVE",
      productCount: Number(data.productCount) || 0,
    },
  });
}
export async function updateCatalog(id: string, data: any) {
  const update: any = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.region !== undefined) update.region = data.region;
  if (data.status !== undefined) update.status = data.status;
  if (data.productCount !== undefined) update.productCount = Number(data.productCount);
  return prisma.catalog.update({ where: { id }, data: update });
}
export async function deleteCatalog(id: string) {
  await prisma.catalog.delete({ where: { id } });
  return { id };
}

// ===== COMPANIES =====
export async function listCompanies(category?: string) {
  return prisma.company.findMany({
    where: category ? { category: category as any } : undefined,
    orderBy: { createdAt: "desc" },
  });
}
export async function createCompany(data: any) {
  return prisma.company.create({
    data: {
      name: data.name,
      type: data.type || "Other",
      category: data.category || "SUPPLIER",
      status: data.status || "Pending",
      contact: data.contact ?? null,
      budgetTerms: data.budgetTerms ?? null,
      location: data.location ?? null,
    },
  });
}
export async function updateCompany(id: string, data: any) {
  const update: any = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.type !== undefined) update.type = data.type;
  if (data.category !== undefined) update.category = data.category;
  if (data.status !== undefined) update.status = data.status;
  if (data.contact !== undefined) update.contact = data.contact;
  if (data.budgetTerms !== undefined) update.budgetTerms = data.budgetTerms;
  if (data.location !== undefined) update.location = data.location;
  return prisma.company.update({ where: { id }, data: update });
}
export async function deleteCompany(id: string) {
  await prisma.company.delete({ where: { id } });
  return { id };
}

// ===== ABANDONED CHECKOUTS (derived) =====
export async function listAbandonedCheckouts() {
  // Carts with at least one item where the user has NOT placed an order in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const carts = await prisma.cart.findMany({
    where: {
      items: { some: {} },
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: {
        include: {
          product: { select: { name: true, basePrice: true } },
          variant: { select: { priceOverride: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const result = [];
  for (const cart of carts) {
    const recentOrder = await prisma.order.findFirst({
      where: { userId: cart.userId, createdAt: { gte: sevenDaysAgo } },
      select: { id: true },
    });
    if (recentOrder) continue;

    const total = cart.items.reduce((sum, it) => {
      const price = Number(it.variant.priceOverride ?? it.product.basePrice ?? 0);
      return sum + price * it.quantity;
    }, 0);

    result.push({
      id: cart.id,
      checkoutNumber: `#AC-${cart.id.slice(0, 6).toUpperCase()}`,
      createdAt: cart.updatedAt,
      email: cart.user?.email || cart.user?.phone || "Guest",
      customerName: cart.user?.name || "Guest",
      itemCount: cart.items.length,
      total,
      emailStatus: "Not sent",
      recoveryStatus: "Not recovered",
    });
  }
  return result;
}
