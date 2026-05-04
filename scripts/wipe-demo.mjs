#!/usr/bin/env node
/**
 * DVSK Demo Wipe — clears ALL test data so you can start fresh.
 *
 * Removes:
 *   - All orders, payments, addresses
 *   - All products, variants, images
 *   - All categories (auto-recreated when you make new products)
 *   - All carts, wishlists, reviews
 *   - All campaigns, automations, gift cards, markets, catalogs, companies
 *   - All purchase orders
 *   - All customer users (ADMINs are preserved)
 *   - All locally-stored uploaded images
 *
 * Usage (from c:\Users\krish\DVSK):
 *   node scripts/wipe-demo.mjs --confirm
 *   node scripts/wipe-demo.mjs --confirm --backend http://localhost:5000
 */

import readline from "readline";

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  return args[i + 1] ?? def;
};
const has = (name) => args.includes(`--${name}`);

const BACKEND = flag("backend", "http://localhost:5000");
const SKIP_PROMPT = has("confirm");

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (a) => {
      rl.close();
      resolve(a);
    });
  });
}

async function main() {
  console.log(`\n🧹 DVSK Demo Wipe`);
  console.log(`   Backend: ${BACKEND}\n`);
  console.log(`This will delete EVERYTHING from the DB:`);
  console.log(`   • All orders, products, customers, addresses`);
  console.log(`   • All campaigns, automations, gift cards, markets, catalogs, companies`);
  console.log(`   • All purchase orders, wishlists, reviews, coupons`);
  console.log(`   • All locally-stored uploaded images`);
  console.log(`\n   Admin accounts (your login) will be PRESERVED.\n`);

  if (!SKIP_PROMPT) {
    const answer = await ask(`Type DELETE to confirm: `);
    if (answer.trim() !== "DELETE") {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  console.log("\nWiping...");
  try {
    const r = await fetch(`${BACKEND}/api/dev/wipe-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "WIPE_DVSK_DATA" }),
    });
    const body = await r.json();
    if (!body?.success) {
      console.error(`\n✗ Wipe failed: ${body?.error?.message || body?.message || "unknown error"}`);
      process.exit(1);
    }
    const counts = body.data?.counts || {};
    console.log(`\n✓ Wipe complete.\n`);
    const order = [
      "products", "productVariants", "productImages", "categories",
      "orders", "orderItems", "payments", "addresses", "customers",
      "carts", "cartItems", "wishlists", "wishlistItems", "reviews",
      "campaigns", "automations", "giftCards", "markets", "catalogs", "companies",
      "purchaseOrders", "purchaseOrderItems", "coupons", "uploadedFiles",
    ];
    for (const key of order) {
      const n = counts[key] ?? 0;
      const pad = key.padEnd(20, " ");
      console.log(`   ${pad} ${n}`);
    }
    console.log(`\nYour admin login still works. Add new products from /products/inventory and you're off.\n`);
    console.log(`📋 IMPORTANT — clear browser-side caches too:`);
    console.log(`   In your admin panel browser tab, open devtools (F12) → Console, paste and run:`);
    console.log(`\n     ['dvsk_chats','dvsk_notifications','dvsk_transfers_v2','logistics_transfers'].forEach(k=>localStorage.removeItem(k));location.reload();\n`);
    console.log(`   Then refresh. This clears stale chat history, notifications, and any cached transfers.\n`);
  } catch (err) {
    console.error(`\n✗ Couldn't reach backend: ${err.message}`);
    console.error(`   Make sure 'npm run dev' is running in c:\\Users\\krish\\DVSK\\backend\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
