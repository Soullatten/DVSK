import type { Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { success, badRequest, error as apiError } from "../../utils/apiResponse.js";
import { sendEmail } from "../email/email.service.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Public: subscribe ──
export async function subscribe(req: Request, res: Response) {
  try {
    const { email, source, country } = req.body as {
      email?: string;
      source?: string;
      country?: string;
    };
    if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return badRequest(res, "Please enter a valid email address.");
    }

    const normalized = email.trim().toLowerCase();
    const cleanSource = (source || "footer").slice(0, 40);

    // Try to attach to a User if one exists with the same email
    const user = await prisma.user.findUnique({ where: { email: normalized } });

    // Upsert — re-subscribing a previously-unsubscribed email clears the
    // unsubscribedAt flag instead of erroring.
    const existing = await prisma.subscriber.findUnique({ where: { email: normalized } });
    if (existing) {
      const wasInactive = existing.unsubscribedAt !== null;
      const updated = await prisma.subscriber.update({
        where: { id: existing.id },
        data: {
          source: cleanSource,
          country: country || existing.country,
          unsubscribedAt: null,
          userId: user?.id || existing.userId,
        },
      });
      return success(
        res,
        { id: updated.id, email: updated.email, alreadySubscribed: !wasInactive },
        wasInactive ? "Welcome back to the Syndicate." : "You're already on the list."
      );
    }

    const created = await prisma.subscriber.create({
      data: {
        email: normalized,
        source: cleanSource,
        country: country || null,
        userId: user?.id || null,
      },
    });
    return success(
      res,
      { id: created.id, email: created.email, alreadySubscribed: false },
      "Welcome to the Syndicate."
    );
  } catch (err: any) {
    return apiError(res, 500, "SUBSCRIBE_ERROR", err.message || "Failed to subscribe");
  }
}

// ── Public: unsubscribe ──
export async function unsubscribe(req: Request, res: Response) {
  try {
    const { email } = req.body as { email?: string };
    if (!email) return badRequest(res, "Email is required");
    const normalized = email.trim().toLowerCase();
    const sub = await prisma.subscriber.findUnique({ where: { email: normalized } });
    if (!sub) {
      // Quietly succeed — no info leak about who is/isn't subscribed
      return success(res, { ok: true }, "You're unsubscribed.");
    }
    await prisma.subscriber.update({
      where: { id: sub.id },
      data: { unsubscribedAt: new Date() },
    });
    return success(res, { ok: true }, "You're unsubscribed.");
  } catch (err: any) {
    return apiError(res, 500, "UNSUBSCRIBE_ERROR", err.message || "Failed to unsubscribe");
  }
}

// ── Admin: list (paginated, filterable) ──
export async function listSubscribers(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt((req.query.limit as string) || "50", 10)));
    const skip = (page - 1) * limit;
    const status = (req.query.status as string) || "active"; // active | inactive | all
    const source = req.query.source as string | undefined;
    const search = (req.query.search as string)?.trim();

    const where: any = {};
    if (status === "active") where.unsubscribedAt = null;
    if (status === "inactive") where.unsubscribedAt = { not: null };
    if (source) where.source = source;
    if (search) where.email = { contains: search, mode: "insensitive" };

    const [items, total] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        orderBy: { subscribedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.subscriber.count({ where }),
    ]);

    return success(res, {
      subscribers: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return apiError(res, 500, "LIST_ERROR", err.message || "Failed to list subscribers");
  }
}

// ── Admin: stats ──
export async function subscriberStats(_req: Request, res: Response) {
  try {
    const [total, active, inactive, sourceGroups, last30days] = await Promise.all([
      prisma.subscriber.count(),
      prisma.subscriber.count({ where: { unsubscribedAt: null } }),
      prisma.subscriber.count({ where: { unsubscribedAt: { not: null } } }),
      prisma.subscriber.groupBy({
        by: ["source"],
        _count: { _all: true },
        where: { unsubscribedAt: null },
      }),
      prisma.subscriber.count({
        where: {
          subscribedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          unsubscribedAt: null,
        },
      }),
    ]);

    return success(res, {
      total,
      active,
      inactive,
      last30days,
      bySource: sourceGroups.map((g) => ({ source: g.source, count: g._count._all })),
    });
  } catch (err: any) {
    return apiError(res, 500, "STATS_ERROR", err.message || "Failed to load stats");
  }
}

// ── Admin: broadcast email to all active subscribers ──
// Accepts a templateKey + variables (same shape as the order-email send)
// and fans them out to every active subscriber's email. Each send writes
// its own EmailLog row so the admin can audit + retry.
//
// Returns counts: how many were attempted, how many succeeded, how many
// failed. Failures don't abort the run — they're logged and reported.
export async function broadcastToSubscribers(req: Request, res: Response) {
  try {
    const {
      templateKey,
      variables,
      subjectOverride,
      sourceFilter,
    } = req.body as {
      templateKey?: string;
      variables?: Record<string, any>;
      subjectOverride?: string;
      sourceFilter?: string; // optional: only blast subscribers from one source
    };

    if (!templateKey) return badRequest(res, "templateKey is required");

    const where: any = { unsubscribedAt: null };
    if (sourceFilter) where.source = sourceFilter;

    const subs = await prisma.subscriber.findMany({
      where,
      select: { id: true, email: true, source: true },
    });

    if (subs.length === 0) {
      return success(res, { attempted: 0, sent: 0, failed: 0 }, "No active subscribers");
    }

    // Personalise the unsubscribe URL per subscriber so each email's
    // unsubscribe link works correctly. Other variables are shared.
    const baseVars = variables || {};

    let sent = 0;
    let failed = 0;
    const failures: Array<{ email: string; error: string }> = [];

    for (const sub of subs) {
      const personalised = {
        ...baseVars,
        unsubscribeUrl: `https://dvsk.shop/unsubscribe?email=${encodeURIComponent(sub.email)}`,
        subscriberEmail: sub.email,
      };
      try {
        const result = await sendEmail({
          templateKey,
          variables: personalised,
          toEmail: sub.email,
          subjectOverride,
          triggeredBy: "admin:broadcast",
        });
        if (result.ok) sent++;
        else failed++;
      } catch (err: any) {
        failed++;
        failures.push({ email: sub.email, error: err?.message || "send failed" });
      }
    }

    return success(
      res,
      { attempted: subs.length, sent, failed, failures: failures.slice(0, 20) },
      `Broadcast complete: ${sent}/${subs.length} sent`
    );
  } catch (err: any) {
    return apiError(res, 500, "BROADCAST_ERROR", err.message || "Broadcast failed");
  }
}

// ── Admin: delete (hard delete, for GDPR-style requests) ──
export async function deleteSubscriber(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.subscriber.delete({ where: { id } });
    return success(res, { ok: true }, "Subscriber removed");
  } catch (err: any) {
    return apiError(res, 500, "DELETE_ERROR", err.message || "Failed to delete");
  }
}
