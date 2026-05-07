import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { prisma } from "../../config/database.js";
import { env } from "../../env.js";
import { renderTemplate, renderSubject, findTemplate } from "./email.templates.js";

// ── Load the men's-page hero image as a base64 data URL once at startup ─────
// Used as the default `heroImageUrl` for the new-drop email template so the
// hero always renders, even on a brand new customer's inbox with no internet
// to fetch a remote image. The file lives in the storefront's assets folder
// (../../../../src/assets/image8.jpg from this file).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let CACHED_HERO_DATA_URL: string | null = null;
export function getDefaultHeroDataUrl(): string {
  if (CACHED_HERO_DATA_URL !== null) return CACHED_HERO_DATA_URL;
  try {
    // Prefer the pre-baked faded version (small + dissolves into body color).
    // Falls back to the raw image if the bake script hasn't been run.
    const fadedPath = path.resolve(__dirname, "../../../../src/assets/image8-faded.jpg");
    const rawPath = path.resolve(__dirname, "../../../../src/assets/image8.jpg");
    const heroPath = fs.existsSync(fadedPath) ? fadedPath : rawPath;
    if (fs.existsSync(heroPath)) {
      const buf = fs.readFileSync(heroPath);
      CACHED_HERO_DATA_URL = `data:image/jpeg;base64,${buf.toString("base64")}`;
    } else {
      CACHED_HERO_DATA_URL = "";
    }
  } catch {
    CACHED_HERO_DATA_URL = "";
  }
  return CACHED_HERO_DATA_URL;
}

// ── Resolve a local image path → base64 data URL for inline embedding ───────
// Recipients of an email can't reach the backend's localhost URLs, so any
// image whose source is a local file (uploads/abc.jpg, /uploads/abc.jpg,
// or a localhost http URL) needs to be inlined as `data:image/...;base64,...`
// in the rendered HTML. We cache results per process so repeated sends of
// the same product don't re-read disk.
//
// Each image is also RESIZED to a small thumbnail (160px wide) and re-encoded
// at JPEG quality 75 so the embedded base64 stays tiny. This is critical to
// keep the total email under Gmail's ~102KB clipping limit.
const IMG_CACHE = new Map<string, string>();
async function readImageAsDataUrl(rawPath: string): Promise<string> {
  if (!rawPath) return "";
  const rel = rawPath.startsWith("/") ? rawPath.slice(1) : rawPath;
  const cached = IMG_CACHE.get(rel);
  if (cached !== undefined) return cached;

  const candidates = [
    path.resolve(process.cwd(), rel),
    path.resolve(__dirname, "../../../", rel),
    path.resolve(__dirname, "../../../../src/", rel.replace(/^uploads\//, "assets/")),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        // Resize + re-compress so embedded thumbs stay tiny.
        const optimized = await sharp(candidate)
          .resize(160, 200, { fit: "cover", position: "center" })
          .jpeg({ quality: 75, progressive: true })
          .toBuffer();
        const dataUrl = `data:image/jpeg;base64,${optimized.toString("base64")}`;
        IMG_CACHE.set(rel, dataUrl);
        return dataUrl;
      }
    } catch {
      // try the next candidate
    }
  }

  IMG_CACHE.set(rel, "");
  return "";
}

// ── SMTP transporter (Brevo) ─────────────────────────────────────────────────
// If SMTP_USER is empty we skip building a real transporter and run in MOCK
// mode — every send is logged to console + EmailLog with status="MOCKED" so
// the admin UI flow can be exercised end-to-end before plugging real creds.
let transporter: Transporter | null = null;

export function isMockMode() {
  return !env.SMTP_USER || env.SMTP_USER.trim() === "";
}

function getTransporter(): Transporter {
  if (transporter) return transporter;
  if (isMockMode()) {
    throw new Error("SMTP creds not configured — running in mock mode");
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false, // Brevo uses STARTTLS on 587, NOT SSL
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

// ── Public types ─────────────────────────────────────────────────────────────
export interface SendArgs {
  templateKey: string;
  // Variables to fill into the Handlebars template + subject
  variables: Record<string, any>;
  // Original (intended) recipient — what the customer's email actually is
  toEmail: string;
  // Optional override for the subject line; if omitted we use the template default
  subjectOverride?: string;
  // Optional links to associated records
  orderId?: string;
  userId?: string;
  // Who triggered this send ("system" | "admin:<id>" | "navya")
  triggeredBy?: string;
}

export interface SendResult {
  ok: boolean;
  status: "SENT" | "MOCKED" | "FAILED";
  emailLogId: string;
  messageId?: string;
  errorMessage?: string;
  // The final destination (after any test-mode redirect)
  finalRecipient: string;
  wasTestRedirect: boolean;
  wasMocked: boolean;
}

// Tiny helper: pause N ms (for retry backoff)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Send a templated email.
 *
 * Behavior:
 *  1. Resolves the template + subject, renders HTML.
 *  2. Honours EMAIL_TEST_MODE: if true, redirects the send to
 *     EMAIL_TEST_RECIPIENT and tags the EmailLog row with wasTestRedirect=true.
 *  3. Honours mock mode: if SMTP_USER is unset, doesn't actually call SMTP,
 *     logs a banner to console + writes EmailLog with status="MOCKED".
 *  4. Retries up to 3× with exponential backoff on transient SMTP errors.
 *  5. Always writes a row to EmailLog (PENDING → SENT/FAILED/MOCKED).
 */
export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const tpl = findTemplate(args.templateKey);
  if (!tpl) {
    throw new Error(`Unknown email template: ${args.templateKey}`);
  }

  // Render once, before any DB write — if rendering fails we fail loudly.
  let html = renderTemplate(args.templateKey, args.variables);
  const subject = renderSubject(args.templateKey, args.subjectOverride, args.variables);

  // ── Convert inline base64 data URIs → CID-attached images ──────────────
  // Gmail Web (and a few other clients) strip `data:image/...;base64,...`
  // URIs from <img src> for security. The right way to embed images in
  // email is via MIME `multipart/related` attachments with a Content-ID,
  // referenced as `src="cid:xxx@dvsk"`. Nodemailer builds the multipart
  // wrapper for us automatically when we pass `attachments` with `cid`.
  const cidAttachments: Array<{ filename: string; content: Buffer; cid: string; contentType: string }> = [];
  let cidCounter = 0;
  html = html.replace(/src="data:(image\/[a-z+]+);base64,([^"]+)"/gi, (_match, mime: string, b64: string) => {
    cidCounter += 1;
    const cid = `dvskimg${cidCounter}@dvsk`;
    const ext = (mime.split("/")[1] || "jpg").replace("jpeg", "jpg");
    cidAttachments.push({
      filename: `img${cidCounter}.${ext}`,
      content: Buffer.from(b64, "base64"),
      cid,
      contentType: mime,
    });
    return `src="cid:${cid}"`;
  });

  // Apply test-mode redirect
  const wasTestRedirect = env.EMAIL_TEST_MODE && env.EMAIL_TEST_RECIPIENT && env.EMAIL_TEST_RECIPIENT !== args.toEmail;
  const finalRecipient = wasTestRedirect ? env.EMAIL_TEST_RECIPIENT : args.toEmail;

  // Pre-write the log row with status=PENDING so we always have a trace
  const log = await prisma.emailLog.create({
    data: {
      templateKey: args.templateKey,
      subject,
      toEmail: finalRecipient,
      intendedEmail: args.toEmail,
      orderId: args.orderId,
      userId: args.userId,
      status: "PENDING",
      wasTestRedirect: !!wasTestRedirect,
      variables: args.variables as any,
      triggeredBy: args.triggeredBy ?? "system",
    },
  });

  // Mock mode → log to console + mark as MOCKED
  if (isMockMode()) {
    // eslint-disable-next-line no-console
    console.log(
      `\n📨 [EMAIL MOCK] Would send "${subject}" → ${finalRecipient}` +
        (wasTestRedirect ? ` (redirected from ${args.toEmail})` : "") +
        `\n   Template: ${args.templateKey}` +
        `\n   Vars: ${JSON.stringify(args.variables, null, 2).slice(0, 600)}\n`
    );
    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: "MOCKED",
        wasMocked: true,
        sentAt: new Date(),
      },
    });
    return {
      ok: true,
      status: "MOCKED",
      emailLogId: log.id,
      finalRecipient,
      wasTestRedirect: !!wasTestRedirect,
      wasMocked: true,
    };
  }

  // Real send — retry up to 3 times with backoff
  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // Build a tiny, hand-crafted plain-text fallback. We DON'T strip the
      // template HTML — that path leaks comments + base64 images. Instead,
      // produce a short readable summary from the variables themselves and
      // tell the recipient the rich version is waiting if they enable HTML.
      const v: any = args.variables || {};
      const lines: string[] = [];
      lines.push(subject);
      lines.push("");
      if (v.shippingName) lines.push(`Hi ${v.shippingName},`);
      if (args.templateKey === "order-confirmation") {
        lines.push(`Your DVSK order #${v.orderNumber || ""} is confirmed.`);
        if (v.total) lines.push(`Total: ₹${v.total}`);
        if (Array.isArray(v.items)) {
          lines.push("");
          lines.push("Items:");
          for (const it of v.items) {
            lines.push(`- ${it.name} (${it.variant || ""} · Size ${it.size || ""}) × ${it.quantity || 1} — ₹${it.price || ""}`);
          }
        }
        if (v.viewOrderUrl) {
          lines.push("");
          lines.push(`View your order: ${v.viewOrderUrl}`);
        }
      } else if (args.templateKey === "order-tracking") {
        lines.push(`Your DVSK order #${v.orderNumber || ""} is on the way.`);
        if (v.courier) lines.push(`Courier: ${v.courier}`);
        if (v.trackingNumber) lines.push(`Tracking: ${v.trackingNumber}`);
        if (v.estimatedDelivery) lines.push(`ETA: ${v.estimatedDelivery}`);
        if (v.trackUrl) {
          lines.push("");
          lines.push(`Track: ${v.trackUrl}`);
        }
      } else if (args.templateKey === "new-drop") {
        lines.push(`The new drop is live: ${v.collectionName || "DVSK"}`);
        if (v.promoCode) lines.push(`Use code: ${v.promoCode}`);
        if (v.promoCopy) lines.push(v.promoCopy);
        if (v.shopUrl) {
          lines.push("");
          lines.push(`Shop the drop: ${v.shopUrl}`);
        }
      }
      lines.push("");
      lines.push("— DVSK");
      const cleanText = lines.join("\n").slice(0, 1500);

      const info = await getTransporter().sendMail({
        from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
        to: finalRecipient,
        subject,
        text: cleanText,
        html,
        // CID-attached images extracted from inline base64 data URIs above.
        // contentDisposition: 'inline' is CRITICAL — without it, Gmail and
        // most clients treat these as regular attachments (showing them in
        // an attachments bar) AND fail to render them inline at the same
        // time. Marking them inline puts them in MIME multipart/related
        // and the <img src="cid:..."> references resolve correctly.
        attachments: cidAttachments.map((a) => ({
          filename: a.filename,
          content: a.content,
          cid: a.cid,
          contentType: a.contentType,
          contentDisposition: "inline" as const,
        })),
      });

      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: "SENT",
          messageId: info.messageId || null,
          sentAt: new Date(),
        },
      });

      return {
        ok: true,
        status: "SENT",
        emailLogId: log.id,
        messageId: info.messageId,
        finalRecipient,
        wasTestRedirect: !!wasTestRedirect,
        wasMocked: false,
      };
    } catch (err: any) {
      lastError = err;
      // Exponential backoff: 500ms → 1500ms → 4500ms before giving up
      if (attempt < 3) await sleep(500 * Math.pow(3, attempt - 1));
    }
  }

  // All retries exhausted
  const errorMessage = lastError?.message || String(lastError) || "Unknown SMTP error";
  await prisma.emailLog.update({
    where: { id: log.id },
    data: {
      status: "FAILED",
      errorMessage,
      sentAt: new Date(),
    },
  });

  return {
    ok: false,
    status: "FAILED",
    emailLogId: log.id,
    errorMessage,
    finalRecipient,
    wasTestRedirect: !!wasTestRedirect,
    wasMocked: false,
  };
}

// ── Build template variables from a real Order ───────────────────────────────
// Pulls live data from the DB and shapes it for the order-* templates so the
// admin doesn't have to type anything when sending to a real customer.
export async function buildOrderTemplateVars(
  orderId: string,
  templateKey: string,
  overrides: Partial<Record<string, any>> = {}
): Promise<Record<string, any>> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      address: true,
      items: true,
      payment: true,
    },
  });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const baseUrl = env.FRONTEND_URL.replace(/\/$/, "");
  // Backend's public URL for serving uploads. Same as FRONTEND_URL by default
  // since locally the storefront proxies /uploads to the backend; can be
  // overridden via env if you ever host them separately.
  const apiPublicUrl = (process.env.PUBLIC_API_URL || `http://localhost:${env.PORT}`).replace(/\/$/, "");
  const formatINR = (n: number | string) =>
    Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  // Email clients can't reach localhost / private IPs from the recipient's
  // computer, so any locally-served image must be embedded inline as a
  // base64 data URL. Public URLs (Cloudinary, etc.) are left alone.
  const absUrl = async (raw: string | null | undefined): Promise<string> => {
    if (!raw) return "";
    const trimmed = raw.trim();
    if (!trimmed) return "";

    if (trimmed.startsWith("data:")) return trimmed;

    if (/^https?:\/\//i.test(trimmed)) {
      try {
        const u = new URL(trimmed);
        const isLocal =
          u.hostname === "localhost" ||
          u.hostname === "127.0.0.1" ||
          /^192\.168\./.test(u.hostname) ||
          /^10\./.test(u.hostname);
        if (!isLocal) return trimmed;
        return (await readImageAsDataUrl(u.pathname)) || trimmed;
      } catch {
        return trimmed;
      }
    }

    return (await readImageAsDataUrl(trimmed)) || `${apiPublicUrl}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  };

  const items = await Promise.all(
    order.items.map(async (it) => ({
      imageUrl: await absUrl(it.image),
      name: it.productName,
      variant: it.color,
      size: it.size,
      quantity: it.quantity,
      price: formatINR(Number(it.totalPrice)),
    }))
  );

  const sharedVars = {
    orderNumber: order.orderNumber,
    shippingName: order.address.fullName,
    addressLine1: order.address.addressLine1,
    addressLine2: order.address.addressLine2 || "",
    city: order.address.city,
    state: order.address.state,
    pincode: order.address.pincode,
    subtotal: formatINR(Number(order.subtotal)),
    shipping: formatINR(Number(order.shippingCost)),
    discount: formatINR(Number(order.discount)),
    total: formatINR(Number(order.total)),
    items,
    viewOrderUrl: `${baseUrl}/account/orders/${order.orderNumber}`,
    shopUrl: baseUrl,
  };

  if (templateKey === "order-tracking") {
    return {
      ...sharedVars,
      trackingNumber: order.trackingNumber || "",
      courier: order.shippingProvider || "Delhivery",
      estimatedDelivery: "Within 4-7 business days",
      destination: `${order.address.city}, ${order.address.state}`,
      trackUrl: order.trackingNumber
        ? `https://www.delhivery.com/track/package/${order.trackingNumber}`
        : `${baseUrl}/account/orders/${order.orderNumber}`,
      ...overrides,
    };
  }

  if (templateKey === "new-drop") {
    // Defaults for the marketing/new-drop template. Hero image is embedded
    // as a base64 data URL (men's-page hero) so it always renders in the
    // recipient's inbox without needing a public image host.
    return {
      ...sharedVars,
      heroImageUrl: getDefaultHeroDataUrl(),
      collectionName: "AW/26 — THE NEW DROP",
      promoCode: "EARLY10",
      promoCopy: "10% off your first piece — for our subscribers only.",
      newArrivalsUrl: `${baseUrl}/men`,
      unsubscribeUrl: `${baseUrl}/account/preferences`,
      instagramUrl: "https://instagram.com/dvsk.clo",
      websiteUrl: baseUrl,
      // Surface a few products from the order as cards in the new-drop email.
      // (Falls back to the order items the customer already has in their bag.)
      products: await Promise.all(
        order.items.slice(0, 3).map(async (it) => ({
          imageUrl: await absUrl(it.image),
          name: it.productName,
          meta: `${it.color} · Size ${it.size}`,
          price: formatINR(Number(it.totalPrice)),
          shopUrl: `${baseUrl}/men`,
        }))
      ),
      ...overrides,
    };
  }

  return { ...sharedVars, ...overrides };
}
