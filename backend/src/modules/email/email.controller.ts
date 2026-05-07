import type { Request, Response } from "express";
import OpenAI from "openai";
import { prisma } from "../../config/database.js";
import { env } from "../../env.js";
import { success, badRequest, error as apiError } from "../../utils/apiResponse.js";
import {
  TEMPLATE_CATALOG,
  buildSampleVars,
  findTemplate,
  renderTemplate,
  renderSubject,
} from "./email.templates.js";
import { sendEmail, buildOrderTemplateVars, isMockMode, getDefaultHeroDataUrl } from "./email.service.js";

// ── GET /api/admin/email/templates ───────────────────────────────────────────
// Returns the list of available templates (catalog + variable schema) so the
// admin UI can render the picker + variable form. Also reports mock-mode +
// test-mode flags so the UI can show the right banner.
export async function listTemplates(_req: Request, res: Response) {
  return success(res, {
    mockMode: isMockMode(),
    testMode: env.EMAIL_TEST_MODE,
    testRecipient: env.EMAIL_TEST_RECIPIENT,
    fromName: env.SMTP_FROM_NAME,
    fromEmail: env.SMTP_FROM_EMAIL,
    templates: TEMPLATE_CATALOG.map((t) => ({
      key: t.key,
      label: t.label,
      description: t.description,
      defaultSubject: t.defaultSubject,
      variables: t.variables,
    })),
  });
}

// ── POST /api/admin/email/preview ────────────────────────────────────────────
// Body: { templateKey: string, variables?: object, subjectOverride?: string }
// Returns the fully-rendered HTML + resolved subject so the admin UI can show
// a live preview without sending anything.
export async function previewTemplate(req: Request, res: Response) {
  try {
    const { templateKey, variables = {}, subjectOverride } = req.body as {
      templateKey: string;
      variables?: Record<string, any>;
      subjectOverride?: string;
    };
    if (!templateKey) return badRequest(res, "templateKey is required");

    // Merge sample defaults under user-supplied vars so partial input still
    // produces a clean preview.
    const merged: Record<string, any> = { ...buildSampleVars(templateKey), ...variables };

    // ── Preview-only image fallbacks ──
    // The new-drop template uses {{heroImageUrl}} for a big hero image. The
    // sample value is a fake CDN URL that returns 404, so the preview shows
    // a broken image. Substitute the real default hero (locally-bundled,
    // base64-embedded) so the preview matches what subscribers will see if
    // the admin doesn't override the hero.
    if (templateKey === "new-drop") {
      const userHero = variables?.heroImageUrl;
      const isPlaceholder =
        !userHero ||
        (typeof userHero === "string" && userHero.includes("dvsk.app/cdn/"));
      if (isPlaceholder) {
        merged.heroImageUrl = getDefaultHeroDataUrl();
      }
      // The products list sample uses fake URLs too — clear it for preview
      // unless the admin has supplied real product data via variables.
      if (!variables?.products || (Array.isArray(variables.products) && variables.products.length === 0)) {
        merged.products = [];
      }
    }

    const html = renderTemplate(templateKey, merged);
    const subject = renderSubject(templateKey, subjectOverride, merged);

    return success(res, { html, subject });
  } catch (err: any) {
    return badRequest(res, err.message);
  }
}

// ── POST /api/admin/email/orders/:orderId/preview ────────────────────────────
// Preview using REAL order data — same shape as /preview, but pulls live
// values (customer name, address, items + images, totals) from the database.
// Lets the admin see exactly what the customer will receive before sending.
export async function previewOrderTemplate(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    const { templateKey, subjectOverride, variableOverrides = {} } = req.body as {
      templateKey: string;
      subjectOverride?: string;
      variableOverrides?: Record<string, any>;
    };
    if (!orderId || !templateKey) return badRequest(res, "orderId + templateKey required");
    if (!findTemplate(templateKey)) return badRequest(res, `Unknown template: ${templateKey}`);

    const variables = await buildOrderTemplateVars(orderId, templateKey, variableOverrides);
    const html = renderTemplate(templateKey, variables);
    const subject = renderSubject(templateKey, subjectOverride, variables);

    return success(res, { html, subject, variables });
  } catch (err: any) {
    return badRequest(res, err.message);
  }
}

// ── POST /api/admin/email/orders/:orderId/send ───────────────────────────────
// Body: { templateKey: string, subjectOverride?: string, variableOverrides?: object }
// Looks up the order, resolves customer email, builds template vars from live
// order data, sends via Brevo (or mock), and writes an EmailLog.
export async function sendOrderEmail(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    const { templateKey, subjectOverride, variableOverrides = {} } = req.body as {
      templateKey: string;
      subjectOverride?: string;
      variableOverrides?: Record<string, any>;
    };
    if (!orderId || !templateKey) return badRequest(res, "orderId + templateKey required");
    if (!findTemplate(templateKey)) return badRequest(res, `Unknown template: ${templateKey}`);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, address: true },
    });
    if (!order) return badRequest(res, `Order ${orderId} not found`);

    const toEmail = order.user?.email || null;
    if (!toEmail) {
      return badRequest(res, "This order has no customer email on file — cannot send.");
    }

    const variables = await buildOrderTemplateVars(orderId, templateKey, variableOverrides);
    const result = await sendEmail({
      templateKey,
      variables,
      toEmail,
      subjectOverride,
      orderId: order.id,
      userId: order.userId,
      triggeredBy: req.user?.id ? `admin:${req.user.id}` : "admin",
    });

    return success(res, result, result.ok ? "Email queued / sent" : "Send failed");
  } catch (err: any) {
    return apiError(res, 500, "EMAIL_SEND_ERROR", err.message);
  }
}

// ── POST /api/admin/email/orders/:orderId/suggest ────────────────────────────
// Asks Navya (Groq llama-3.1-8b-instant) to generate a personalised subject
// line + intro paragraph for a given template + order. The admin can copy/edit
// the result in the UI before sending. Falls back gracefully if no GROQ_API_KEY.
export async function suggestOrderEmail(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    const { templateKey, intent } = req.body as {
      templateKey: string;
      intent?: string;
    };
    if (!orderId || !templateKey) return badRequest(res, "orderId + templateKey required");
    const tpl = findTemplate(templateKey);
    if (!tpl) return badRequest(res, `Unknown template: ${templateKey}`);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, address: true, items: true },
    });
    if (!order) return badRequest(res, `Order ${orderId} not found`);

    if (!env.GROQ_API_KEY) {
      // Graceful fallback — no AI key, return a sensible default.
      return success(res, {
        subject: tpl.defaultSubject.replace("{{orderNumber}}", order.orderNumber),
        intro: `Hi ${order.user?.name || "there"}, just a quick note about your DVSK order #${order.orderNumber}.`,
        ai: false,
      });
    }

    const groq = new OpenAI({
      apiKey: env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const prompt = `You are Navya, ops partner for DVSK CLO (modern Indian streetwear).
Write a short personalised email tone for this customer.

Order: #${order.orderNumber}
Customer: ${order.user?.name || "(no name)"} (${order.user?.email})
Items: ${order.items.map((i) => `${i.quantity}× ${i.productName} (${i.color}/${i.size})`).join(", ")}
Total: ₹${Number(order.total).toLocaleString("en-IN")}
City: ${order.address?.city}, ${order.address?.state}
Template: "${tpl.label}"
Admin's intent: ${intent || "(none — default tone)"}

Return STRICTLY a JSON object with two keys:
  "subject" — a short subject line (under 60 chars, no emoji unless the intent asks for it)
  "intro"   — a 1-2 sentence personalised opener (warm but direct, no fluff)
No markdown, no commentary. Just JSON.`;

    const completion = await groq.chat.completions.create({
      model: process.env.NAVYA_MODEL || "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" } as any,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: { subject?: string; intro?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // If model returned non-JSON despite the request, return raw as the intro
      parsed = { intro: raw.slice(0, 400) };
    }

    return success(res, {
      subject: parsed.subject || tpl.defaultSubject.replace("{{orderNumber}}", order.orderNumber),
      intro: parsed.intro || "",
      ai: true,
    });
  } catch (err: any) {
    return apiError(res, 500, "AI_SUGGEST_ERROR", err.message);
  }
}

// ── POST /api/admin/email/suggest-broadcast ──────────────────────────────
// Same Navya pipeline as suggestOrderEmail but for marketing broadcasts —
// no order context. Takes templateKey + intent + the broadcast variables
// (collection name, promo code, etc.) and returns a personalised subject.
//
// Used by the admin's BroadcastEmailModal to populate its "Quick subject
// hint" card with a real AI-generated line instead of a placeholder.
export async function suggestBroadcast(req: Request, res: Response) {
  try {
    const { templateKey, intent, variables } = req.body as {
      templateKey: string;
      intent?: string;
      variables?: Record<string, any>;
    };
    if (!templateKey) return badRequest(res, "templateKey is required");
    const tpl = findTemplate(templateKey);
    if (!tpl) return badRequest(res, `Unknown template: ${templateKey}`);

    if (!env.GROQ_API_KEY) {
      // Graceful fallback when Navya isn't configured
      return success(res, {
        subject: tpl.defaultSubject,
        ai: false,
      });
    }

    const collectionName = variables?.collectionName || "the new drop";
    const promoCode = variables?.promoCode || "";
    const promoCopy = variables?.promoCopy || "";

    const groq = new OpenAI({
      apiKey: env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const prompt = `You are Navya, the brand voice for DVSK CLO — a modern Indian streetwear label. Write a magnetic email subject line for a marketing broadcast going to all newsletter subscribers.

Template: "${tpl.label}" — ${tpl.description}
Collection / Drop name: ${collectionName}
${promoCode ? `Promo code: ${promoCode}` : ""}
${promoCopy ? `Promo copy: ${promoCopy}` : ""}
Admin's intent: ${intent || "(no specific intent — make it punchy)"}

Constraints:
  - Under 60 characters total
  - No emoji unless the intent specifically asks for it
  - Sound like DVSK: confident, terse, slightly mysterious — not corporate
  - Avoid clichés like "You won't believe", "This week only", "Don't miss out"
  - Speak directly to the reader

Return STRICTLY a JSON object with one key:
  "subject" — the subject line, ready to send as-is
No markdown, no commentary. Just JSON.`;

    const completion = await groq.chat.completions.create({
      model: process.env.NAVYA_MODEL || "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.85,
      max_tokens: 100,
      response_format: { type: "json_object" } as any,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: { subject?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // If model didn't return JSON, take the raw output as the subject
      parsed = { subject: raw.replace(/[\r\n]+/g, " ").slice(0, 80) };
    }

    return success(res, {
      subject: parsed.subject || tpl.defaultSubject,
      ai: true,
    });
  } catch (err: any) {
    return apiError(res, 500, "AI_SUGGEST_ERROR", err.message);
  }
}

// ── GET /api/admin/email/customer/:userId ────────────────────────────────────
// Returns a unified bundle for the customer detail drawer:
//   - the user record (name, email, phone, joined date)
//   - aggregate stats (total orders, total spent)
//   - their last 20 orders (id, number, total, status, createdAt)
//   - their last 20 emails (template, subject, status, sentAt)
// Lets the admin see "who is this customer + what have I sent them" from a
// single tap in the Email History table.
export async function getCustomerBundle(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    if (!userId) return badRequest(res, "userId required");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: { orderBy: { isDefault: "desc" }, take: 1 },
      },
    });
    if (!user) return badRequest(res, "User not found");

    const [orders, emails, agg] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { items: { take: 3 } },
      }),
      prisma.emailLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.order.aggregate({
        where: { userId, status: { not: "CANCELLED" } },
        _count: { id: true },
        _sum: { total: true },
      }),
    ]);

    return success(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
        defaultAddress: user.addresses[0] || null,
      },
      stats: {
        totalOrders: agg._count.id,
        totalSpent: Number(agg._sum.total || 0),
      },
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        total: Number(o.total),
        status: o.status,
        createdAt: o.createdAt,
        itemCount: o.items.length,
        firstItem: o.items[0] ? { name: o.items[0].productName, image: o.items[0].image } : null,
      })),
      emails: emails.map((e) => ({
        id: e.id,
        templateKey: e.templateKey,
        subject: e.subject,
        toEmail: e.toEmail,
        status: e.status,
        wasMocked: e.wasMocked,
        wasTestRedirect: e.wasTestRedirect,
        triggeredBy: e.triggeredBy,
        createdAt: e.createdAt,
        sentAt: e.sentAt,
      })),
    });
  } catch (err: any) {
    return apiError(res, 500, "CUSTOMER_BUNDLE_ERROR", err.message);
  }
}

// ── GET /api/admin/email/logs ────────────────────────────────────────────────
// Paginated list of past sends. Supports ?orderId= + ?status= filters.
export async function listLogs(req: Request, res: Response) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const where: any = {};
    if (req.query.orderId) where.orderId = req.query.orderId;
    if (req.query.userId) where.userId = req.query.userId;
    if (req.query.status) where.status = String(req.query.status).toUpperCase();
    if (req.query.templateKey) where.templateKey = req.query.templateKey;
    // Date range filtering — admin defaults to "today" in the UI so the
    // history doesn't pile up into a single endless mess.
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt.gte = new Date(String(req.query.from));
      if (req.query.to) where.createdAt.lte = new Date(String(req.query.to));
    }

    const [items, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.emailLog.count({ where }),
    ]);

    return success(res, { items, total, limit, offset });
  } catch (err: any) {
    return apiError(res, 500, "EMAIL_LOG_ERROR", err.message);
  }
}
