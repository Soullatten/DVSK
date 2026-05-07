import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import { fileURLToPath } from "url";

// ── Where the HTML files live ────────────────────────────────────────────────
// User keeps the email templates in `c:\Users\krish\DVSK\src\assets\Email`
// (i.e. inside the storefront repo, NOT the backend). Both repos sit next to
// each other on disk, so we resolve the path relative to this file.
//
//   <project>/backend/src/modules/email/email.templates.ts   ← __dirname
//   <project>/src/assets/Email                               ← templates dir
//
// That's `../../../../src/assets/Email` from this file.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const TEMPLATES_DIR = path.resolve(__dirname, "../../../../src/assets/Email");

// ── Catalog of available templates ───────────────────────────────────────────
// Each entry maps a stable `key` → its filename + the variables the admin can
// edit/preview in the UI. The `defaults` object is used for the live preview
// so the admin sees a realistic-looking email even before picking an order.
export interface TemplateDescriptor {
  key: string;
  label: string;
  description: string;
  filename: string;
  // Default subject line — admin can override per send
  defaultSubject: string;
  // Variable schema (so the admin UI can render an editable form)
  variables: Array<{
    name: string;
    label: string;
    sample: string;
    multiline?: boolean;
    list?: boolean; // true if this is a {{#each items}} loop
  }>;
}

export const TEMPLATE_CATALOG: TemplateDescriptor[] = [
  {
    key: "order-confirmation",
    label: "Order Confirmation",
    description: "Sent right after a customer places an order. Confirms items + total + shipping address.",
    filename: "dvsk-order-confirmation.html",
    defaultSubject: "Order #{{orderNumber}} confirmed — DVSK",
    variables: [
      { name: "orderNumber", label: "Order number", sample: "DVSK-1024" },
      { name: "viewOrderUrl", label: "View order URL", sample: "https://dvsk.app/orders/DVSK-1024" },
      { name: "shippingName", label: "Shipping name", sample: "Krishiv Rajput" },
      { name: "addressLine1", label: "Address line 1", sample: "12 Brigade Road" },
      { name: "addressLine2", label: "Address line 2", sample: "Apt 4B" },
      { name: "city", label: "City", sample: "Mumbai" },
      { name: "state", label: "State", sample: "Maharashtra" },
      { name: "pincode", label: "Pincode", sample: "400001" },
      { name: "subtotal", label: "Subtotal (₹)", sample: "4,200" },
      { name: "shipping", label: "Shipping (₹)", sample: "149" },
      { name: "discount", label: "Discount (₹)", sample: "0" },
      { name: "total", label: "Total (₹)", sample: "4,349" },
      { name: "items", label: "Items", sample: "[order items]", list: true },
    ],
  },
  {
    key: "order-tracking",
    label: "Order Tracking / Shipped",
    description: "Sent when admin marks an order as shipped. Includes tracking link + courier.",
    filename: "dvsk-order-tracking.html",
    defaultSubject: "Your DVSK order #{{orderNumber}} is on the way",
    variables: [
      { name: "orderNumber", label: "Order number", sample: "DVSK-1024" },
      { name: "trackingNumber", label: "Tracking number", sample: "AWB12345678" },
      { name: "courier", label: "Courier", sample: "Delhivery" },
      { name: "estimatedDelivery", label: "Estimated delivery", sample: "Oct 12, 2026" },
      { name: "destination", label: "Destination", sample: "Mumbai, MH" },
      { name: "trackUrl", label: "Track URL", sample: "https://delhivery.com/track/AWB12345678" },
      { name: "shopUrl", label: "Shop URL", sample: "https://dvsk.app" },
      { name: "items", label: "Items", sample: "[order items]", list: true },
    ],
  },
  {
    key: "new-drop",
    label: "New Drop / Marketing",
    description: "Manual broadcast for a new collection / promo. Requires a hero image URL.",
    filename: "dvsk-new-drop.html",
    defaultSubject: "{{collectionName}} — the new DVSK drop is live",
    variables: [
      { name: "heroImageUrl", label: "Hero image URL", sample: "https://dvsk.app/cdn/aw26-hero.jpg" },
      { name: "collectionName", label: "Collection name", sample: "AW/26 — OBSIDIAN" },
      { name: "promoCode", label: "Promo code", sample: "FIRST10" },
      { name: "promoCopy", label: "Promo subline", sample: "10% off your first piece" },
      { name: "shopUrl", label: "Shop URL", sample: "https://dvsk.app/shop" },
      { name: "newArrivalsUrl", label: "New arrivals URL", sample: "https://dvsk.app/new" },
      { name: "unsubscribeUrl", label: "Unsubscribe URL", sample: "https://dvsk.app/unsub" },
      { name: "instagramUrl", label: "Instagram URL", sample: "https://instagram.com/dvsk" },
      { name: "websiteUrl", label: "Website URL", sample: "https://dvsk.app" },
      { name: "products", label: "Products", sample: "[product cards]", list: true },
    ],
  },
];

export function findTemplate(key: string): TemplateDescriptor | null {
  return TEMPLATE_CATALOG.find((t) => t.key === key) || null;
}

// ── Compile + cache templates so we re-read disk only on first use ───────────
const compiledCache = new Map<string, HandlebarsTemplateDelegate<any>>();

function loadAndCompile(filename: string) {
  const cached = compiledCache.get(filename);
  if (cached) return cached;
  const fullPath = path.join(TEMPLATES_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Email template not found: ${fullPath}`);
  }
  const source = fs.readFileSync(fullPath, "utf-8");
  const compiled = handlebars.compile(source, { noEscape: false });
  compiledCache.set(filename, compiled);
  return compiled;
}

/** Render a template's HTML by key with the given variables filled in. */
export function renderTemplate(key: string, vars: Record<string, any>): string {
  const tpl = findTemplate(key);
  if (!tpl) throw new Error(`Unknown email template: ${key}`);
  const compiled = loadAndCompile(tpl.filename);
  return compiled(vars);
}

/** Render the subject line with the same Handlebars vars. */
export function renderSubject(key: string, customSubject: string | undefined, vars: Record<string, any>): string {
  const tpl = findTemplate(key);
  if (!tpl) throw new Error(`Unknown email template: ${key}`);
  const subjectTemplate = handlebars.compile(customSubject || tpl.defaultSubject);
  return subjectTemplate(vars).trim();
}

/** Build a sample-data object for the live UI preview (uses the .sample fields). */
export function buildSampleVars(key: string): Record<string, any> {
  const tpl = findTemplate(key);
  if (!tpl) return {};
  const out: Record<string, any> = {};
  for (const v of tpl.variables) {
    if (v.list) {
      // Default list samples — three items so the loop visually has content
      if (v.name === "items") {
        out.items = [
          { imageUrl: "https://dvsk.app/cdn/sample-1.jpg", name: "Obsidian Hoodie", variant: "Black", size: "M", quantity: 1, price: "2,400" },
          { imageUrl: "https://dvsk.app/cdn/sample-2.jpg", name: "Cargo Trouser", variant: "Pearl", size: "32", quantity: 1, price: "1,800" },
        ];
      } else if (v.name === "products") {
        out.products = [
          { imageUrl: "https://dvsk.app/cdn/sample-1.jpg", name: "Obsidian Hoodie", meta: "Black · M/L/XL", price: "2,400", shopUrl: "https://dvsk.app/p/obsidian-hoodie" },
          { imageUrl: "https://dvsk.app/cdn/sample-2.jpg", name: "Cargo Trouser", meta: "Pearl · 30/32/34", price: "1,800", shopUrl: "https://dvsk.app/p/cargo-trouser" },
        ];
      } else {
        out[v.name] = [];
      }
    } else {
      out[v.name] = v.sample;
    }
  }
  return out;
}
